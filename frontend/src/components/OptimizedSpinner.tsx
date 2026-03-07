import { memo } from 'react';
import { Loader2 } from 'lucide-react';

interface OptimizedSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'default' | 'gradient' | 'dots';
}

const OptimizedSpinner = memo(({ 
  size = 'md', 
  className = '', 
  variant = 'default' 
}: OptimizedSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  if (variant === 'dots') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    );
  }

  if (variant === 'gradient') {
    return (
      <div className={`relative ${sizeClasses[size]} ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-spin" />
        <div className="absolute inset-1 bg-background rounded-full" />
      </div>
    );
  }

  return (
    <Loader2 
      className={`${sizeClasses[size]} animate-spin text-blue-400 ${className}`} 
    />
  );
});

OptimizedSpinner.displayName = 'OptimizedSpinner';

export default OptimizedSpinner;