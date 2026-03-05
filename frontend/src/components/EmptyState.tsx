import type { ReactNode } from 'react'
import { Calendar, Search, Users, Clock, AlertCircle } from 'lucide-react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  type?: 'default' | 'search' | 'calendar' | 'meetings' | 'error'
}

export default function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  type = 'default' 
}: EmptyStateProps) {
  const getDefaultIcon = () => {
    switch (type) {
      case 'search':
        return <Search className="h-12 w-12 text-muted-foreground" />
      case 'calendar':
        return <Calendar className="h-12 w-12 text-muted-foreground" />
      case 'meetings':
        return <Users className="h-12 w-12 text-muted-foreground" />
      case 'error':
        return <AlertCircle className="h-12 w-12 text-destructive" />
      default:
        return <Clock className="h-12 w-12 text-muted-foreground" />
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {/* Icon */}
      <div className="mb-4">
        {icon || getDefaultIcon()}
      </div>

      {/* Content */}
      <div className="max-w-md">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {title}
        </h3>
        
        {description && (
          <p className="text-muted-foreground mb-6">
            {description}
          </p>
        )}

        {/* Action Button */}
        {action && (
          <button
            onClick={action.onClick}
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}
