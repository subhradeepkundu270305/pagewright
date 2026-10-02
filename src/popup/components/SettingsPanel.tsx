import React, { useState } from 'react';
import { testAIProvider } from '../../ai/aiManager';
import type {
  ConversionSettings,
  PaperSize,
  Orientation,
  MarginPreset,
  Theme,
  AIProviderId,
} from '../../utils/types';
import { DEFAULT_SETTINGS } from '../../utils/types';

interface Props {
  settings: ConversionSettings;
  onUpdate: (partial: Partial<ConversionSettings>) => void;
  disabled?: boolean;
  onClose?: () => void;
}

const TOGGLE_FEATURES: { key: keyof ConversionSettings; label: string; desc: string; icon: string }[] = [
  { key: 'includeImages', label: 'Images', desc: 'Embed graphics & photos', icon: '🖼️' },
  { key: 'includeLinks', label: 'Hyperlinks', desc: 'Preserve clickable URLs', icon: '🔗' },
  { key: 'pageNumbers', label: 'Page Numbers', desc: 'Bottom pagination', icon: '#️⃣' },
  { key: 'showHeader', label: 'Top Header', desc: 'Title & date banner', icon: '📌' },
  { key: 'showFooter', label: 'Bottom Footer', desc: 'URL & site stamp', icon: '📎' },
  { key: 'previewBeforeDownload', label: 'Preview PDF', desc: 'Inspect before saving', icon: '👁️' },
  { key: 'removeAds', label: 'Clean Ads', desc: 'Block tracking & banners', icon: '🚫' },
  { key: 'removeNavigation', label: 'Strip Menus', desc: 'Remove site navigation', icon: '🧹' },
];

