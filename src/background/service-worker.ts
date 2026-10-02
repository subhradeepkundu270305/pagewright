import type { ConversionSettings, ConversionStep, ExtractionResult } from '../utils/types';
import { DEFAULT_SETTINGS } from '../utils/types';
import { ChromePdfEngine } from '../pdf/chromePdfEngine';
import { buildPdfOptions } from '../pdf/PdfEngine';
import { generateFilename } from '../utils/filename';
import { isRestrictedPage, getRestrictedPageMessage } from '../utils/restricted-pages';
import { processAIEnhancements, testAIProvider } from '../ai/aiManager';

// Transient coordination state — maps render tab IDs to their readiness resolvers
const renderReadyResolvers = new Map<number, () => void>();

// Initialize default settings on install
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    try {
      await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
    } catch (e) {
      console.error('Failed to set default settings:', e);
    }
  }

  // Migrate deprecated model IDs on update
  if (details.reason === 'update') {
    try {
      const data = await chrome.storage.sync.get('settings');
      if (data.settings?.ai?.groqModel) {
        const deprecated = [
          'llama-3.1-8b-instant',
          'llama-3.3-70b-versatile',
          'gemma2-9b-it',
          'llama-3.2-90b-text-preview',
          'llama-3.2-11b-text-preview',
        ];
        if (deprecated.includes(data.settings.ai.groqModel)) {
          data.settings.ai.groqModel = 'qwen/qwen3.8-27b';
          await chrome.storage.sync.set({ settings: data.settings });
          console.info('Migrated deprecated Groq model to qwen/qwen3.8-27b');
        }
      }
    } catch (e) {
      console.error('Failed to migrate settings:', e);
    }
  }
});

// Main message handler — registered synchronously at top level
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_CONVERSION') {
    const payload = message.payload as { settings: ConversionSettings; tabId?: number };
    handleConversion(payload.settings, payload.tabId)
      .then((result) => sendResponse(result))
      .catch((err) => {
        sendResponse({ success: false, error: err instanceof Error ? err.message : String(err) });
      });
    return true;
  }

  if (message.type === 'START_PICKER') {
    const payload = message.payload as { settings: ConversionSettings; tabId?: number };
    handleElementPicker(payload.settings, payload.tabId)
      .then((result) => sendResponse(result))
      .catch((err) => {
        sendResponse({ success: false, error: err instanceof Error ? err.message : String(err) });
      });
    return true;
  }

  if (message.type === 'GET_SETTINGS') {
    chrome.storage.sync.get('settings')
      .then((data) => {
        const settings = data.settings
          ? { ...DEFAULT_SETTINGS, ...data.settings }
          : DEFAULT_SETTINGS;
        sendResponse({ success: true, settings });
      })
      .catch((err) => {
        sendResponse({ success: false, error: err instanceof Error ? err.message : String(err) });
      });
    return true;
  }

  if (message.type === 'SAVE_SETTINGS') {
    const payload = message.payload as { settings: ConversionSettings };
    chrome.storage.sync.set({ settings: payload.settings })
      .then(() => sendResponse({ success: true }))
      .catch((err) => {
        sendResponse({ success: false, error: err instanceof Error ? err.message : String(err) });
      });
    return true;
  }

  if (message.type === 'TEST_AI_CONNECTION') {
    const payload = message.payload as { settings: ConversionSettings };
    testAIProvider(payload.settings)
      .then((result) => sendResponse(result))
      .catch((err) => {
        sendResponse({ success: false, message: err instanceof Error ? err.message : String(err) });
      });
    return true;
  }

  if (message.type === 'RENDER_READY') {
    if (sender.tab?.id) {
      const resolver = renderReadyResolvers.get(sender.tab.id);
      if (resolver) {
        resolver();
        renderReadyResolvers.delete(sender.tab.id);
      }
    }
    sendResponse({ success: true });
    return true;
  }

  return false;
});

