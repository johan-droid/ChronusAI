import { memo } from 'react';

const AnimatedLogo = memo(({ className = "h-8 w-8" }: { className?: string }) => {
  return (
    <div className={`relative ${className} flex items-center justify-center`}>
      <svg
        viewBox="0 0 100 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Thread gradient — brighter silvery blue */}
          <linearGradient id="threadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e8f0ff" />
            <stop offset="40%" stopColor="#c8d8f0" />
            <stop offset="100%" stopColor="#a0b8d0" />
          </linearGradient>

          {/* Glow gradient for the animated stroke — brighter */}
          <linearGradient id="threadGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#dce8f8" />
            <stop offset="100%" stopColor="#b0c4de" />
          </linearGradient>

          {/* Subtle shimmer filter */}
          <filter id="threadFilter" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.3" />
          </filter>
        </defs>

        {/* ---- Outer hourglass frame ---- */}
        {/* Static base stroke */}
        <path
          d="M 22 8 C 22 8 18 8 18 14 C 18 28 42 48 50 56 C 58 48 82 28 82 14 C 82 8 78 8 78 8 L 22 8 Z
             M 50 64 C 42 72 18 92 18 106 C 18 112 22 112 22 112 L 78 112 C 78 112 82 112 82 106 C 82 92 58 72 50 64 Z"
          stroke="url(#threadGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.7"
        />
        {/* Animated thread draw — outer frame */}
        <path
          d="M 22 8 C 22 8 18 8 18 14 C 18 28 42 48 50 56 C 58 48 82 28 82 14 C 82 8 78 8 78 8 L 22 8 Z
             M 50 64 C 42 72 18 92 18 106 C 18 112 22 112 22 112 L 78 112 C 78 112 82 112 82 106 C 82 92 58 72 50 64 Z"
          stroke="url(#threadGlow)"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="500"
          strokeDashoffset="500"
          filter="url(#threadFilter)"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="500"
            to="0"
            dur="2.5s"
            fill="freeze"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.5;1;0.9;1;0.5"
            dur="2.5s"
            repeatCount="indefinite"
          />
        </path>

        {/* ---- Inner infinity / sand flow thread ---- */}
        {/* Static base */}
        <path
          d="M 34 22 C 34 22 38 38 50 50 C 62 38 66 22 66 22
             M 34 98 C 34 98 38 82 50 70 C 62 82 66 98 66 98"
          stroke="url(#threadGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.5"
        />
        {/* Animated thread draw — inner curves */}
        <path
          d="M 34 22 C 34 22 38 38 50 50 C 62 38 66 22 66 22
             M 34 98 C 34 98 38 82 50 70 C 62 82 66 98 66 98"
          stroke="url(#threadGlow)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="200"
          strokeDashoffset="200"
          filter="url(#threadFilter)"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="200"
            to="0"
            dur="2s"
            begin="0.6s"
            fill="freeze"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.2;1;0.9;1;0.2"
            dur="2s"
            begin="0.6s"
            repeatCount="indefinite"
          />
        </path>

        {/* ---- Sand flow center thread ---- */}
        <line
          x1="50" y1="52" x2="50" y2="68"
          stroke="url(#threadGlow)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="20"
          strokeDashoffset="20"
          opacity="0.8"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="20"
            to="0"
            dur="1.5s"
            begin="1s"
            fill="freeze"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.2;0.9;0.6;0.9;0.2"
            dur="1.5s"
            begin="1s"
            repeatCount="indefinite"
          />
        </line>
      </svg>
    </div>
  );
});

AnimatedLogo.displayName = 'AnimatedLogo';

export default AnimatedLogo;