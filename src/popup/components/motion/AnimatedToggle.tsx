import React, { useState } from 'react';

interface AnimatedToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md';
}

export const AnimatedToggle: React.FC<AnimatedToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  size = 'md',
}) => {
  const [isPressed, setIsPressed] = useState(false);

  const isSmall = size === 'sm';
  const trackW = isSmall ? 'w-8' : 'w-10';
  const trackH = isSmall ? 'h-4' : 'h-5';
  const knobSize = isSmall ? 'w-3 h-3' : 'w-4 h-4';
  const knobTranslate = isSmall ? (checked ? 'translate-x-4' : 'translate-x-0.5') : (checked ? 'translate-x-5' : 'translate-x-0.5');

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={`group relative inline-flex items-center ${trackW} ${trackH} rounded-full transition-colors duration-200 cursor-pointer select-none ${
        checked
          ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 shadow-sm shadow-indigo-500/30'
          : 'bg-white/10 hover:bg-white/15'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={label}
    >
      <span
        style={{
          width: isPressed ? (isSmall ? '16px' : '20px') : undefined,
        }}
        className={`inline-block ${knobSize} bg-white rounded-full shadow-md transition-all duration-200 ease-spring transform ${knobTranslate}`}
      />
    </button>
  );
};
