interface SkeletonLoaderProps {
  lines?: number
  className?: string
}

export default function SkeletonLoader({ lines = 3, className = '' }: SkeletonLoaderProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }, (_, index) => (
        <div key={index} className="animate-pulse">
          <div className="h-4 bg-muted rounded">
            <div className="h-full bg-gradient-to-r from-muted via-background to-muted rounded animate-shimmer"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface CardSkeletonProps {
  count?: number
  className?: string
}

export function CardSkeleton({ count = 1, className = '' }: CardSkeletonProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="bg-card border rounded-lg p-4 animate-pulse">
          <div className="space-y-3">
            <div className="h-6 bg-muted rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
            </div>
            <div className="h-10 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface TableSkeletonProps {
  rows?: number
  columns?: number
  className?: string
}

export function TableSkeleton({ rows = 5, columns = 4, className = '' }: TableSkeletonProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }, (_, index) => (
          <div key={`header-${index}`} className="h-8 bg-muted rounded animate-pulse"></div>
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }, (_, colIndex) => (
            <div key={`cell-${rowIndex}-${colIndex}`} className="h-6 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      ))}
    </div>
  )
}