export const SettingsPanel: React.FC<Props> = ({ settings, onUpdate, disabled, onClose }) => {
  const [activeTab, setActiveTab] = useState<'layout' | 'ai'>('layout');
  const [testStatus, setTestStatus] = useState<{ testing: boolean; success?: boolean; message?: string } | null>(null);

  const ai = settings.ai || {
    provider: 'groq',
    groqApiKey: '',
    groqModel: 'qwen/qwen3.8-27b',
    ollamaEndpoint: 'http://localhost:11434',
    ollamaModel: 'llama3.2',
    includeSummary: false,
    includeTableOfContents: false,
    smartTitle: false,
  };

  const handleTestConnection = async () => {
    setTestStatus({ testing: true });
    try {
      const result = await testAIProvider({ ...settings, ai });
      setTestStatus({ testing: false, success: result.success, message: result.message });
    } catch (e) {
      setTestStatus({ testing: false, success: false, message: (e as Error).message || 'Connection test failed' });
    }
  };

  const updateAi = (partialAi: Partial<typeof ai>) => {
    onUpdate({ ai: { ...ai, ...partialAi } });
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all layout and conversion settings to defaults?')) {
      onUpdate(DEFAULT_SETTINGS);
    }
  };

  return (
    <div className="midnight-card rounded-2xl overflow-hidden space-y-3 p-3.5 animate-scale-in">
      {/* Top Navigation & Controls */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1 transition-all press-effect cursor-pointer"
              title="Return to Dashboard"
            >
              <span>←</span>
              <span>Back</span>
            </button>
          )}
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-300 flex items-center gap-1">
            <span>⚙️</span> Preferences
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            disabled={disabled}
            className="text-[10px] font-semibold text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-0.5 cursor-pointer"
            title="Reset to default settings"
          >
            <span>🔄</span> Reset
          </button>
        </div>
      </div>

      {/* Segmented Tab Bar */}
      <div className="grid grid-cols-2 p-1 bg-black/40 border border-white/10 rounded-xl gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('layout')}
          className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'layout'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
          }`}
        >
          <span>📄</span>
          <span>Layout & Format</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ai')}
          className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'ai'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
          }`}
        >
          <span>✨</span>
          <span>AI Engine</span>
          {ai.provider !== 'disabled' && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* Tab 1: Layout & Format */}
      {activeTab === 'layout' ? (
        <div className="space-y-3">
          {/* Paper Format & Orientation Segmented Controls */}
          <div className="grid grid-cols-2 gap-2">
            {/* Paper Size */}
            <div>
              <label className="block text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                Paper Size
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-black/30 border border-white/10 rounded-xl">
                {(['a4', 'letter'] as PaperSize[]).map((size) => (
                  <button
                    key={size}
                    type="button"
                    disabled={disabled}
                    onClick={() => onUpdate({ paperSize: size })}
                    className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                      settings.paperSize === size
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="uppercase tracking-tight">{size}</div>
                    <div className="text-[8.5px] opacity-70 font-normal">
                      {size === 'a4' ? '8.3 × 11.7 in' : '8.5 × 11.0 in'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Orientation with 90° Rotating Icon */}
            <div>
              <label className="block text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                Orientation
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-black/30 border border-white/10 rounded-xl">
                {(['portrait', 'landscape'] as Orientation[]).map((orient) => (
                  <button
                    key={orient}
                    type="button"
                    disabled={disabled}
                    onClick={() => onUpdate({ orientation: orient })}
                    className={`py-1.5 px-1 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                      settings.orientation === orient
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                    }`}
                  >
                    <span
                      className={`text-sm inline-block transition-transform duration-300 ${
                        orient === 'landscape' ? 'rotate-90' : 'rotate-0'
                      }`}
                    >
                      📄
                    </span>
                    <span className="capitalize text-[10.5px] block">{orient}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Margins Preset Selector */}
          <div>
            <label className="block text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
              Page Margins
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'narrow', label: 'Narrow', size: '0.5 inch' },
                { id: 'normal', label: 'Normal', size: '0.75 inch' },
                { id: 'wide', label: 'Wide', size: '1.0 inch' },
              ].map((m) => {
                const isActive = settings.margins === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onUpdate({ margins: m.id as MarginPreset })}
                    className={`p-1.5 rounded-xl text-left border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-sm'
                        : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-[11px] font-bold">{m.label}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">{m.size}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme Selector */}
          <div>
            <label className="block text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
              Typography Theme
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'clean', title: 'Clean Serif', sub: 'Charter', icon: '📰' },
                { id: 'original', title: 'Modern Sans', sub: 'System UI', icon: '📱' },
                { id: 'minimal', title: 'Minimal', sub: 'High Contrast', icon: '🖋️' },
              ].map((t) => {
                const isActive = settings.theme === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onUpdate({ theme: t.id as Theme })}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-sm'
                        : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-sm block mb-0.5">{t.icon}</span>
                    <div className="text-[11px] font-bold leading-tight">{t.title}</div>
                    <div className="text-[8.5px] text-slate-400 mt-0.5">{t.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scale Slider with Animated Thumb Badge */}
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider">
                Document Zoom / Scale
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-bold text-cyan-400">
                  {Math.round(settings.scale * 100)}%
                </span>
                {settings.scale !== 1.0 && (
                  <button
                    type="button"
                    onClick={() => onUpdate({ scale: 1.0 })}
                    className="text-[9px] text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
            <div className="relative pt-2">
              <input
                type="range"
                disabled={disabled}
                min="0.5"
                max="2.0"
                step="0.05"
                value={settings.scale}
                onChange={(e) => onUpdate({ scale: parseFloat(e.target.value) })}
                className="w-full accent-cyan-400 h-1.5 bg-white/10 rounded-full cursor-pointer"
              />
            </div>
          </div>

          {/* Document Content Features — 2-Column Grid */}
          <div>
            <label className="block text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
              Content & Layout Options
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {TOGGLE_FEATURES.map(({ key, label, desc, icon }) => {
                const isChecked = !!settings[key];
                return (
                  <div
                    key={key}
                    onClick={() => !disabled && onUpdate({ [key]: !isChecked })}
                    className={`p-2 rounded-xl border flex items-center justify-between transition-all duration-200 press-effect cursor-pointer ${
                      isChecked
                        ? 'bg-indigo-600/15 border-indigo-500/40 text-white shadow-sm'
                        : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-slate-200'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0 pr-1">
                      <span className="text-sm flex-shrink-0">{icon}</span>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold truncate leading-tight">{label}</div>
                        <div className="text-[8.5px] text-slate-400 truncate">{desc}</div>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                        isChecked
                          ? 'bg-cyan-500 border-cyan-400 text-black'
                          : 'border-white/20 bg-black/20'
                      }`}
                    >
                      {isChecked && <span className="text-[9px] font-bold">✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Tab 2: AI Engine & Features */
        <div className="space-y-3">
          {/* AI Provider Selector */}
          <div>
            <label className="block text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
              Active AI Provider
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'groq', title: 'Groq Cloud', sub: 'Fast API (Free)', icon: '⚡' },
                { id: 'chrome', title: 'Chrome AI', sub: 'On-Device Gemini', icon: '🔒' },
                { id: 'ollama', title: 'Local Ollama', sub: 'localhost:11434', icon: '🖥️' },
                { id: 'disabled', title: 'Disabled', sub: 'No AI processing', icon: '⏸️' },
              ].map((p) => {
                const isActive = ai.provider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => updateAi({ provider: p.id as AIProviderId })}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-sm'
                        : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-sm block mb-0.5">{p.icon}</span>
                    <div className="text-[11px] font-bold leading-tight">{p.title}</div>
                    <div className="text-[8.5px] text-slate-400 mt-0.5">{p.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Groq Cloud Settings Box (Permanently Hidden API Key) */}
          {ai.provider === 'groq' && (
            <div className="p-3 bg-indigo-950/20 rounded-xl border border-indigo-800/30 space-y-2.5">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Groq API Key</span>
                    <span className="text-[8.5px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.2 rounded-full border border-emerald-500/20">
                      🔒 Protected & Hidden
                    </span>
                  </label>
                  {ai.groqApiKey && (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => updateAi({ groqApiKey: '' })}
                      className="text-[9.5px] text-slate-400 hover:text-rose-400 font-medium cursor-pointer"
                    >
                      Clear Key
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  disabled={disabled}
                  value={ai.groqApiKey}
                  onChange={(e) => updateAi({ groqApiKey: e.target.value.trim() })}
                  placeholder="Paste Groq API key (gsk_...)"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full bg-[#101426] border border-white/10 rounded-xl p-2 text-xs text-slate-100 font-mono tracking-widest focus:ring-2 focus:ring-cyan-400 outline-none"
                />
                <p className="text-[8.5px] text-slate-500 mt-1 flex items-center gap-1">
                  <span>🛡️</span>
                  <span>Permanently masked to prevent on-screen viewing. Never shared.</span>
                </p>
              </div>

              {/* Model Selection Pills */}
              <div>
                <label className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Inference Model
                </label>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { id: 'qwen/qwen3.8-27b', label: 'Qwen 3.8 27B', tag: 'Fast & Recommended' },
                    { id: 'openai/gpt-oss-20b', label: 'GPT-OSS 20B', tag: 'Lightweight' },
                    { id: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B', tag: 'Max Reasoning' },
                    { id: 'allam-2-7b', label: 'Allam 2 7B', tag: 'Compact' },
                  ].map((m) => {
                    const isSelected = ai.groqModel === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => updateAi({ groqModel: m.id })}
                        className={`p-1.5 rounded-lg text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600/30 border-cyan-500/50 text-white shadow-sm'
                            : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="text-[10px] font-bold truncate leading-tight">{m.label}</div>
                        <div className="text-[8px] text-slate-400 truncate">{m.tag}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Test Groq Connection Button */}
              <button
                type="button"
                disabled={disabled || testStatus?.testing}
                onClick={handleTestConnection}
                className="w-full py-2 px-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white rounded-xl text-[11px] font-bold transition-all press-effect shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {testStatus?.testing ? '🔄 Testing Groq…' : '⚡ Test Groq Connection'}
              </button>

              {testStatus && !testStatus.testing && (
                <div
                  className={`p-2 rounded-lg text-[10.5px] font-medium border ${
                    testStatus.success
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {testStatus.success ? `✓ ${testStatus.message}` : `✗ ${testStatus.message}`}
                </div>
              )}
            </div>
          )}

          {/* Local Ollama Settings Box */}
          {ai.provider === 'ollama' && (
            <div className="p-3 bg-black/30 rounded-xl border border-white/10 space-y-2.5">
              <div>
                <label className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Ollama Endpoint
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  value={ai.ollamaEndpoint}
                  onChange={(e) => updateAi({ ollamaEndpoint: e.target.value.trim() })}
                  className="w-full bg-[#101426] border border-white/10 rounded-xl p-2 text-xs text-slate-100 font-mono focus:ring-2 focus:ring-cyan-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Loaded Model Name
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  value={ai.ollamaModel}
                  onChange={(e) => updateAi({ ollamaModel: e.target.value.trim() })}
                  placeholder="llama3.2"
                  className="w-full bg-[#101426] border border-white/10 rounded-xl p-2 text-xs text-slate-100 focus:ring-2 focus:ring-cyan-400 outline-none"
                />
              </div>

              <button
                type="button"
                disabled={disabled || testStatus?.testing}
                onClick={handleTestConnection}
                className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-[11px] font-bold transition-all press-effect shadow-md cursor-pointer"
              >
                {testStatus?.testing ? '🔄 Testing…' : '⚡ Test Ollama Connection'}
              </button>

              {testStatus && !testStatus.testing && (
                <div
                  className={`p-2 rounded-lg text-[10.5px] font-medium border ${
                    testStatus.success
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {testStatus.success ? `✓ ${testStatus.message}` : `✗ ${testStatus.message}`}
                </div>
              )}
            </div>
          )}

          {/* Chrome AI Banner */}
          {ai.provider === 'chrome' && (
            <div className="p-3 bg-emerald-950/20 rounded-xl border border-emerald-800/30 space-y-1">
              <p className="font-bold text-xs text-emerald-300 flex items-center gap-1.5">
                <span>🔒</span> Private On-Device Intelligence
              </p>
              <p className="text-[10px] text-emerald-400 leading-relaxed">
                Powered by Chrome Prompt API (Gemini Nano). Zero network data transfer.
              </p>
            </div>
          )}

          {/* AI Feature Toggles */}
          <div>
            <label className="block text-[9.5px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
              Automated Document Enhancements
            </label>
            <div className="space-y-1.5">
              {[
                {
                  key: 'includeSummary',
                  label: 'Executive Summary Brief',
                  desc: 'Inserts analytical brief at the start of PDF',
                  icon: '✨',
                },
                {
                  key: 'includeTableOfContents',
                  label: 'Smart Table of Contents',
                  desc: 'Generates structured outline with jump links',
                  icon: '📑',
                },
                {
                  key: 'smartTitle',
                  label: 'Smart Document Title',
                  desc: 'Auto-extracts and refines header title',
                  icon: '🏷️',
                },
              ].map(({ key, label, desc, icon }) => {
                const isChecked = !!ai[key as keyof typeof ai];
                return (
                  <div
                    key={key}
                    onClick={() =>
                      !disabled &&
                      ai.provider !== 'disabled' &&
                      updateAi({ [key]: !isChecked })
                    }
                    className={`p-2 rounded-xl border flex items-center justify-between transition-all duration-200 press-effect cursor-pointer ${
                      isChecked
                        ? 'bg-indigo-600/15 border-indigo-500/40 text-white shadow-sm'
                        : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-slate-200'
                    } ${disabled || ai.provider === 'disabled' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-1">
                      <span className="text-base flex-shrink-0">{icon}</span>
                      <div>
                        <div className="text-[11px] font-bold text-slate-100">{label}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">{desc}</div>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                        isChecked
                          ? 'bg-cyan-500 border-cyan-400 text-black'
                          : 'border-white/20 bg-black/20'
                      }`}
                    >
                      {isChecked && <span className="text-[9px] font-bold">✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
