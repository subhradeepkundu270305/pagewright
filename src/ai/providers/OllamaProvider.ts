import type { AIProvider, StudyNotesData, TocItem } from '../AIProvider';

export class OllamaProvider implements AIProvider {
  readonly id = 'ollama';
  readonly name = 'Local Ollama';

  constructor(
    private endpoint: string = 'http://localhost:11434',
    private model: string = 'llama3.2'
  ) {}

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${this.endpoint}/api/tags`, {
        signal: AbortSignal.timeout(2000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string; model: string }> {
    try {
      const res = await fetch(`${this.endpoint}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) {
        return {
          success: false,
          message: `Ollama returned HTTP ${res.status}`,
          model: this.model,
        };
      }
      const data = await res.json();
      const models = Array.isArray(data.models) ? data.models.map((m: { name?: string }) => m.name || '') : [];
      const hasModel = models.some((m: string) => m.startsWith(this.model) || m.includes(this.model));
      return {
        success: true,
        message: hasModel
          ? `Connected to Ollama! Model "${this.model}" found.`
          : `Connected to Ollama! (Model "${this.model}" might need "ollama run ${this.model}")`,
        model: this.model,
      };
    } catch (e) {
      return {
        success: false,
        message: `Could not reach Ollama at ${this.endpoint}: ${(e as Error).message}`,
        model: this.model,
      };
    }
  }

  private cleanText(rawText: string, maxLength: number = 15000): string {
    const text = rawText
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
  }

  private async callChat(systemPrompt: string, userPrompt: string, formatJson = false): Promise<string> {
    const body: Record<string, unknown> = {
      model: this.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: false,
    };

    if (formatJson) {
      body.format = 'json';
    }

    const res = await fetch(`${this.endpoint}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      if (res.status === 403) {
        throw new Error(
          'Ollama blocked the request (403 Forbidden). ' +
          'Set OLLAMA_ORIGINS=* before starting Ollama: ' +
          '`OLLAMA_ORIGINS="*" ollama serve`'
        );
      }
      throw new Error(`Ollama request failed (${res.status})`);
    }

    const data = await res.json();
    return data.message?.content?.trim() || '';
  }

  async generateTitle(content: string): Promise<string> {
    const text = this.cleanText(content, 4000);
    const system = 'You are an editor. Generate a clean title for the document (max 10 words). Return ONLY the title text.';
    const prompt = `Text:\n${text}`;
    const result = await this.callChat(system, prompt);
    return result.replace(/^["']|["']$/g, '').trim();
  }

  async generateSummary(content: string): Promise<string> {
    const text = this.cleanText(content);
    const system = 'Summarize the document in 2-3 concise paragraphs. Return only the summary text.';
    const prompt = `Document:\n${text}`;
    return await this.callChat(system, prompt);
  }

  async generateTableOfContents(content: string): Promise<TocItem[]> {
    const text = this.cleanText(content);
    const system = 'Extract a table of contents outline. Return a JSON object with a "toc" list of strings: { "toc": ["Heading 1", "Heading 2"] }';
    const prompt = `Content:\n${text}`;
    const raw = await this.callChat(system, prompt, true);

    try {
      const parsed = JSON.parse(raw);
      const list = parsed.toc || parsed.headings || parsed;
      if (Array.isArray(list)) {
        return list.map((item) => ({
          title: typeof item === 'string' ? item : (item.title || String(item)),
          level: 1,
        }));
      }
    } catch {
      // Fallback
    }
    return [];
  }

  async generateStudyNotes(content: string): Promise<StudyNotesData> {
    const text = this.cleanText(content);
    const system = `Convert the text into study notes. Return a JSON object:
{
  "keyConcepts": ["Concept 1...", "Concept 2..."],
  "summary": "Short summary...",
  "bulletPoints": ["Point 1...", "Point 2..."],
  "reviewQuestions": ["Question 1...", "Question 2..."]
}`;
    const prompt = `Text:\n${text}`;
    const raw = await this.callChat(system, prompt, true);

    try {
      const parsed = JSON.parse(raw);
      return {
        keyConcepts: Array.isArray(parsed.keyConcepts) ? parsed.keyConcepts : [],
        summary: typeof parsed.summary === 'string' ? parsed.summary : '',
        bulletPoints: Array.isArray(parsed.bulletPoints) ? parsed.bulletPoints : [],
        reviewQuestions: Array.isArray(parsed.reviewQuestions) ? parsed.reviewQuestions : [],
      };
    } catch {
      return {
        keyConcepts: [],
        summary: raw,
        bulletPoints: [],
        reviewQuestions: [],
      };
    }
  }
}
