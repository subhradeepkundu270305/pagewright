// Conversion modes
export type ConversionMode = 'full-page' | 'reader-mode' | 'selected-content' | 'study-notes';

// Paper sizes with dimensions in inches
export type PaperSize = 'a4' | 'letter';

export const PAPER_DIMENSIONS: Record<PaperSize, { width: number; height: number }> = {
  a4: { width: 8.27, height: 11.69 },
  letter: { width: 8.5, height: 11 },
};

// Orientation
export type Orientation = 'portrait' | 'landscape';

// Margin presets in inches
export type MarginPreset = 'narrow' | 'normal' | 'wide';

export const MARGIN_VALUES: Record<MarginPreset, { top: number; right: number; bottom: number; left: number }> = {
  narrow: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
  normal: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
  wide: { top: 1, right: 1, bottom: 1, left: 1 },
};

// Theme options
export type Theme = 'original' | 'clean' | 'minimal';

// AI Provider options
export type AIProviderId = 'groq' | 'chrome' | 'ollama' | 'disabled';

export interface AIConfig {
  provider: AIProviderId;
  groqApiKey: string;
  groqModel: string;
  ollamaEndpoint: string;
  ollamaModel: string;
  includeSummary: boolean;
  includeTableOfContents: boolean;
  smartTitle: boolean;
}

export const DEFAULT_AI_CONFIG: AIConfig = {
  provider: 'groq',
  groqApiKey: '',
  groqModel: 'qwen/qwen3.8-27b',
  ollamaEndpoint: 'http://localhost:11434',
  ollamaModel: 'llama3.2',
  includeSummary: false,
  includeTableOfContents: false,
  smartTitle: false,
};

// PDF conversion settings
export interface ConversionSettings {
  mode: ConversionMode;
  paperSize: PaperSize;
  orientation: Orientation;
  margins: MarginPreset;
  scale: number;
  theme: Theme;
  includeImages: boolean;
  includeLinks: boolean;
  pageNumbers: boolean;
  showHeader: boolean;
  showFooter: boolean;
  removeAds: boolean;
  removeNavigation: boolean;
  previewBeforeDownload: boolean;
  ai: AIConfig;
}

export const DEFAULT_SETTINGS: ConversionSettings = {
  mode: 'reader-mode',
  paperSize: 'a4',
  orientation: 'portrait',
  margins: 'normal',
  scale: 1,
  theme: 'clean',
  includeImages: true,
  includeLinks: true,
  pageNumbers: true,
  showHeader: true,
  showFooter: true,
  removeAds: true,
  removeNavigation: true,
  previewBeforeDownload: false,
  ai: DEFAULT_AI_CONFIG,
};

// Conversion progress steps
export type ConversionStep =
  | 'idle'
  | 'extracting'
  | 'cleaning'
  | 'analyzing'
  | 'rendering'
  | 'generating'
  | 'saving'
  | 'previewing'
  | 'done'
  | 'error';

export const STEP_LABELS: Record<ConversionStep, string> = {
  idle: 'Ready',
  extracting: 'Extracting page content…',
  cleaning: 'Cleaning and sanitizing…',
  analyzing: 'AI enhancing document…',
  rendering: 'Rendering with theme…',
  generating: 'Generating PDF…',
  saving: 'Saving file…',
  previewing: 'Opening PDF preview…',
  done: 'PDF ready!',
  error: 'Something went wrong',
};

// Extraction result from content script
export interface ExtractionResult {
  title: string;
  html: string;
  url: string;
  mode: ConversionMode;
  byline?: string;
  siteName?: string;
}

// AI Enhancement payload passed to render page
export interface AIEnhancementData {
  summary?: string;
  tableOfContents?: Array<{ title: string; anchor?: string; level?: number }>;
  studyNotes?: {
    keyConcepts: string[];
    summary: string;
    bulletPoints: string[];
    reviewQuestions: string[];
  };
  smartTitle?: string;
  error?: string;
}

// Messages between extension components
export type MessageType =
  | 'START_CONVERSION'
  | 'EXTRACT_CONTENT'
  | 'EXTRACTION_RESULT'
  | 'START_PICKER'
  | 'ELEMENT_SELECTED'
  | 'PICKER_CANCELLED'
  | 'RENDER_CONTENT'
  | 'RENDER_READY'
  | 'TRIGGER_PRINT'
  | 'OPEN_PREVIEW'
  | 'CONVERSION_PROGRESS'
  | 'CONVERSION_COMPLETE'
  | 'CONVERSION_ERROR'
  | 'GET_SETTINGS'
  | 'SAVE_SETTINGS'
  | 'TEST_AI_CONNECTION';

export interface ExtensionMessage {
  type: MessageType;
  payload?: unknown;
}
