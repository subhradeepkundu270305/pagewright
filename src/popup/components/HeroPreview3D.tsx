import React, { useState, useRef, useEffect } from 'react';
import type { ConversionStep, ConversionMode, Theme } from '../../utils/types';

interface HeroPreview3DProps {
  status: ConversionStep;
  title: string;
  domain: string;
  mode: ConversionMode;
  theme: Theme;
}

export const HeroPreview3D: React.FC<HeroPreview3DProps> = ({
  status,
  title,
  domain,
  mode,
  theme,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const rafId = useRef<number | null>(null);

  const isCleaning = status === 'extracting' || status === 'cleaning';
  const isRendering = status === 'analyzing' || status === 'rendering';
  const isSaving = status === 'generating' || status === 'saving' || status === 'previewing';
  const isDone = status === 'done';
  const isError = status === 'error';
  const isBusy = status !== 'idle' && !isDone && !isError;

  // Crisp, non-blurry 2D cursor parallax tracking (replaces 3D rotateX/rotateY that causes Chromium texture downsampling blur)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || isBusy) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    if (rafId.current) cancelAnimationFrame(rafId.current);

    rafId.current = requestAnimationFrame(() => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)) * 3.5;
      const y = ((e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)) * 3.5;
      setOffset({ x, y });
    });
  };

  const handleMouseLeave = () => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    setIsHovered(false);
    setOffset({ x: 0, y: 0 });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  // Dynamic shadow shifting with cursor parallax
  const shadowX = -offset.x * 2;
  const shadowY = -offset.y * 2 + 10;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-[108px] flex items-center justify-center py-0.5 select-none"
    >
      {/* Subtle ambient accent glow */}
      <div
        className={`absolute inset-0 mx-auto w-52 h-16 rounded-full pointer-events-none transition-opacity duration-300 ${
          mode === 'reader-mode'
            ? 'bg-violet-500/12'
            : mode === 'selected-content'
            ? 'bg-cyan-500/12'
            : mode === 'study-notes'
            ? 'bg-purple-500/12'
            : 'bg-indigo-500/12'
        }`}
      />

      {/* === The Crisp Mini Page Sheet (No 3D Blur!) === */}
      <div
        style={{
          transform: isBusy
            ? isSaving || isDone
              ? 'scale(1.02)'
              : 'translate3d(0, -2px, 0)'
            : `translate3d(${offset.x}px, ${offset.y}px, 0)`,
          boxShadow: isBusy
            ? '0 12px 28px -4px rgba(99, 102, 241, 0.40), 0 0 16px rgba(34, 211, 238, 0.25)'
            : `${shadowX}px ${shadowY}px 24px -4px rgba(0, 0, 0, 0.50), inset 0 1px 0 rgba(255, 255, 255, 0.12)`,
          transition: isHovered && !isBusy
            ? 'transform 100ms ease-out, box-shadow 150ms ease-out'
            : 'transform 360ms var(--ease-spring), box-shadow 360ms var(--ease-spring)',
        }}
        className={`relative w-[240px] h-[98px] rounded-2xl border border-white/[0.12] overflow-hidden transition-colors duration-300 ${
          isError
            ? 'bg-rose-950/40 border-rose-500/40 error-shake'
            : 'bg-[#101426]'
        }`}
      >
        {/* Top Paper Header Bar */}
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                mode === 'reader-mode'
                  ? 'bg-violet-400'
                  : mode === 'selected-content'
                  ? 'bg-cyan-400'
                  : mode === 'study-notes'
                  ? 'bg-purple-400'
                  : 'bg-indigo-400'
              }`}
            />
            <span className="text-[9.5px] font-bold text-slate-200 uppercase tracking-wider truncate max-w-[130px]">
              {domain || 'Webpage'}
            </span>
          </div>
          <span
            className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded transition-colors duration-300 ${
              mode === 'reader-mode'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : mode === 'selected-content'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : mode === 'study-notes'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
            }`}
          >
            {mode === 'reader-mode'
              ? 'READER'
              : mode === 'study-notes'
              ? 'NOTES'
              : mode === 'selected-content'
              ? 'PICKER'
              : 'FULL PAGE'}
          </span>
        </div>

        {/* Sheet Content Area with Shared-Element Mode Transitions */}
        <div className="p-2.5 relative h-[68px] overflow-hidden">
          {/* Active Conversion States */}
          {isCleaning ? (
            <div className="space-y-1.5 animate-pulse">
              <div className="h-2 w-full bg-amber-500/25 border border-amber-500/30 rounded flex items-center justify-center">
                <span className="text-[7.5px] text-amber-200 font-bold uppercase tracking-wider">
                  🧹 Removing Ads & Overlays…
                </span>
              </div>
              <div className="h-2 w-3/4 bg-slate-300/80 rounded" />
              <div className="h-1.5 w-full bg-slate-400/40 rounded" />
            </div>
          ) : isRendering ? (
            <div className="relative h-full flex flex-col justify-center space-y-1.5">
              <div className="h-2 w-4/5 bg-cyan-300/90 rounded" />
              <div className="h-1.5 w-full bg-slate-200/70 rounded" />
              <div className="h-1.5 w-11/12 bg-slate-300/50 rounded" />
            </div>
          ) : isDone ? (
            <div className="h-full flex items-center justify-center gap-2 animate-scale-in">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400/60 flex items-center justify-center shadow-md shadow-emerald-500/20">
                <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-[10.5px] font-extrabold text-emerald-300 tracking-wide">
                PDF Export Complete
              </span>
            </div>
          ) : isSaving ? (
            <div className="h-full flex items-center justify-center gap-2">
              <div className="w-5 h-5 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
              <span className="text-[10px] font-bold text-cyan-300">
                Formatting Pages…
              </span>
            </div>
          ) : (
            /* Mode-Shifting Simulated Document Layout */
            <div className="relative h-full">
              {/* Document Title Header */}
              <div className="text-[10px] font-bold text-slate-100 truncate leading-tight mb-1.5">
                {title || 'Document Outline'}
              </div>

              {/* Mode: Full Page (Full width with sidebars & elements) */}
              {mode === 'full-page' && (
                <div className="grid grid-cols-4 gap-1.5 transition-all duration-300">
                  <div className="col-span-3 space-y-1">
                    <div className="h-1.5 w-full bg-slate-400/40 rounded" />
                    <div className="h-1.5 w-5/6 bg-slate-400/30 rounded" />
                    <div className="h-1.5 w-4/5 bg-slate-400/20 rounded" />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <div className="h-3 w-full bg-indigo-500/20 border border-indigo-500/30 rounded" />
                    <div className="h-2.5 w-full bg-slate-600/30 rounded" />
                  </div>
                </div>
              )}

              {/* Mode: Reader (Centered clean editorial column, ads/sidebar collapsed) */}
              {mode === 'reader-mode' && (
                <div className="max-w-[170px] mx-auto space-y-1 transition-all duration-300">
                  <div className="h-1.5 w-full bg-violet-300/70 rounded" />
                  <div className="h-1.5 w-11/12 bg-slate-300/50 rounded" />
                  <div className="h-1.5 w-4/5 bg-slate-400/40 rounded" />
                  <div className="h-1.5 w-2/3 bg-slate-400/30 rounded" />
                </div>
              )}

              {/* Mode: Selected (Dashed selection frame around targeted block, others dimmed) */}
              {mode === 'selected-content' && (
                <div className="space-y-1 transition-all duration-300">
                  <div className="p-1 rounded border border-dashed border-cyan-400/80 bg-cyan-500/10">
                    <div className="h-1.5 w-4/5 bg-cyan-300/90 rounded" />
                    <div className="h-1.5 w-full bg-cyan-300/60 rounded mt-0.5" />
                  </div>
                  <div className="opacity-30 space-y-1">
                    <div className="h-1.5 w-3/4 bg-slate-500/30 rounded" />
                  </div>
                </div>
              )}

              {/* Mode: AI Study Notes (Bulleted concepts with purple accents) */}
              {mode === 'study-notes' && (
                <div className="space-y-1 transition-all duration-300">
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-purple-400" />
                    <div className="h-1.5 w-3/4 bg-purple-300/80 rounded" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-purple-400" />
                    <div className="h-1.5 w-5/6 bg-slate-300/60 rounded" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-cyan-400" />
                    <div className="h-1.5 w-2/3 bg-cyan-300/70 rounded" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
