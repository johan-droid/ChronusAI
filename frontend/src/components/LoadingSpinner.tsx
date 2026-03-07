import { memo } from 'react';
import { Loader2 } from 'lucide-react';

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
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    };

    if (variant === 'dots') {
        return (
            <div className={`flex flex-col items-center gap-3 ${className}`}>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                {text && <p className="text-sm text-slate-400">{text}</p>}
            </div>
        );
    }

    if (variant === 'gradient') {
        return (
            <div className={`flex flex-col items-center gap-3 ${className}`}>
                <div className={`relative ${sizeClasses[size]}`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-spin" />
                    <div className="absolute inset-1 bg-background rounded-full" />
                </div>
                {text && <p className="text-sm text-slate-400">{text}</p>}
            </div>
        );
    }

    return (
        <div className={`flex flex-col items-center gap-3 ${className}`}>
            <Loader2
                className={`${sizeClasses[size]} animate-spin text-blue-400`}
            />
            {text && <p className="text-sm text-slate-400">{text}</p>}
        </div>
    );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
