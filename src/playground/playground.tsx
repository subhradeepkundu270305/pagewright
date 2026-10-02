import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../popup/styles.css';
import { ModeSelector } from '../popup/components/ModeSelector';
import { HeroPreview3D } from '../popup/components/HeroPreview3D';
import { MagneticButton } from '../popup/components/motion/MagneticButton';
import { AnimatedToggle } from '../popup/components/motion/AnimatedToggle';
import { Expandable } from '../popup/components/motion/Expandable';
import { MotionCard } from '../popup/components/motion/MotionCard';
import type { TargetMode, Theme } from '../utils/types';

const Playground: React.FC = () => {
  const [mode, setMode] = useState<TargetMode>('full-page');
  const [theme, setTheme] = useState<Theme>('clean');
  const [toggle1, setToggle1] = useState(true);
  const [toggle2, setToggle2] = useState(false);
  const [toggle3, setToggle3] = useState(true);
  const [expanded1, setExpanded1] = useState(true);
  const [expanded2, setExpanded2] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  return (
    <div className={`max-w-5xl mx-auto space-y-10 pb-16 ${reducedMotion ? 'reduced-motion-active' : ''}`}>
      {/* Playground Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-white/10 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-400 text-black text-sm">
                ✦
              </span>
              Pagewright Motion &amp; Shape Playground
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Dev Only
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Live interactive environment to test 60fps physics, squircle radii, magnetic buttons, and preview morphing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-300 flex items-center gap-2 font-medium">
            <span>Reduced Motion Emulation:</span>
            <AnimatedToggle
              checked={reducedMotion}
              onChange={setReducedMotion}
              size="sm"
            />
          </label>
        </div>
      </header>

      {/* Grid of Motion Primitives */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 1. Hero Preview 3D (Subpixel Parallax & Shared Elements) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              1. Hero Preview &amp; Shared-Element Morph
            </h2>
            <span className="text-xs text-cyan-400 font-semibold">Zero-Blur Parallax</span>
          </div>
          <MotionCard className="p-5 rounded-2xl space-y-4">
            <HeroPreview3D
              status="idle"
              title="Modern Physics & Motion Design with CSS Transforms"
              domain="pagewright.internal"
              mode={mode}
              theme={theme}
            />
            <div className="space-y-2 pt-2 border-t border-white/10">
              <span className="text-xs text-slate-400 font-medium">Switch Target Mode:</span>
              <ModeSelector mode={mode} onChange={setMode} />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-400 font-medium">Theme:</span>
              {(['clean', 'original', 'minimal'] as Theme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    theme === t
                      ? 'bg-indigo-600/40 border-cyan-400 text-white'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </MotionCard>
        </section>

        {/* 2. Magnetic Buttons & Physics */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              2. Magnetic Hover &amp; Spring Press
            </h2>
            <span className="text-xs text-purple-400 font-semibold">rAF Throttled</span>
          </div>
          <MotionCard className="p-5 rounded-2xl space-y-5">
            <div className="space-y-2">
              <p className="text-xs text-slate-400">
                Primary convert action with 4s idle breathing pulse, light sweep, and magnetic cursor tracking:
              </p>
              <MagneticButton
                className="btn-convert-gradient idle-breathe w-full py-3.5 px-4 font-bold text-sm text-white flex items-center justify-center gap-2"
                onClick={() => alert('Primary Magnetic Action Triggered!')}
              >
                <span>⚡</span> Convert Full Page to PDF
              </MagneticButton>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/10">
              <p className="text-xs text-slate-400">
                Magnetic attraction intensities:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <MagneticButton
                  magneticDistance={4}
                  className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-white"
                >
                  Subtle (4px)
                </MagneticButton>
                <MagneticButton
                  magneticDistance={8}
                  className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-semibold text-white"
                >
                  Medium (8px)
                </MagneticButton>
                <MagneticButton
                  magneticDistance={14}
                  className="py-2 px-3 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-xs font-semibold text-cyan-300"
                >
                  High (14px)
                </MagneticButton>
              </div>
            </div>
          </MotionCard>
        </section>

        {/* 3. Springy Toggles */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              3. Squash-and-Stretch Toggles
            </h2>
            <span className="text-xs text-emerald-400 font-semibold">Spring Easing</span>
          </div>
          <MotionCard className="p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <div>
                <span className="text-sm font-semibold text-white block">Include Visuals &amp; Figures</span>
                <span className="text-xs text-slate-400">Standard Medium Toggle (40x20px)</span>
              </div>
              <AnimatedToggle
                checked={toggle1}
                onChange={setToggle1}
                size="md"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <div>
                <span className="text-sm font-semibold text-white block">Executive AI Summary</span>
                <span className="text-xs text-slate-400">Compact Small Toggle (32x16px)</span>
              </div>
              <AnimatedToggle
                checked={toggle2}
                onChange={setToggle2}
                size="sm"
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <span className="text-sm font-semibold text-white block">Ad Removal Heuristics</span>
                <span className="text-xs text-slate-400">Active state glow</span>
              </div>
              <AnimatedToggle
                checked={toggle3}
                onChange={setToggle3}
                size="md"
              />
            </div>
          </MotionCard>
        </section>

        {/* 4. Zero-Layout-Thrash Expandable Containers */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              4. Expandable Accordions
            </h2>
            <span className="text-xs text-indigo-400 font-semibold">grid-template-rows: 0fr $\to$ 1fr</span>
          </div>
          <MotionCard className="p-5 rounded-2xl space-y-3">
            <div>
              <button
                type="button"
                onClick={() => setExpanded1(!expanded1)}
                className="w-full flex items-center justify-between py-2 text-left font-semibold text-sm text-white"
              >
                <span>Typography Settings</span>
                <span className={`transform transition-transform ${expanded1 ? 'rotate-180' : ''}`}>▼</span>
              </button>
              <Expandable expanded={expanded1}>
                <div className="pt-2 pb-1 text-xs text-slate-400 space-y-2 border-t border-white/5">
                  <p>
                    Content smoothly animates between heights without recalculating absolute pixel dimensions or triggering continuous layout thrash.
                  </p>
                  <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-cyan-300 font-mono text-[11px]">
                    --radius-sm: 12px; --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
                  </div>
                </div>
              </Expandable>
            </div>

            <div className="border-t border-white/10 pt-2">
              <button
                type="button"
                onClick={() => setExpanded2(!expanded2)}
                className="w-full flex items-center justify-between py-2 text-left font-semibold text-sm text-white"
              >
                <span>AI Enhancement Pipeline</span>
                <span className={`transform transition-transform ${expanded2 ? 'rotate-180' : ''}`}>▼</span>
              </button>
              <Expandable expanded={expanded2}>
                <div className="pt-2 pb-1 text-xs text-slate-400 space-y-2 border-t border-white/5">
                  <p>
                    Extracts headings, generates executive summaries, builds dynamic tables of contents, and renders study cards.
                  </p>
                </div>
              </Expandable>
            </div>
          </MotionCard>
        </section>

        {/* 5. Concentric Radius System Showcase */}
        <section className="space-y-3 md:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
              5. Concentric Radius System (Squircle-Enhanced)
            </h2>
            <span className="text-xs text-slate-400 font-mono">tokens.css</span>
          </div>
          <MotionCard className="p-6 rounded-3xl space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-center">
              <div className="p-4 rounded-[8px] bg-white/[0.04] border border-white/10 flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-white mb-1">--radius-xs</span>
                <span className="text-[10px] text-slate-400 font-mono">8px</span>
                <span className="text-[9px] text-slate-500 mt-2">Badges, Tags</span>
              </div>

              <div className="p-4 rounded-[12px] bg-white/[0.04] border border-white/10 flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-white mb-1">--radius-sm</span>
                <span className="text-[10px] text-slate-400 font-mono">12px</span>
                <span className="text-[9px] text-slate-500 mt-2">Inputs, Toggles</span>
              </div>

              <div className="p-4 rounded-[16px] bg-white/[0.04] border border-white/10 flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-white mb-1">--radius-md</span>
                <span className="text-[10px] text-slate-400 font-mono">16px</span>
                <span className="text-[9px] text-slate-500 mt-2">Buttons, Cards</span>
              </div>

              <div className="p-4 rounded-[24px] bg-white/[0.04] border border-white/10 flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-white mb-1">--radius-lg</span>
                <span className="text-[10px] text-slate-400 font-mono">24px</span>
                <span className="text-[9px] text-slate-500 mt-2">Panels, Glass</span>
              </div>

              <div className="p-4 rounded-[32px] bg-white/[0.04] border border-white/10 flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-white mb-1">--radius-xl</span>
                <span className="text-[10px] text-slate-400 font-mono">32px</span>
                <span className="text-[9px] text-slate-500 mt-2">Popup Shell</span>
              </div>

              <div className="p-4 rounded-full bg-white/[0.04] border border-white/10 flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-white mb-1">--radius-full</span>
                <span className="text-[10px] text-slate-400 font-mono">999px</span>
                <span className="text-[9px] text-slate-500 mt-2">Pills, Knobs</span>
              </div>
            </div>
          </MotionCard>
        </section>
      </div>
    </div>
  );
};

const rootEl = document.getElementById('playground-root');
if (rootEl) {
  createRoot(rootEl).render(<Playground />);
}
