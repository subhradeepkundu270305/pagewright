import React from 'react';
import { ConversionMode } from '../../utils/types';

interface Props {
  mode: ConversionMode;
  onChange: (mode: ConversionMode) => void;
  disabled: boolean;
}

const MODES: { value: ConversionMode; label: string; tag: string; icon: string; color: string; shadow: string }[] = [
  {
    value: 'full-page',
    label: 'Full Page',
    tag: 'Web',
    icon: '📄',
    color: 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)',
    shadow: '0 4px 14px rgba(99, 102, 241, 0.40)',
  },
  {
    value: 'reader-mode',
    label: 'Reader',
    tag: 'Clean',
    icon: '📖',
    color: 'linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)',
    shadow: '0 4px 14px rgba(139, 92, 246, 0.40)',
  },
  {
    value: 'selected-content',
    label: 'Selected',
    tag: 'Pick',
    icon: '✂️',
    color: 'linear-gradient(135deg, #0E7490 0%, #22D3EE 100%)',
    shadow: '0 4px 14px rgba(34, 211, 238, 0.35)',
  },
  {
    value: 'study-notes',
    label: 'AI Notes',
    tag: 'Study',
    icon: '📚',
    color: 'linear-gradient(135deg, #7E22CE 0%, #A855F7 100%)',
    shadow: '0 4px 14px rgba(168, 85, 247, 0.40)',
  },
];

export const ModeSelector: React.FC<Props> = ({ mode, onChange, disabled }) => {
  const activeIndex = Math.max(0, MODES.findIndex((m) => m.value === mode));
  const activeMode = MODES[activeIndex];

  // Calculate sliding pill coordinates (4 columns with 6px gap and 4px container padding)
  const leftPercent = activeIndex * 25;

  return (
    <div className="relative p-1 bg-[#12162B] border border-white/[0.08] rounded-2xl overflow-hidden select-none">
      {/* Sliding Squash-and-Stretch Spring Pill */}
      <div
        className="absolute top-1 bottom-1 rounded-xl transition-all duration-350 pointer-events-none z-0"
        style={{
          left: `calc(${leftPercent}% + 4px)`,
          width: 'calc(25% - 8px)',
          background: activeMode.color,
          boxShadow: activeMode.shadow,
          transition: 'left 380ms var(--ease-spring), background 300ms var(--ease-out), box-shadow 300ms var(--ease-out)',
        }}
      />

      {/* Mode Buttons Grid */}
      <div className="relative z-10 grid grid-cols-4 gap-1.5">
        {MODES.map(({ value, label, tag, icon }, idx) => {
          const isActive = mode === value;
          return (
            <button
              key={value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(value)}
              className={`group relative flex flex-col items-center justify-center h-[56px] px-1 rounded-xl transition-all duration-150 text-center cursor-pointer ${
                isActive
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
            >
              <span className="text-base leading-none mb-1 transition-transform duration-200 group-hover:scale-110">
                {icon}
              </span>
              <span className="text-[11px] font-bold tracking-tight block leading-tight truncate w-full">
                {label}
              </span>
              <span
                className={`text-[8px] font-extrabold tracking-wider uppercase px-1.5 py-[1px] mt-0.5 rounded transition-colors ${
                  isActive
                    ? 'bg-black/20 text-white'
                    : 'text-slate-500 group-hover:text-slate-400'
                }`}
              >
                {tag}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
