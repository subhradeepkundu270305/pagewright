import React, { useRef, useState, useEffect } from 'react';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  magneticDistance?: number;
  className?: string;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  magneticDistance = 5,
  className = '',
  onClick,
  ...props
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const rafId = useRef<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!btnRef.current || props.disabled) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    if (rafId.current) cancelAnimationFrame(rafId.current);

    rafId.current = requestAnimationFrame(() => {
      if (!btnRef.current) return;
      const rect = btnRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (e.clientX - centerX) / (rect.width / 2);
      const deltaY = (e.clientY - centerY) / (rect.height / 2);

      setOffset({
        x: Math.max(-magneticDistance, Math.min(magneticDistance, deltaX * magneticDistance)),
        y: Math.max(-magneticDistance, Math.min(magneticDistance, deltaY * magneticDistance)),
      });
    });
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    setIsHovered(false);
    setOffset({ x: 0, y: 0 });
    props.onMouseLeave?.(e);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(true);
    props.onMouseEnter?.(e);
  };

  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <button
      ref={btnRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transform: isHovered
          ? `translate3d(${offset.x}px, ${offset.y - 1.5}px, 0)`
          : 'translate3d(0, 0, 0)',
        transition: isHovered ? 'transform 100ms ease-out' : 'transform 240ms var(--ease-spring)',
      }}
      className={`relative active:scale-[0.97] transition-all select-none cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
