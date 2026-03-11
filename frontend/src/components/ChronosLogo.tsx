import { memo } from 'react';

const ChronosLogo = memo(({ className = "h-8 w-8" }: { className?: string }) => {
  return (
    <div className={`relative ${className} flex items-center justify-center`}>
      <svg
        viewBox="0 0 100 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Legacy Chronos Logo - Simple clock design */}
        <defs>
          <linearGradient id="chronosGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="50%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
          
          <filter id="chronosGlow">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
          </filter>
        </defs>

        {/* Clock outer circle */}
        <circle
          cx="50"
          cy="60"
          r="45"
          stroke="url(#chronosGrad)"
          strokeWidth="4"
          fill="none"
          filter="url(#chronosGlow)"
        />

        {/* Clock inner circle */}
        <circle
          cx="50"
          cy="60"
          r="38"
          stroke="url(#chronosGrad)"
          strokeWidth="2"
          fill="none"
          opacity="0.8"
        />

        {/* Hour marks */}
        <line x1="50" y1="20" x2="50" y2="25" stroke="#EC4899" strokeWidth="2" />
        <line x1="50" y1="95" x2="50" y2="100" stroke="#EC4899" strokeWidth="2" />
        <line x1="20" y1="60" x2="25" y2="60" stroke="#EC4899" strokeWidth="2" />
        <line x1="75" y1="60" x2="80" y2="60" stroke="#EC4899" strokeWidth="2" />

        {/* Clock hands */}
        <line x1="50" y1="60" x2="50" y2="35" stroke="#EC4899" strokeWidth="3" strokeLinecap="round" />
        <line x1="50" y1="60" x2="65" y2="60" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" />

        {/* Center dot */}
        <circle cx="50" cy="60" r="3" fill="#EC4899" />

        {/* Chronos text */}
        <text
          x="50"
          y="105"
          textAnchor="middle"
          className="fill-current font-bold text-xs"
          style={{ fill: '#EC4899' }}
        >
          CHRONOS
        </text>
      </svg>
    </div>
  );
});

ChronosLogo.displayName = 'ChronosLogo';

export default ChronosLogo;
