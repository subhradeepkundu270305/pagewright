import type { ConversionSettings, AIEnhancementData } from '../utils/types';
import type { AIProvider } from './AIProvider';
import { GroqProvider } from './providers/GroqProvider';
import { ChromeAIProvider } from './providers/ChromeAIProvider';
import { OllamaProvider } from './providers/OllamaProvider';

export function getProvider(settings: ConversionSettings): AIProvider | null {
  const { ai } = settings;
  if (!ai || ai.provider === 'disabled') {
    return null;
  }

  switch (ai.provider) {
    case 'groq':
      return new GroqProvider(ai.groqApiKey, ai.groqModel);
    case 'chrome':
      return new ChromeAIProvider();
    case 'ollama':
      return new OllamaProvider(ai.ollamaEndpoint, ai.ollamaModel);
    default:
      return null;
  }
}

export async function testAIProvider(
  settings: ConversionSettings
): Promise<{ success: boolean; message: string; model?: string }> {
  const provider = getProvider(settings);
  if (!provider) {
    return {
      success: false,
      message: 'No AI provider selected (provider is disabled)',
    };
  }

  if (typeof provider.testConnection === 'function') {
    return await provider.testConnection();
  }

  const available = await provider.isAvailable();
  return {
    success: available,
    message: available ? `Provider "${provider.name}" is ready` : `Provider "${provider.name}" is unavailable`,
  };
}

export async function processAIEnhancements(
  html: string,
  currentTitle: string,
  settings: ConversionSettings
): Promise<AIEnhancementData> {
  const result: AIEnhancementData = {};
  const isStudyNotesMode = settings.mode === 'study-notes';
  const wantsAi =
    isStudyNotesMode ||
    settings.ai?.includeSummary ||
    settings.ai?.includeTableOfContents ||
    settings.ai?.smartTitle;

  if (!wantsAi) {
    return result;
  }

  const provider = getProvider(settings);
  if (!provider) {
    console.info('No active AI provider configured, proceeding with standard rendering');
    return result;
  }

  try {
    // 1. Study notes mode
    if (isStudyNotesMode) {
      try {
        const notes = await provider.generateStudyNotes(html);
        result.studyNotes = notes;
      } catch (e) {
        const errMsg = (e as Error).message;
        console.warn('Study notes generation failed:', errMsg);
        result.error = errMsg;
      }
    }

    // 2. Smart Title
    if (settings.ai?.smartTitle) {
      try {
        const title = await provider.generateTitle(html);
        if (title && title.length > 2) {
          result.smartTitle = title;
        }
      } catch (e) {
        console.warn('Smart title generation failed:', e);
        if (!result.error) result.error = (e as Error).message;
      }
    }

    // 3. Executive Summary
    if (settings.ai?.includeSummary && !isStudyNotesMode) {
      try {
        const summary = await provider.generateSummary(html);
        if (summary) {
          result.summary = summary;
        }
      } catch (e) {
        console.warn('Summary generation failed:', e);
        if (!result.error) result.error = (e as Error).message;
      }
    }

    // 4. Table of Contents
    if (settings.ai?.includeTableOfContents) {
      try {
        const toc = await provider.generateTableOfContents(html);
        if (toc && toc.length > 0) {
          result.tableOfContents = toc;
        }
      } catch (e) {
        console.warn('Table of contents generation failed:', e);
        if (!result.error) result.error = (e as Error).message;
      }

      if (!result.tableOfContents || result.tableOfContents.length === 0) {
        const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi;
        const toc = [];
        let match;
        while ((match = headingRegex.exec(html)) !== null) {
          const level = parseInt(match[1], 10);
          const title = match[2].replace(/<[^>]+>/g, '').trim();
          if (title) {
            toc.push({ title, level });
          }
        }
        if (toc.length > 0) {
          result.tableOfContents = toc;
        }
      }
    }
  } catch (error) {
    const errMsg = (error as Error).message;
    console.error('AI processing general failure, falling back gracefully:', errMsg);
    result.error = errMsg;
  }

  return result;
}
