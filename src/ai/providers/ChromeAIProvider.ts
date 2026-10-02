import type { AIProvider, StudyNotesData, TocItem } from '../AIProvider';

interface ChromeAIModel {
  prompt(text: string): Promise<string>;
  destroy?(): void;
}

interface ChromeAILanguageModelFactory {
  capabilities(): Promise<{ available: 'readily' | 'after-download' | 'no' }>;
  create(): Promise<ChromeAIModel>;
}

declare global {
  interface Window {
    ai?: {
      languageModel?: ChromeAILanguageModelFactory;
    };
  }
}

export class ChromeAIProvider implements AIProvider {
  readonly id = 'chrome';
  readonly name = 'Chrome Built-in AI (On-Device)';

  async isAvailable(): Promise<boolean> {
    try {
      const aiObj = (globalThis as unknown as { ai?: { languageModel?: ChromeAILanguageModelFactory } }).ai;
      if (!aiObj?.languageModel) return false;
      const caps = await aiObj.languageModel.capabilities();
      return caps.available === 'readily';
    } catch {
      return false;
    }
  }

  private cleanText(rawText: string, maxLength: number = 8000): string {
    const text = rawText
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
  }

  private async promptModel(promptText: string): Promise<string> {
    const aiObj = (globalThis as unknown as { ai?: { languageModel?: ChromeAILanguageModelFactory } }).ai;
    if (!aiObj?.languageModel) {
      throw new Error('Chrome on-device AI is not available in this browser environment');
    }
    const session = await aiObj.languageModel.create();
    try {
      return await session.prompt(promptText);
    } finally {
      if (session.destroy) {
        session.destroy();
      }
    }
  }

  async generateTitle(content: string): Promise<string> {
    const text = this.cleanText(content, 3000);
    const result = await this.promptModel(`Provide a brief, clean document title (under 10 words) for the following text. Return only the title:\n${text}`);
    return result.replace(/^["']|["']$/g, '').trim();
  }

  async generateSummary(content: string): Promise<string> {
    const text = this.cleanText(content);
    return await this.promptModel(`Write a concise executive summary (2 short paragraphs) for the following content:\n${text}`);
  }

  async generateTableOfContents(content: string): Promise<TocItem[]> {
    const text = this.cleanText(content);
    const result = await this.promptModel(
      `List the main headings and sections for this content. Put each on a new line starting with a dash:\n${text}`
    );
    const lines = result.split('\n');
    const items: TocItem[] = [];
    for (const line of lines) {
      const cleaned = line.replace(/^[-*•\d.]+\s*/, '').trim();
      if (cleaned.length > 2 && cleaned.length < 80) {
        items.push({ title: cleaned, level: 1 });
      }
    }
    return items;
  }

  async generateStudyNotes(content: string): Promise<StudyNotesData> {
    const text = this.cleanText(content);
    const summary = await this.generateSummary(text);
    const takeaways = await this.promptModel(`List 5 important bullet-point takeaways from this text:\n${text}`);
    const questions = await this.promptModel(`Generate 3 review questions to test comprehension of this text:\n${text}`);

    const bulletPoints = takeaways
      .split('\n')
      .map((l) => l.replace(/^[-*•\d.]+\s*/, '').trim())
      .filter((l) => l.length > 5);

    const reviewQuestions = questions
      .split('\n')
      .map((l) => l.replace(/^[-*•\d.]+\s*/, '').trim())
      .filter((l) => l.length > 5);

    return {
      keyConcepts: [],
      summary,
      bulletPoints,
      reviewQuestions,
    };
  }
}
