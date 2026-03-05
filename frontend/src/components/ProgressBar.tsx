interface ProgressBarProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'success' | 'warning' | 'error'
  showLabel?: boolean
  label?: string
}

export default function ProgressBar({ 
  value, 
  max = 100, 
  size = 'md', 
  color = 'primary',
  showLabel = false,
  label 
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  const colorClasses = {
    primary: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  }

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium">{label || 'Progress'}</span>
          <span className="text-sm text-muted-foreground">{Math.round(percentage)}%</span>
        </div>
      )}
      
      <div className={`w-full bg-muted rounded-full ${sizeClasses[size]}`}>
        <div
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {!showLabel && (
        <div className="mt-1 text-xs text-muted-foreground text-center">
          {value} / {max}
        </div>
      )}
    </div>
  )
}
