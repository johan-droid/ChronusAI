import { memo } from 'react';

const AnimatedLogo = memo(({ className = "h-8 w-8" }: { className?: string }) => {
  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 40 40"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
          <linearGradient id="handGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="100%" stopColor="#c4b5fd" />
          </linearGradient>
        </defs>

        {/* Outer circle */}
        <circle
          cx="20"
          cy="20"
          r="17"
          fill="none"
          stroke="url(#logoGrad)"
          strokeWidth="2.5"
          opacity="0.9"
        />

        {/* Hour markers */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => {
          const isMain = angle % 90 === 0;
          const r1 = isMain ? 13 : 14;
          const r2 = 15.5;
          const rad = (angle - 90) * (Math.PI / 180);
          return (
            <line
              key={angle}
              x1={20 + r1 * Math.cos(rad)}
              y1={20 + r1 * Math.sin(rad)}
              x2={20 + r2 * Math.cos(rad)}
              y2={20 + r2 * Math.sin(rad)}
              stroke="url(#handGrad)"
              strokeWidth={isMain ? 2 : 1}
              strokeLinecap="round"
              opacity={isMain ? 0.9 : 0.4}
            />
          );
        })}

        {/* Hour hand */}
        <line
          x1="20"
          y1="20"
          x2="20"
          y2="11"
          stroke="url(#handGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Minute hand */}
        <line
          x1="20"
          y1="20"
          x2="27"
          y2="14"
          stroke="url(#handGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* Center dot */}
        <circle
          cx="20"
          cy="20"
          r="2"
          fill="url(#logoGrad)"
        />

        {/* AI sparkle accent */}
        <g opacity="0.7">
          <path
            d="M33 8l1-2 1 2 2 1-2 1-1 2-1-2-2-1 2-1z"
            fill="#a78bfa"
            className="animate-pulse"
          />
          <path
            d="M7 30l0.7-1.4 0.7 1.4 1.4 0.7-1.4 0.7-0.7 1.4-0.7-1.4-1.4-0.7 1.4-0.7z"
            fill="#60a5fa"
            className="animate-pulse"
            style={{ animationDelay: '0.5s' }}
          />
        </g>
      </svg>
    </div>
  );
});

AnimatedLogo.displayName = 'AnimatedLogo';

export default AnimatedLogo;