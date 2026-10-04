import React, { useEffect, useState } from 'react';
import { useStore } from './store';
import { ModeSelector } from './components/ModeSelector';
import { SettingsPanel } from './components/SettingsPanel';
import { HeroPreview3D } from './components/HeroPreview3D';
import { ProgressBar } from './components/ProgressBar';
import { StatusMessage } from './components/StatusMessage';
import { Expandable } from './components/motion/Expandable';
import { MagneticButton } from './components/motion/MagneticButton';
import { MotionCard } from './components/motion/MotionCard';
import type { ConversionStep, Theme, PaperSize } from '../utils/types';
import { isRestrictedPage } from '../utils/restricted-pages';

export const Popup: React.FC = () => {
  const {
    settings,
    status,
    errorMessage,
    isSettingsOpen,
    loadSettings,
    updateSettings,
    startConversion,
    startPicker,
    toggleSettings,
    reset,
    setStatus,
    setError,
  } = useStore();

  const [isRestricted, setIsRestricted] = useState(false);
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);
  const [activeTabInfo, setActiveTabInfo] = useState<{ title: string; url: string; favIconUrl?: string }>({
    title: 'Current Webpage',
    url: '',
  });

  const isConverting = status !== 'idle' && status !== 'error' && status !== 'done';

  useEffect(() => {
    loadSettings();
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab) {
        setActiveTabInfo({
          title: tab.title || 'Current Webpage',
          url: tab.url || '',
          favIconUrl: tab.favIconUrl,
        });
        if (tab.url && isRestrictedPage(tab.url)) {
          setIsRestricted(true);
        }
      }
    }).catch(() => {});

    const messageListener = (message: { type: string; payload?: { step?: ConversionStep; message?: string; error?: string } }) => {
      if (message.type === 'CONVERSION_PROGRESS' && message.payload?.step) {
        if (message.payload.step === 'error') {
          setError(message.payload.message ?? 'Unknown error');
        } else {
          setStatus(message.payload.step);
        }
      } else if (message.type === 'CONVERSION_COMPLETE') {
        setStatus('done');
      } else if (message.type === 'CONVERSION_ERROR') {
        setError(message.payload?.error ?? 'Unknown error');
      }
    };
    chrome.runtime.onMessage.addListener(messageListener);
    return () => chrome.runtime.onMessage.removeListener(messageListener);
  }, []);

  // Keyboard shortcut: Press Enter to convert, Escape to close settings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSettingsOpen) {
        toggleSettings();
        return;
      }
      if (e.key === 'Enter' && !isConverting && !isRestricted && !isSettingsOpen) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && target.tagName !== 'SELECT') {
          startConversion();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConverting, isRestricted, isSettingsOpen, toggleSettings, startConversion]);

  const handleConvertClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setTimeout(() => setRipple(null), 600);
    startConversion();
  };

  const domain = activeTabInfo.url
    ? (() => {
        try {
          return new URL(activeTabInfo.url).hostname.replace(/^www\./, '');
        } catch {
          return 'webpage';
        }
      })()
    : 'webpage';

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

  const updateAiProp = (key: 'includeSummary' | 'includeTableOfContents' | 'smartTitle', val: boolean) => {
    updateSettings({
      ai: { ...ai, [key]: val },
    });
  };

  return (
    <div className="popup-shell w-[420px] min-w-[420px] max-w-[420px] flex flex-col relative rounded-[32px] overflow-hidden bg-[#0B1020] text-slate-100 antialiased select-none border border-white/10 shadow-2xl">
      {/* Top Header Bar */}
      <header className="relative z-10 flex items-center justify-between px-3.5 py-2.5 border-b border-white/[0.08] bg-[#0E1326] rounded-t-[32px]">
        <div className="flex items-center gap-2">
          <img
            src="/icons/icon-48.png"
            alt="Pagewright"
            className="w-7 h-7 rounded-lg shadow-sm object-contain"
          />
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold text-[13.5px] text-white tracking-tight">Pagewright</span>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                PRO
              </span>
            </div>
            <span className="text-[9px] text-slate-400 font-medium">Midnight Ink Engine</span>
          </div>
        </div>

        {/* Right controls: Status pill + Settings button */}
        <div className="flex items-center gap-2">
          {status === 'done' ? (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 animate-scale-in">
              <span className="text-emerald-400 font-extrabold">✓</span>
              Complete
            </span>
          ) : isConverting ? (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-spin"></span>
              Working
            </span>
          ) : (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Ready
            </span>
          )}

          <button
            type="button"
            onClick={toggleSettings}
            disabled={isConverting}
            className={`p-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-300 hover:text-white transition-all duration-200 cursor-pointer ${
              isSettingsOpen ? 'rotate-90 bg-indigo-500/20 border-indigo-500/40 text-cyan-300' : ''
            }`}
            title={isSettingsOpen ? 'Return to Dashboard' : 'Open Preferences'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="relative z-10 flex-1 flex flex-col p-3 space-y-2">
        {isRestricted ? (
          <div className="midnight-card rounded-2xl p-5 text-center animate-scale-in border-amber-500/30">
            <span className="text-2xl block mb-2">🚫</span>
            <h3 className="font-bold text-sm text-amber-300 mb-1">Restricted Page</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Chrome extensions cannot capture internal browser pages or the Chrome Web Store.
            </p>
          </div>
        ) : isSettingsOpen ? (
          <div>
            <SettingsPanel
              settings={settings}
              onUpdate={updateSettings}
              disabled={isConverting}
              onClose={toggleSettings}
            />
          </div>
        ) : (
          <>
            {/* 1. 3D Hero Preview Sheet */}
            <div>
              <HeroPreview3D
                status={status}
                title={activeTabInfo.title}
                domain={domain}
                mode={settings.mode}
                theme={settings.theme}
              />
            </div>

            {/* 2. Target Mode Selector */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-[9.5px] font-extrabold uppercase tracking-widest text-slate-400">
                  Target Mode
                </span>
                <span className="text-[9.5px] text-cyan-400 font-semibold capitalize">
                  {settings.mode.replace('-', ' ')}
                </span>
              </div>
              <ModeSelector
                mode={settings.mode}
                onChange={(mode) => updateSettings({ mode })}
                disabled={isConverting}
              />
            </div>

            {/* 3. Contextual Options Card */}
            <MotionCard className="rounded-xl p-2.5 space-y-2">
              {/* Reader Theme Quick Selector */}
              <Expandable expanded={settings.mode === 'reader-mode'}>
                <div className="space-y-1 pb-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block px-0.5">
                    Reader Typography
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'clean', label: 'Clean Serif', icon: '📰' },
                      { id: 'original', label: 'Modern Sans', icon: '📱' },
                      { id: 'minimal', label: 'Minimal', icon: '🖋️' },
                    ].map((t) => {
                      const isActive = settings.theme === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          disabled={isConverting}
                          onClick={() => updateSettings({ theme: t.id as Theme })}
                          className={`py-1.5 px-2 rounded-lg text-center font-bold transition-all border cursor-pointer ${
                            isActive
                              ? 'bg-gradient-to-r from-indigo-600/50 to-violet-600/50 border-cyan-400/60 text-white shadow-sm'
                              : 'bg-white/[0.02] border-white/[0.08] text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                          }`}
                        >
                          <span className="mr-1">{t.icon}</span>
                          <span className="text-[10px]">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Expandable>

              {/* Selected Mode Interactive Element Picker Action */}
              <Expandable expanded={settings.mode === 'selected-content'}>
                <div className="pb-1">
                  <button
                    type="button"
                    onClick={startPicker}
                    disabled={isConverting}
                    className="w-full py-2 px-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs rounded-lg shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 transition-transform"
                  >
                    <span>🎯</span> Launch Element Inspector
                  </button>
                  <p className="text-[9.5px] text-slate-400 text-center mt-1">
                    Click any element on the page or highlight text
                  </p>
                </div>
              </Expandable>

              {/* AI Study Notes Info */}
              <Expandable expanded={settings.mode === 'study-notes'}>
                <div className="flex items-center justify-between py-1 px-1">
                  <div>
                    <span className="text-[11px] font-bold text-white block">AI Study Guide Engine</span>
                    <span className="text-[9px] text-slate-400">Extracts key concepts, summary & quiz</span>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    ⚡ {ai.groqModel.split('/')[1] || 'Qwen 27B'}
                  </span>
                </div>
              </Expandable>

              {/* Quick Feature Toggles Bar */}
              <div className="flex flex-wrap gap-1.5 items-center pt-1 border-t border-white/[0.06]">
                <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider mr-0.5">
                  Quick:
                </span>

                {/* Images toggle */}
                <button
                  type="button"
                  disabled={isConverting}
                  onClick={() => updateSettings({ includeImages: !settings.includeImages })}
                  className={`chip-btn ${settings.includeImages ? 'chip-btn-active' : ''}`}
                  title="Toggle images in PDF"
                >
                  <span>🖼️</span> Images {settings.includeImages ? 'ON' : 'OFF'}
                </button>

                {/* Paper Size toggle */}
                <button
                  type="button"
                  disabled={isConverting}
                  onClick={() => updateSettings({ paperSize: (settings.paperSize === 'a4' ? 'letter' : 'a4') as PaperSize })}
                  className="chip-btn"
                  title="Click to toggle between A4 and Letter"
                >
                  <span>📄</span> {settings.paperSize.toUpperCase()}
                </button>

                {/* Preview Before Download toggle */}
                <button
                  type="button"
                  disabled={isConverting}
                  onClick={() => updateSettings({ previewBeforeDownload: !settings.previewBeforeDownload })}
                  className={`chip-btn ${settings.previewBeforeDownload ? 'chip-btn-active' : ''}`}
                  title="Open PDF preview in browser before saving"
                >
                  <span>👁️</span> Preview {settings.previewBeforeDownload ? 'ON' : 'OFF'}
                </button>

                {/* Ads removal toggle */}
                <button
                  type="button"
                  disabled={isConverting}
                  onClick={() => updateSettings({ removeAds: !settings.removeAds })}
                  className={`chip-btn ${settings.removeAds ? 'chip-btn-active' : ''}`}
                  title="Automatically remove advertisements and cookie overlays"
                >
                  <span>🚫</span> Clean Ads {settings.removeAds ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* AI Quick Enhancements */}
              {settings.mode !== 'study-notes' && ai.provider !== 'disabled' && (
                <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">
                    Smart AI:
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={isConverting}
                      onClick={() => updateAiProp('includeSummary', !ai.includeSummary)}
                      className={`chip-btn text-[10px] py-0.5 px-2 ${ai.includeSummary ? 'chip-btn-active' : ''}`}
                    >
                      ✨ Summary
                    </button>
                    <button
                      type="button"
                      disabled={isConverting}
                      onClick={() => updateAiProp('includeTableOfContents', !ai.includeTableOfContents)}
                      className={`chip-btn text-[10px] py-0.5 px-2 ${ai.includeTableOfContents ? 'chip-btn-active' : ''}`}
                    >
                      📑 TOC
                    </button>
                    <button
                      type="button"
                      disabled={isConverting}
                      onClick={() => updateAiProp('smartTitle', !ai.smartTitle)}
                      className={`chip-btn text-[10px] py-0.5 px-2 ${ai.smartTitle ? 'chip-btn-active' : ''}`}
                    >
                      🏷️ Title
                    </button>
                  </div>
                </div>
              )}
            </MotionCard>

            {/* 4. Centerpiece Convert Button */}
            <div className="pt-0.5">
              <MagneticButton
                type="button"
                onClick={handleConvertClick}
                disabled={isConverting}
                className={`w-full py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  status === 'done'
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white border border-emerald-400/50 shadow-lg shadow-emerald-500/25 rounded-2xl'
                    : `btn-convert-gradient ${status === 'idle' ? 'idle-breathe' : ''}`
                } ${isConverting ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {/* Ripple effect */}
                {ripple && (
                  <span
                    className="absolute bg-white/30 rounded-full animate-ripple pointer-events-none"
                    style={{
                      left: ripple.x - 10,
                      top: ripple.y - 10,
                      width: 20,
                      height: 20,
                    }}
                  />
                )}

                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isConverting ? (
                    <>
                      <span className="animate-spin">🔄</span>
                      <span>Processing Conversion…</span>
                    </>
                  ) : status === 'done' ? (
                    <>
                      <span className="text-emerald-300 font-black text-sm">✓</span>
                      <span className="text-white font-extrabold tracking-wide">PDF Export Complete!</span>
                    </>
                  ) : settings.mode === 'selected-content' ? (
                    <>
                      <span>✂️</span>
                      <span>Convert Selection to PDF</span>
                    </>
                  ) : settings.mode === 'study-notes' ? (
                    <>
                      <span>📚</span>
                      <span>Generate AI Study Guide PDF</span>
                    </>
                  ) : settings.previewBeforeDownload ? (
                    <>
                      <span>👁️</span>
                      <span>Preview Clean PDF</span>
                    </>
                  ) : settings.mode === 'reader-mode' ? (
                    <>
                      <span>📖</span>
                      <span>Convert to Clean Reader PDF</span>
                    </>
                  ) : (
                    <>
                      <span>⚡</span>
                      <span>Convert Full Page to PDF</span>
                    </>
                  )}
                  <span className="text-[9.5px] font-normal opacity-60 ml-1">↵ Enter</span>
                </span>
              </MagneticButton>

              <ProgressBar status={status} />
              <StatusMessage status={status} message={errorMessage} onRetry={reset} />
            </div>

            {/* 5. Footer Quick Bar */}
            <div className="flex items-center justify-between pt-0.5 pb-1 px-1 text-[10px] text-slate-400 rounded-b-[32px]">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-300">
                  {settings.paperSize.toUpperCase()} • {settings.orientation}
                </span>
                <span className="text-slate-600">•</span>
                <span className="capitalize">{settings.theme} Theme</span>
              </div>
              <button
                type="button"
                onClick={toggleSettings}
                className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>⚙️</span> Preferences
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
