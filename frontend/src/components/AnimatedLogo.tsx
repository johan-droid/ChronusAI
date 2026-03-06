import { useEffect, useState } from 'react';

interface AnimatedLogoProps {
  className?: string;
  size?: number;
  autoPlay?: boolean;
}

export default function AnimatedLogo({ className = '', size = 80, autoPlay = true }: AnimatedLogoProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (autoPlay) {
      setIsAnimating(true);
    }
  }, [autoPlay]);

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Hourglass outline with line tracing animation */}
        <path
          d="M 50 30 Q 50 20 60 20 L 140 20 Q 150 20 150 30 L 150 70 Q 150 85 135 95 L 100 115 L 65 95 Q 50 85 50 70 Z"
          stroke="url(#gradient1)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={isAnimating ? 'logo-trace' : ''}
          style={{ 
            strokeDasharray: 400,
            strokeDashoffset: isAnimating ? 0 : 400,
            animation: isAnimating ? 'traceLine 2s ease-in-out forwards' : 'none'
          }}
        />
        
        {/* Bottom half of hourglass */}
        <path
          d="M 50 170 Q 50 180 60 180 L 140 180 Q 150 180 150 170 L 150 130 Q 150 115 135 105 L 100 85 L 65 105 Q 50 115 50 130 Z"
          stroke="url(#gradient2)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={isAnimating ? 'logo-trace' : ''}
          style={{ 
            strokeDasharray: 400,
            strokeDashoffset: isAnimating ? 0 : 400,
            animation: isAnimating ? 'traceLine 2s ease-in-out 0.3s forwards' : 'none'
          }}
        />

        {/* Infinity symbol inside */}
        <path
          d="M 70 100 Q 80 90 90 100 Q 100 110 110 100 Q 120 90 130 100 Q 120 110 110 100 Q 100 90 90 100 Q 80 110 70 100 Z"
          stroke="url(#gradient3)"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={isAnimating ? 'logo-trace' : ''}
          style={{ 
            strokeDasharray: 300,
            strokeDashoffset: isAnimating ? 0 : 300,
            animation: isAnimating ? 'traceLine 1.5s ease-in-out 0.6s forwards' : 'none'
          }}
        />

        {/* Glow effect */}
        <circle
          cx="100"
          cy="100"
          r="70"
          fill="url(#glowGradient)"
          opacity="0"
          className={isAnimating ? 'logo-glow' : ''}
          style={{
            animation: isAnimating ? 'glowPulse 2s ease-in-out 1s infinite' : 'none'
          }}
        />

        {/* Gradients */}
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff8c00" />
            <stop offset="50%" stopColor="#ffa500" />
            <stop offset="100%" stopColor="#ff6b00" />
          </linearGradient>
          
          <linearGradient id="gradient2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="50%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
          
          <linearGradient id="gradient3" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#93c5fd" />
          </linearGradient>

          <radialGradient id="glowGradient">
            <stop offset="0%" stopColor="#ff8c00" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.1" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}
