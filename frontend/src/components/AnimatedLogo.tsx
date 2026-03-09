import { memo } from 'react';

const AnimatedLogo = memo(({ className = "h-8 w-8" }: { className?: string }) => {
  return (
    <div className={`relative ${className} flex items-center justify-center`}>
      <img
        src="/logo.png"
        alt="ChronosAI Logo"
        className="object-contain w-full h-full"
      />
    </div>
  );
});

AnimatedLogo.displayName = 'AnimatedLogo';

export default AnimatedLogo;