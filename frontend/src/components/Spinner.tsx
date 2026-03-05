interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary' | 'foreground'
  className?: string
}

export default function Spinner({ size = 'md', color = 'primary', className = '' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  const colorClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    foreground: 'text-foreground'
  }

  return (
    <div 
      className={`animate-spin rounded-full border-2 border-muted border-t-current ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}
