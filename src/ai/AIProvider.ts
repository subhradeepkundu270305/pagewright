export interface StudyNotesData {
  keyConcepts: string[];
  summary: string;
  bulletPoints: string[];
  reviewQuestions: string[];
}

export interface TocItem {
  title: string;
  level?: number;
}

export interface AIProvider {
  readonly id: string;
  readonly name: string;

  /**
   * Verifies if the provider is reachable and ready to generate text.
   */
  isAvailable(): Promise<boolean>;

  /**
   * Generates a concise, professional title for the document.
   */
  generateTitle(content: string): Promise<string>;

  /**
   * Generates a 2-3 paragraph executive summary of the content.
   */
  generateSummary(content: string): Promise<string>;

  /**
   * Generates a structured table of contents outline.
   */
  generateTableOfContents(content: string): Promise<TocItem[]>;

  /**
   * Generates structured study notes including key concepts, summary, takeaways, and quiz questions.
   */
  generateStudyNotes(content: string): Promise<StudyNotesData>;

  /**
   * Tests connection and credentials, returning diagnostic details.
   */
  testConnection?(): Promise<{ success: boolean; message: string; model?: string }>;
}