async function getActiveTabInfo(providedTabId?: number): Promise<{ tabId: number; url: string; title: string }> {
  let tabId: number;
  let url = '';
  let title = 'Document';

  if (providedTabId) {
    tabId = providedTabId;
    try {
      const tab = await chrome.tabs.get(tabId);
      url = tab.url ?? '';
      title = tab.title ?? title;
    } catch {
      // tabs permission may not be active for full URL
    }
  } else {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0 || !tabs[0].id) {
      throw new Error('No active tab found');
    }
    tabId = tabs[0].id;
    url = tabs[0].url ?? '';
    title = tabs[0].title ?? title;
  }

  if (url && isRestrictedPage(url)) {
    throw new Error(getRestrictedPageMessage(url));
  }

  return { tabId, url, title };
}

async function ensureContentScriptInjected(tabId: number): Promise<void> {
  try {
    const probe = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => !!(window as any).__PAGEWRIGHT_INJECTED__,
    });
    if (probe && probe[0] && probe[0].result) {
      return; // Already injected and listening
    }
  } catch {
    // Probing may fail on restricted tabs; execution below will handle/throw proper error
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content-script.js'],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Cannot access') || msg.includes('extensions gallery') || msg.includes('restricted')) {
      throw new Error('Chrome does not allow extensions to run on this page. Please navigate to a normal website (e.g. Wikipedia or an article).');
    }
    console.warn('Script injection note:', msg);
  }
}

async function sendTabMessageWithRetry<T>(tabId: number, message: unknown, retries = 2): Promise<T> {
  let lastError: Error | undefined;
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await chrome.tabs.sendMessage(tabId, message);
      return response as T;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (i < retries) {
        await sleep(150);
      }
    }
  }
  throw lastError;
}

async function handleConversion(
  settings: ConversionSettings,
  providedTabId?: number
): Promise<{ success: boolean; error?: string; preview?: boolean }> {
  try {
    const { tabId, url, title } = await getActiveTabInfo(providedTabId);

    // Step 1: Notify popup — extracting
    await broadcastProgress('extracting');

    // Step 2: Inject content script on demand
    await ensureContentScriptInjected(tabId);

    // Step 3: Extract content with retry in case script is settling
    const extractResponse = await sendTabMessageWithRetry<{ success: boolean; data?: ExtractionResult; error?: string }>(tabId, {
      type: 'EXTRACT_CONTENT',
      payload: {
        mode: settings.mode,
        options: {
          removeAds: settings.removeAds,
          removeNavigation: settings.removeNavigation,
          includeImages: settings.includeImages,
          includeLinks: settings.includeLinks,
        },
      },
    });

    if (!extractResponse?.success || !extractResponse.data) {
      throw new Error(extractResponse?.error ?? 'Content extraction failed');
    }

    const extracted: ExtractionResult = extractResponse.data;
    const finalTitle = extracted.title || title;

    return await renderAndOutputPdf(extracted, settings, finalTitle, url);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await broadcastProgress('error', errorMessage);
    return { success: false, error: errorMessage };
  }
}

async function handleElementPicker(
  settings: ConversionSettings,
  providedTabId?: number
): Promise<{ success: boolean; error?: string; cancelled?: boolean; preview?: boolean }> {
  try {
    const { tabId, url, title } = await getActiveTabInfo(providedTabId);

    await ensureContentScriptInjected(tabId);

    // Send picker activation to content script with retry
    const pickerResponse = await sendTabMessageWithRetry<{ success: boolean; data?: ExtractionResult; cancelled?: boolean; error?: string }>(tabId, {
      type: 'START_PICKER',
      payload: {
        options: {
          removeAds: settings.removeAds,
          removeNavigation: settings.removeNavigation,
          includeImages: settings.includeImages,
          includeLinks: settings.includeLinks,
        },
      },
    });

    if (!pickerResponse?.success) {
      if (pickerResponse?.cancelled) {
        return { success: false, cancelled: true };
      }
      throw new Error(pickerResponse?.error ?? 'Element selection cancelled or failed');
    }

    if (!pickerResponse.data) {
      throw new Error('No content returned from element picker');
    }

    const extracted: ExtractionResult = pickerResponse.data;
    const finalTitle = extracted.title || title;

    return await renderAndOutputPdf(extracted, settings, finalTitle, url);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await broadcastProgress('error', errorMessage);
    return { success: false, error: errorMessage };
  }
}

