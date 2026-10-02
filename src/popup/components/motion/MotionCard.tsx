import React, { useRef, useState, useEffect } from 'react';

interface MotionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  enableSpotlight?: boolean;
}

export const MotionCard: React.FC<MotionCardProps> = ({
  children,
  className = '',
  enableSpotlight = true,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const rafId = useRef<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableSpotlight || !cardRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    if (rafId.current) cancelAnimationFrame(rafId.current);

    rafId.current = requestAnimationFrame(() => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setCoords({ x, y });
    });
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    setCoords(null);
    props.onMouseLeave?.(e);
  };

  useEffect(() => {
    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`midnight-card relative overflow-hidden transition-all duration-200 ${className}`}
      {...props}
    >
      {/* Specular Spotlight Overlay */}
      {coords && (
        <span
          className="absolute inset-0 pointer-events-none rounded-[inherit] transition-opacity duration-150"
          style={{
            background: `radial-gradient(circle at ${coords.x}% ${coords.y}%, rgba(255, 255, 255, 0.08) 0%, transparent 60%)`,
          }}
        />
      )}
      {children}
    </div>
  );
};
