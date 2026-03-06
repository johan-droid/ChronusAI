import { memo } from 'react';
import OptimizedSpinner from './OptimizedSpinner';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'default' | 'gradient' | 'dots';
  text?: string;
}

const LoadingSpinner = memo(({ 
  size = 'md', 
  className = '', 
  variant = 'default',
  text
}: LoadingSpinnerProps) => {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <OptimizedSpinner size={size} variant={variant} />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
