import type { AIProvider, StudyNotesData, TocItem } from '../AIProvider';

export class GroqProvider implements AIProvider {
  readonly id = 'groq';
  readonly name = 'Groq Cloud AI';

  constructor(
    private apiKey: string,
    private model: string = 'qwen/qwen3.8-27b'
  ) {}

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey || !this.apiKey.startsWith('gsk_')) {
      return false;
    }
    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string; model: string }> {
    if (!this.apiKey || !this.apiKey.startsWith('gsk_')) {
      return {
        success: false,
        message: 'Invalid Groq API key (must begin with "gsk_")',
        model: this.model,
      };
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: 'Respond with the word OK' }],
          max_tokens: 5,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        let errMsg = `HTTP ${response.status}`;
        try {
          const parsed = JSON.parse(errText);
          if (parsed.error?.message) {
            errMsg = parsed.error.message;
          }
        } catch {
          if (errText) errMsg = errText.slice(0, 100);
        }
        return {
          success: false,
          message: `Groq error: ${errMsg}`,
          model: this.model,
        };
      }

      return {
        success: true,
        message: `Connected successfully! (${this.model} ready)`,
        model: this.model,
      };
    } catch (e) {
      return {
        success: false,
        message: `Network error: ${(e as Error).message}`,
        model: this.model,
      };
    }
  }

  cleanText(rawText: string, maxLength: number = 14000): string {
    if (!rawText) return '';

    // 1. Remove non-content and heavy tags
    let text = rawText
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/data:image\/[^;]+;base64,[^\s"'>]+/gi, '');

    // 2. Preserve logical structure by turning block element ends into newlines
    text = text.replace(/<\/(p|div|h[1-6]|li|tr|article|section|blockquote)>/gi, '\n');
    text = text.replace(/<br\s*\/?>/gi, '\n');

    // 3. Strip all remaining HTML tags
    text = text.replace(/<[^>]+>/g, ' ');

    // 4. Decode common HTML entities
    text = text
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&mdash;/gi, '—')
      .replace(/&ndash;/gi, '–');

    // 5. Clean up redundant spaces and multiple newlines
    text = text
      .split('\n')
      .map((line) => line.replace(/[^\S\r\n]+/g, ' ').trim())
      .filter((line) => line.length > 0)
      .join('\n\n');

    // 6. Truncate intelligently within token budget
    if (text.length > maxLength) {
      const headLength = Math.floor(maxLength * 0.8);
      const tailLength = maxLength - headLength - 20;
      text =
        text.slice(0, headLength) +
        '\n\n[... content truncated for token limits ...]\n\n' +
        text.slice(text.length - tailLength);
    }

    return text.trim();
  }

  private parseJsonSafely<T>(raw: string, fallback: T): T {
    if (!raw) return fallback;

    let cleaned = raw.trim();

    // Strip markdown code fences if model returned ```json ... ```
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    }

    try {
      return JSON.parse(cleaned) as T;
    } catch {
      // If direct parse failed, attempt to isolate the first JSON object or array
      const firstCurly = cleaned.indexOf('{');
      const lastCurly = cleaned.lastIndexOf('}');
      if (firstCurly !== -1 && lastCurly > firstCurly) {
        try {
          const jsonSub = cleaned.slice(firstCurly, lastCurly + 1);
          return JSON.parse(jsonSub) as T;
        } catch {}
      }

      const firstSquare = cleaned.indexOf('[');
      const lastSquare = cleaned.lastIndexOf(']');
      if (firstSquare !== -1 && lastSquare > firstSquare) {
        try {
          const jsonSub = cleaned.slice(firstSquare, lastSquare + 1);
          return JSON.parse(jsonSub) as T;
        } catch {}
      }

      return fallback;
    }
  }

  private async callChat(
    systemPrompt: string,
    userPrompt: string,
    jsonMode = false,
    modelOverride?: string
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Groq API key is missing. Please enter your API key in Settings.');
    }

    const currentModel = modelOverride || this.model || 'qwen/qwen3.8-27b';

    const body: Record<string, unknown> = {
      model: currentModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
    };

    if (jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      let errMsg = `Groq API error (${response.status}): ${errText}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error?.message) {
          errMsg = parsed.error.message;
        }
      } catch {}

      // If rate limit (429) or service overloaded (503), auto-fallback to openai/gpt-oss-20b
      if ((response.status === 429 || response.status === 503) && currentModel !== 'openai/gpt-oss-20b') {
        console.warn(`Groq model ${currentModel} returned ${response.status}. Retrying automatically with openai/gpt-oss-20b...`);
        return await this.callChat(systemPrompt, userPrompt, jsonMode, 'openai/gpt-oss-20b');
      }

      throw new Error(errMsg);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  }

  async generateTitle(content: string): Promise<string> {
    const text = this.cleanText(content, 4000);
    const system =
      'You are an expert editor. Extract or generate a clean, concise, and professional document title (maximum 8-12 words). Return ONLY the title text with no quotes, formatting, or commentary.';
    const prompt = `Page content:\n${text}`;
    const title = await this.callChat(system, prompt);
    return title.replace(/^["']|["']$/g, '').trim();
  }

  async generateSummary(content: string): Promise<string> {
    const text = this.cleanText(content, 12000);
    const system =
      'You are a research analyst. Provide a clear, high-impact executive summary (2-3 structured paragraphs) of the document. Use professional tone. Return clean text without intro or outro.';
    const prompt = `Summarize the following document:\n${text}`;
    return await this.callChat(system, prompt);
  }

  async generateTableOfContents(content: string): Promise<TocItem[]> {
    const text = this.cleanText(content, 12000);
    const system = `You are a document structuring expert. Analyze the content and return a JSON object with a "toc" array of key sections or headings. Format:
{
  "toc": [
    { "title": "Section Title", "level": 1 }
  ]
}
Return valid JSON only.`;
    const prompt = `Generate a table of contents for this content:\n${text}`;
    const raw = await this.callChat(system, prompt, true);

    const parsed = this.parseJsonSafely<{ toc?: TocItem[] } | TocItem[]>(raw, []);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (parsed && Array.isArray((parsed as { toc?: TocItem[] }).toc)) {
      return (parsed as { toc: TocItem[] }).toc;
    }

    return [];
  }

  async generateStudyNotes(content: string): Promise<StudyNotesData> {
    const text = this.cleanText(content, 14000);
    const system = `You are an elite academic tutor. Analyze the document and convert it into high-yield study notes. Return a JSON object with:
{
  "keyConcepts": ["Concept 1: Definition...", "Concept 2: Definition..."],
  "summary": "High-level overview...",
  "bulletPoints": ["Takeaway 1...", "Takeaway 2...", "Takeaway 3..."],
  "reviewQuestions": ["Question 1: ...", "Question 2: ..."]
}
Return strictly valid JSON only.`;

    const prompt = `Convert the following text into comprehensive study notes:\n${text}`;
    const raw = await this.callChat(system, prompt, true);

    const fallback: StudyNotesData = {
      keyConcepts: [],
      summary: '',
      bulletPoints: [],
      reviewQuestions: [],
    };

    const parsed = this.parseJsonSafely<Partial<StudyNotesData>>(raw, fallback);

    return {
      keyConcepts: Array.isArray(parsed.keyConcepts) ? parsed.keyConcepts : [],
      summary: typeof parsed.summary === 'string' ? parsed.summary : (raw.startsWith('{') ? '' : raw),
      bulletPoints: Array.isArray(parsed.bulletPoints) ? parsed.bulletPoints : [],
      reviewQuestions: Array.isArray(parsed.reviewQuestions) ? parsed.reviewQuestions : [],
    };
  }
}
