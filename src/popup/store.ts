import { create } from 'zustand';
import type { ConversionSettings, ConversionStep } from '../utils/types';
import { DEFAULT_SETTINGS } from '../utils/types';

interface PopupState {
  settings: ConversionSettings;
  status: ConversionStep;
  errorMessage: string;
  isSettingsOpen: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (partial: Partial<ConversionSettings>) => Promise<void>;
  startConversion: () => Promise<void>;
  startPicker: () => Promise<void>;
  setStatus: (step: ConversionStep, message?: string) => void;
  setError: (message: string) => void;
  reset: () => void;
  toggleSettings: () => void;
}

export const useStore = create<PopupState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  status: 'idle',
  errorMessage: '',
  isSettingsOpen: false,

  loadSettings: async () => {
    try {
      const data = await chrome.storage.sync.get('settings');
      if (data.settings) {
        const loaded = { ...DEFAULT_SETTINGS, ...data.settings };
        // Migrate deprecated Groq model IDs
        const deprecatedModels = [
          'llama-3.1-8b-instant',
          'llama-3.3-70b-versatile',
          'gemma2-9b-it',
          'llama-3.2-90b-text-preview',
          'llama-3.2-11b-text-preview',
        ];
        if (loaded.ai?.groqModel && deprecatedModels.includes(loaded.ai.groqModel)) {
          loaded.ai = { ...loaded.ai, groqModel: 'qwen/qwen3.8-27b' };
          // Persist the migration
          chrome.storage.sync.set({ settings: loaded }).catch(() => {});
        }
        set({ settings: loaded });
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  },

  updateSettings: async (partial: Partial<ConversionSettings>) => {
    const currentSettings = get().settings;
    const newSettings = { ...currentSettings, ...partial };
    set({ settings: newSettings });
    try {
      await chrome.storage.sync.set({ settings: newSettings });
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  },

  startConversion: async () => {
    set({ status: 'extracting', errorMessage: '' });
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        throw new Error('No active tab found');
      }

      const response = await chrome.runtime.sendMessage({
        type: 'START_CONVERSION',
        payload: {
          settings: get().settings,
          tabId: tab.id,
        },
      });

      if (!response?.success) {
        set({ status: 'error', errorMessage: response?.error ?? 'Conversion failed' });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error communicating with background';
      set({ status: 'error', errorMessage: message });
    }
  },

  startPicker: async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        throw new Error('No active tab found');
      }

      // Trigger picker in the background service worker
      chrome.runtime.sendMessage({
        type: 'START_PICKER',
        payload: {
          settings: get().settings,
          tabId: tab.id,
        },
      });

      // Close popup so user has unobstructed view of the page
      window.close();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error launching element picker';
      set({ status: 'error', errorMessage: message });
    }
  },

  setStatus: (step: ConversionStep, message?: string) => {
    set({ status: step, errorMessage: message ?? '' });
  },

  setError: (message: string) => {
    set({ status: 'error', errorMessage: message });
  },

  reset: () => {
    set({ status: 'idle', errorMessage: '' });
  },

  toggleSettings: () => {
    set((state) => ({ isSettingsOpen: !state.isSettingsOpen }));
  },
}));