async function renderAndOutputPdf(
  extracted: ExtractionResult,
  settings: ConversionSettings,
  title: string,
  url: string
): Promise<{ success: boolean; preview?: boolean }> {
  let renderTabId: number | undefined;

  try {
    // Notify popup — cleaning
    await broadcastProgress('cleaning');

    // Optional AI Analysis step
    const isStudyNotesMode = settings.mode === 'study-notes';
    const hasAiRequested =
      isStudyNotesMode ||
      settings.ai?.includeSummary ||
      settings.ai?.includeTableOfContents ||
      settings.ai?.smartTitle;

    let aiData: import('../utils/types').AIEnhancementData | undefined;

    if (hasAiRequested && settings.ai?.provider !== 'disabled') {
      await broadcastProgress('analyzing');
      try {
        aiData = await processAIEnhancements(extracted.html, title, settings);
        if (aiData.smartTitle) {
          title = aiData.smartTitle;
        }
      } catch (e) {
        const msg = (e as Error).message;
        console.warn('AI enhancement step failed, continuing normal conversion:', msg);
        aiData = { error: msg };
      }
    }

    // Create render tab (background, not active)
    const renderTab = await chrome.tabs.create({
      url: chrome.runtime.getURL('src/render/render.html'),
      active: false,
    });

    if (!renderTab.id) {
      throw new Error('Failed to create render tab');
    }
    renderTabId = renderTab.id;

    // Wait for render page to signal readiness
    await waitForRenderReady(renderTabId);

    // Notify popup — rendering
    await broadcastProgress('rendering');

    // Send content to render page
    const renderResponse = await chrome.tabs.sendMessage(renderTabId, {
      type: 'RENDER_CONTENT',
      payload: {
        html: extracted.html,
        title,
        url,
        mode: settings.mode,
        theme: settings.theme,
        includeImages: settings.includeImages,
        byline: extracted.byline,
        siteName: extracted.siteName,
        ai: aiData,
      },
    });

    if (!renderResponse?.success) {
      throw new Error('Failed to render content in render tab');
    }

    // Small delay to ensure layout and fonts are settled
    await sleep(300);

    // Notify popup — generating PDF
    await broadcastProgress('generating');

    // Generate PDF using chrome.debugger
    const engine = new ChromePdfEngine();
    const pdfOptions = buildPdfOptions(settings, title, url);
    const base64Data = await engine.generatePdf(renderTabId, pdfOptions);

    if (!base64Data) {
      throw new Error('PDF generation returned empty data');
    }

    const filename = generateFilename(title);

    // Check if preview before download is requested
    if (settings.previewBeforeDownload) {
      await broadcastProgress('previewing');

      // Store in chrome.storage.local for preview tab to pick up
      await chrome.storage.local.set({
        pendingPreview: {
          base64: base64Data,
          filename,
          title,
        },
      });

      // Open preview tab
      await chrome.tabs.create({
        url: chrome.runtime.getURL('src/preview/preview.html'),
        active: true,
      });

      await broadcastProgress('done', 'Preview opened in new tab');
      return { success: true, preview: true };
    }

    // Default: Direct download
    await broadcastProgress('saving');

    const dataUrl = `data:application/pdf;base64,${base64Data}`;
    await chrome.downloads.download({
      url: dataUrl,
      filename,
      saveAs: false,
    });

    await broadcastProgress('done');
    return { success: true };
  } finally {
    if (renderTabId) {
      try {
        await chrome.tabs.remove(renderTabId);
      } catch {
        // Tab may already be closed
      }
    }
  }
}

function waitForRenderReady(tabId: number): Promise<void> {
  return new Promise<void>((resolve) => {
    renderReadyResolvers.set(tabId, resolve);
    setTimeout(() => {
      if (renderReadyResolvers.has(tabId)) {
        renderReadyResolvers.delete(tabId);
        resolve();
      }
    }, 10000);
  });
}

async function broadcastProgress(step: ConversionStep, message?: string): Promise<void> {
  try {
    await chrome.runtime.sendMessage({
      type: 'CONVERSION_PROGRESS',
      payload: { step, message },
    });
  } catch {
    // Popup may be closed
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
