import React, { useMemo } from 'react';

interface FloatingLinesBackgroundProps {
  lineCount?: number;
  className?: string;
}

// Lightweight animated background with diagonal floating lines.
// Pure CSS animations; no canvas. Keeps GPU work minimal.
export const FloatingLinesBackground: React.FC<FloatingLinesBackgroundProps> = ({
  lineCount = 14,
  className = ''
}) => {
  const lines = useMemo(() => Array.from({ length: lineCount }, (_, i) => i), [lineCount]);

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <style>{`
        @keyframes flb-move-x {
          0% { transform: translateX(-25%) rotate(-16deg) }
          50% { transform: translateX(0%) rotate(-16deg) }
          100% { transform: translateX(25%) rotate(-16deg) }
        }
        @keyframes flb-glow {
          0%,100% { opacity: 0.55 }
          50% { opacity: 0.9 }
        }
      `}</style>
      {/* subtle radial fade mask via gradient overlay */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(1200px 600px at 50% -10%, rgba(99,102,241,0.18), rgba(236,72,153,0.10) 35%, rgba(255,255,255,0) 70%)'
      }} />

      {lines.map((i) => {
        const top = (i / lineCount) * 100; // spread vertically
        const duration = 18 + (i % 7) * 2; // 18-30s
        const delay = -(i * 1.7); // desync
        const thickness = (i % 5 === 0) ? 2 : 1; // some thicker lines
        const hue = 210 + (i * 8) % 60; // blue→violet range
        const alpha = 0.28 + ((i % 3) * 0.06);
        const bg = `linear-gradient(90deg, rgba(${hue},91,255,0) 0%, rgba(${hue},91,255,${alpha}) 25%, rgba(${hue},91,255,${alpha}) 75%, rgba(${hue},91,255,0) 100%)`;
        return (
          <span
            key={i}
            style={{
              top: `${top}%`,
              height: thickness,
              width: '220%',
              left: '-60%',
              background: bg as any,
              filter: 'blur(0.2px) drop-shadow(0 0 6px rgba(99,102,241,0.25))',
              animation: `flb-move-x ${duration}s linear infinite, flb-glow ${duration * 0.9}s ease-in-out infinite`,
              animationDelay: `${delay}s`
            }}
            className="absolute block rounded-full"
          />
        );
      })}
    </div>
  );
};

export default FloatingLinesBackground;
