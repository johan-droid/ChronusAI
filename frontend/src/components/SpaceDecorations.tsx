import { memo } from 'react';

/**
 * SpaceDecorations — extracted from LandingPage footer.
 * Wrapped in React.memo so the complex SVGs only re-render
 * when absolutely necessary.  The parent sets `content-visibility: auto`
 * via the wrapper class for paint-on-demand.
 */
const SpaceDecorations = memo(() => (
  <div className="space-decorations-container" style={{ contentVisibility: 'auto', containIntrinsicSize: '100% 400px' }}>
    {/* Astronaut */}
    <div className="hidden md:block absolute top-8 right-[8%] opacity-[0.06] pointer-events-none">
      <svg width="80" height="100" viewBox="0 0 80 100" fill="none">
        <ellipse cx="40" cy="28" rx="18" ry="22" fill="white" />
        <rect x="18" y="22" width="44" height="6" rx="3" fill="rgba(120,180,255,0.4)" />
        <rect x="22" y="48" width="36" height="36" rx="10" fill="white" />
        <rect x="10" y="50" width="12" height="6" rx="3" fill="white" />
        <rect x="58" y="50" width="12" height="6" rx="3" fill="white" />
        <rect x="26" y="84" width="10" height="14" rx="4" fill="white" />
        <rect x="44" y="84" width="10" height="14" rx="4" fill="white" />
      </svg>
    </div>

    {/* Saturn */}
    <div className="hidden md:block absolute top-1/3 right-[15%] opacity-[0.06] pointer-events-none">
      <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
        <circle cx="40" cy="30" r="16" fill="url(#saturn_grad_deco)" />
        <ellipse cx="40" cy="30" rx="35" ry="8" stroke="rgba(210,170,120,0.4)" strokeWidth="1.5" fill="none" transform="rotate(-15 40 30)" />
        <defs>
          <radialGradient id="saturn_grad_deco"><stop offset="0%" stopColor="#E3BB76" /><stop offset="100%" stopColor="#A67C3D" /></radialGradient>
        </defs>
      </svg>
    </div>

    {/* Blue Planet */}
    <div className="hidden md:block absolute top-1/2 left-10 opacity-[0.08] pointer-events-none">
      <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
        <circle cx="25" cy="25" r="20" fill="url(#earth_grad_deco)" />
        <path d="M15 18 Q20 15, 28 20 Q32 25, 25 30 Q20 32, 16 28 Z" fill="rgba(100,180,100,0.3)" />
        <defs>
          <radialGradient id="earth_grad_deco"><stop offset="0%" stopColor="#4A90D9" /><stop offset="100%" stopColor="#1B3A6B" /></radialGradient>
        </defs>
      </svg>
    </div>

    {/* Mars */}
    <div className="hidden md:block absolute bottom-24 left-1/4 opacity-[0.07] pointer-events-none">
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="14" fill="url(#mars_grad_deco)" />
        <defs>
          <radialGradient id="mars_grad_deco"><stop offset="0%" stopColor="#E27B58" /><stop offset="100%" stopColor="#8B3A1A" /></radialGradient>
        </defs>
      </svg>
    </div>

    {/* Nebula glow */}
    <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[500px] h-[200px] rounded-full bg-primary/5 blur-[80px] pointer-events-none" />
  </div>
));
SpaceDecorations.displayName = 'SpaceDecorations';

export default SpaceDecorations;
