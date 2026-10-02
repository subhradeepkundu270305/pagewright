import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GroqProvider } from '../ai/providers/GroqProvider';
import { processAIEnhancements, getProvider } from '../ai/aiManager';
import { DEFAULT_SETTINGS, ConversionSettings } from '../utils/types';

describe('Phase 3: AI Enhancements & Providers', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('GroqProvider', () => {
    it('isAvailable returns false if key is invalid or empty', async () => {
      const provider = new GroqProvider('');
      expect(await provider.isAvailable()).toBe(false);

      const invalidProvider = new GroqProvider('invalid-key-no-gsk');
      expect(await invalidProvider.isAvailable()).toBe(false);
    });

    it('generates clean title using chat completions', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Understanding Modern Web Architecture',
            },
          },
        ],
      };

      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const provider = new GroqProvider('gsk_test12345');
      const title = await provider.generateTitle('<h1>Some long messy title</h1><p>Content...</p>');

      expect(title).toBe('Understanding Modern Web Architecture');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://api.groq.com/openai/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer gsk_test12345',
          }),
        })
      );
    });

    it('generates summary properly', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'This document explains cloud computing principles and containerization.',
            },
          },
        ],
      };

      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const provider = new GroqProvider('gsk_test12345');
      const summary = await provider.generateSummary('<p>Long document about cloud...</p>');

      expect(summary).toContain('cloud computing principles');
    });

    it('generates structured study notes from JSON response', async () => {
      const mockNotes = {
        keyConcepts: ['Docker: containerization', 'Kubernetes: orchestration'],
        summary: 'A thorough guide to microservices.',
        bulletPoints: ['Containers package code', 'Clusters manage scale'],
        reviewQuestions: ['What is the difference between Docker and VMs?'],
      };

      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify(mockNotes) } }],
        }),
      });

      const provider = new GroqProvider('gsk_test12345');
      const notes = await provider.generateStudyNotes('<p>Content</p>');

      expect(notes.keyConcepts).toHaveLength(2);
      expect(notes.summary).toBe('A thorough guide to microservices.');
      expect(notes.bulletPoints).toHaveLength(2);
      expect(notes.reviewQuestions).toHaveLength(1);
    });
    it('generates structured study notes even when response has markdown code fences', async () => {
      const mockNotes = {
        keyConcepts: ['Recursion: function calling itself'],
        summary: 'Overview of recursion.',
        bulletPoints: ['Base case prevents stack overflow'],
        reviewQuestions: ['What happens without a base case?'],
      };

      // Wrap in markdown code fences
      const markdownJson = `\`\`\`json\n${JSON.stringify(mockNotes, null, 2)}\n\`\`\``;

      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: markdownJson } }],
        }),
      });

      const provider = new GroqProvider('gsk_test12345');
      const notes = await provider.generateStudyNotes('<p>Recursion is a programming technique...</p>');

      expect(notes.keyConcepts).toContain('Recursion: function calling itself');
      expect(notes.summary).toBe('Overview of recursion.');
      expect(notes.bulletPoints).toHaveLength(1);
    });

    it('automatically falls back to openai/gpt-oss-20b on 429 rate limit', async () => {
      // First call (with openai/gpt-oss-120b) returns 429 rate limit
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: async () => JSON.stringify({ error: { message: 'Rate limit reached on TPM: Limit 6000' } }),
      });

      // Second fallback call (with openai/gpt-oss-20b) succeeds
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Fallback Success Title' } }],
        }),
      });

      const provider = new GroqProvider('gsk_test12345', 'openai/gpt-oss-120b');
      const title = await provider.generateTitle('<p>Some long text...</p>');

      expect(title).toBe('Fallback Success Title');
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);

      // Verify the second call used openai/gpt-oss-20b
      const secondCallBody = JSON.parse((globalThis.fetch as any).mock.calls[1][1].body);
      expect(secondCallBody.model).toBe('openai/gpt-oss-20b');
    });

    it('testConnection tests credentials and reports status', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'OK' } }] }),
      });

      const provider = new GroqProvider('gsk_test12345');
      const testResult = await provider.testConnection();
      expect(testResult.success).toBe(true);
      expect(testResult.message).toContain('Connected successfully');

      // Test failure case
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ error: { message: 'Invalid API Key' } }),
      });

      const failResult = await provider.testConnection();
      expect(failResult.success).toBe(false);
      expect(failResult.message).toContain('Invalid API Key');
    });

    it('cleanText decodes entities and maintains paragraph structure', () => {
      const provider = new GroqProvider('gsk_test12345');
      const html = `
        <h1>Title &amp; Subtitle</h1>
        <p>Paragraph 1 with &quot;quotes&quot; and &#39;apostrophes&#39;.</p>
        <p>Paragraph 2 &mdash; with dashes and &nbsp; extra spaces.</p>
      `;
      const cleaned = provider.cleanText(html);
      expect(cleaned).toContain('Title & Subtitle');
      expect(cleaned).toContain('Paragraph 1 with "quotes" and \'apostrophes\'.');
      expect(cleaned).toContain('Paragraph 2 — with dashes and extra spaces.');
      expect(cleaned).toContain('\n\n'); // Paragraph separation preserved
    });
  });

  describe('AIManager', () => {
    it('returns empty enhancements when provider is disabled and no AI features requested', async () => {
      const settings: ConversionSettings = {
        ...DEFAULT_SETTINGS,
        ai: {
          ...DEFAULT_SETTINGS.ai,
          provider: 'disabled',
          includeSummary: false,
          includeTableOfContents: false,
          smartTitle: false,
        },
      };

      const result = await processAIEnhancements('<p>Hello</p>', 'Title', settings);
      expect(result).toEqual({});
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('handles provider resolution', () => {
      const settingsWithGroq: ConversionSettings = {
        ...DEFAULT_SETTINGS,
        ai: {
          ...DEFAULT_SETTINGS.ai,
          provider: 'groq',
        },
      };
      expect(getProvider(settingsWithGroq)?.id).toBe('groq');

      const settingsDisabled: ConversionSettings = {
        ...DEFAULT_SETTINGS,
        ai: {
          ...DEFAULT_SETTINGS.ai,
          provider: 'disabled',
        },
      };
      expect(getProvider(settingsDisabled)).toBeNull();
    });

    it('gracefully handles API network failure without throwing and records error', async () => {
      (globalThis.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const settings: ConversionSettings = {
        ...DEFAULT_SETTINGS,
        mode: 'study-notes',
        ai: {
          ...DEFAULT_SETTINGS.ai,
          provider: 'groq',
          groqApiKey: 'gsk_test_mock',
        },
      };

      // Should resolve without throwing error to keep conversion working, but record the error message
      const result = await processAIEnhancements('<p>Text</p>', 'Title', settings);
      expect(result).toBeDefined();
      expect(result.error).toBe('Network error');
    });
  });
});
