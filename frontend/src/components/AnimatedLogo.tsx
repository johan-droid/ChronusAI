import { memo } from 'react';

const AnimatedLogo = memo(({ className = "h-8 w-8" }: { className?: string }) => {
  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 32 32"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Hourglass Frame */}
        <path
          d="M8 4h16v4l-6 6 6 6v4H8v-4l6-6-6-6V4z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-orange-400 animate-pulse"
        />
        
        {/* Top Sand */}
        <path
          d="M10 6h12v2l-4 4h-4l-4-4V6z"
          fill="currentColor"
          className="text-orange-300 animate-bounce-gentle"
        />
        
        {/* Bottom Sand */}
        <path
          d="M10 26h12v-2l-4-4h-4l-4 4v2z"
          fill="currentColor"
          className="text-orange-500 animate-float-gentle"
        />
        
        {/* Falling Sand Particles */}
        <circle
          cx="16"
          cy="14"
          r="0.5"
          fill="currentColor"
          className="text-orange-400 animate-bounce"
        />
        <circle
          cx="16"
          cy="16"
          r="0.5"
          fill="currentColor"
          className="text-orange-400 animate-pulse"
        />
        <circle
          cx="16"
          cy="18"
          r="0.5"
          fill="currentColor"
          className="text-orange-400 animate-bounce"
        />
        
        {/* Tree-like branches */}
        <g className="animate-float-gentle">
          <path
            d="M16 16l-2-2M16 16l2-2M16 16l-1-3M16 16l1-3"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            className="text-green-400 opacity-60 animate-pulse"
          />
        </g>
        
        {/* Sparkles */}
        <g className="animate-bounce-gentle">
          <path
            d="M6 8l1-1-1-1-1 1 1 1zM26 24l1-1-1-1-1 1 1 1z"
            fill="currentColor"
            className="text-yellow-300"
          />
        </g>
      </svg>
    </div>
  );
});

AnimatedLogo.displayName = 'AnimatedLogo';

export default AnimatedLogo;