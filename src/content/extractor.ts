import { Readability } from '@mozilla/readability';
import { cleanHtml, sanitizeHtml, CleanOptions } from './cleaner';
import { resolveLazyImages } from './lazyImages';
import { startElementPicker } from './picker';
import { resolveAllUrlsToAbsolute } from '../utils/urlResolver';
import type { ConversionMode, ExtractionResult } from '../utils/types';

function createCleanedClone(options: CleanOptions): Document {
  // Step 1: In the live document, tag elements that are fixed, sticky, or hidden
  const taggedElements: Element[] = [];

  try {
    const allLiveElements = document.querySelectorAll('*');
    allLiveElements.forEach((el) => {
      if (
        el === document.documentElement ||
        el === document.body ||
        el === document.head ||
        el.tagName === 'HTML' ||
        el.tagName === 'BODY' ||
        el.tagName === 'HEAD'
      ) {
        return;
      }

      try {
        const style = window.getComputedStyle(el);
        if (style.position === 'fixed' || style.position === 'sticky') {
          // Guard: don't remove if this element contains the main article container
          const hasMainContent = el.querySelector('article, [role="main"], main, #readme');
          if (!hasMainContent) {
            el.setAttribute('data-pw-remove', 'true');
            taggedElements.push(el);
          }
        } else if (style.display === 'none' || style.visibility === 'hidden') {
          const hasContent = el.querySelector('img, svg, picture, p, h1, h2, h3, h4, h5, h6, table, ul, ol') || (el.textContent && el.textContent.trim().length > 25);
          if (hasContent) {
            el.setAttribute('data-pw-unhide', 'true');
            taggedElements.push(el);
          } else {
            el.setAttribute('data-pw-remove', 'true');
            taggedElements.push(el);
          }
        }
      } catch {
        // Ignore errors on specific elements
      }
    });
  } catch {
    // If live querying fails, proceed with standard cloning
  }

  // Step 2: Clone the document while tags are present
  const clone = document.cloneNode(true) as Document;

  // Unhide substantive content that was hidden in tabs or accordions
  clone.querySelectorAll('[data-pw-unhide]').forEach((el) => {
    el.removeAttribute('data-pw-unhide');
    const htmlEl = el as HTMLElement;
    if (htmlEl.style) {
      htmlEl.style.display = 'block';
      htmlEl.style.visibility = 'visible';
    }
  });

  // Ensure all <details> elements are open in the clone
  clone.querySelectorAll('details').forEach((d) => {
    d.setAttribute('open', 'true');
  });

  // Step 3: Immediately remove the temporary tags from the live DOM
  taggedElements.forEach((el) => {
    el.removeAttribute('data-pw-remove');
    el.removeAttribute('data-pw-unhide');
  });

  // Step 4: Run cleanHtml on the clone
  cleanHtml(clone, options);

  return clone;
}

async function extractContent(
  mode: ConversionMode,
  options: CleanOptions,
  selectedElementSubtree?: HTMLElement
): Promise<ExtractionResult> {
  const initialMode = mode;
  const baseUrl = document.baseURI || window.location.href;

  // 1. Resolve lazy-loaded images in the live DOM before cloning
  if (options.includeImages) {
    try {
      await resolveLazyImages(document);
    } catch (e) {
      console.warn('Lazy image resolution warning:', e);
    }
  }

  // 2. If a specific element was chosen via element picker
  if (selectedElementSubtree) {
    const tempDoc = document.implementation.createHTMLDocument();
    const clonedSubtree = selectedElementSubtree.cloneNode(true) as HTMLElement;
    tempDoc.body.appendChild(clonedSubtree);
    cleanHtml(tempDoc, options);
    resolveAllUrlsToAbsolute(tempDoc, baseUrl);

    const tagName = selectedElementSubtree.tagName.toLowerCase();
    const cleanTitle = document.title ? `${document.title} (${tagName})` : `Selected ${tagName}`;

    return {
      title: cleanTitle,
      html: sanitizeHtml(tempDoc.body.innerHTML),
      url: window.location.href,
      mode: 'selected-content',
    };
  }

  if (mode === 'reader-mode' || mode === 'study-notes') {
    // Check for high-priority documentation containers (e.g. GitHub README)
    const githubReadme = document.querySelector('article.markdown-body, #readme');
    if (githubReadme) {
      const readmeClone = githubReadme.cloneNode(true) as HTMLElement;
      const tempDoc = document.implementation.createHTMLDocument();
      tempDoc.body.appendChild(readmeClone);
      cleanHtml(tempDoc, options);
      resolveAllUrlsToAbsolute(tempDoc, baseUrl);

      return {
        title: document.title,
        html: sanitizeHtml(tempDoc.body.innerHTML),
        url: window.location.href,
        mode: initialMode,
        siteName: 'GitHub',
      };
    }

    const clone = createCleanedClone(options);
    resolveAllUrlsToAbsolute(clone, baseUrl);
    const article = new Readability(clone, {
      charThreshold: 100,
      keepClasses: true,
    }).parse();

    if (article && article.content && article.content.trim().length > 100) {
      return {
        title: article.title || document.title,
        html: sanitizeHtml(article.content),
        url: window.location.href,
        mode: initialMode,
        byline: article.byline ?? undefined,
        siteName: article.siteName ?? undefined,
      };
    }

    // Fall back to full-page mode if Readability fails or produces negligible content
    mode = 'full-page';
  }

  if (mode === 'full-page') {
    const clone = createCleanedClone(options);
    resolveAllUrlsToAbsolute(clone, baseUrl);
    const bodyEl = clone.body || clone.querySelector('body') || clone.documentElement;

    return {
      title: document.title || 'Document',
      html: sanitizeHtml(bodyEl ? bodyEl.innerHTML : clone.innerHTML),
      url: window.location.href,
      mode: initialMode,
    };
  }

  if (mode === 'selected-content') {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      throw new Error('No content selected. Please highlight text on the page first, or use the Element Picker.');
    }

    const range = selection.getRangeAt(0);
    const clonedContents = range.cloneContents();

    const tempDiv = document.createElement('div');
    tempDiv.appendChild(clonedContents);
    resolveAllUrlsToAbsolute(tempDiv, baseUrl);

    return {
      title: `${document.title || 'Page'} (Selection)`,
      html: sanitizeHtml(tempDiv.innerHTML),
      url: window.location.href,
      mode: initialMode,
    };
  }

  throw new Error(`Unsupported mode: ${mode}`);
}

// Top-level message listener for content script actions
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'EXTRACT_CONTENT') {
    extractContent(message.payload.mode, message.payload.options)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((error) => sendResponse({ success: false, error: (error as Error).message }));
    return true; // Keep channel open for async response
  }

  if (message.type === 'START_PICKER') {
    startElementPicker()
      .then(async (element) => {
        if (!element) {
          sendResponse({ success: false, cancelled: true });
          return;
        }

        const options: CleanOptions = message.payload?.options ?? {
          removeAds: true,
          removeNavigation: true,
          includeImages: true,
          includeLinks: true,
        };

        const result = await extractContent('selected-content', options, element);
        sendResponse({ success: true, data: result });
      })
      .catch((error) => {
        sendResponse({ success: false, error: (error as Error).message });
      });
    return true; // Keep channel open
  }

  return false;
});

// Signal to background script that content script is initialized
(window as any).__PAGEWRIGHT_INJECTED__ = true;
