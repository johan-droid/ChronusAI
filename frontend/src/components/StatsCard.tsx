import { TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './Card'

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
}

export default function StatsCard({ title, value, description, icon, trend }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center space-x-1 text-xs">
            <TrendingUp className={`h-3 w-3 ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`} />
            <span className={trend.isPositive ? 'text-green-500' : 'text-red-500'}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-muted-foreground">from last week</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
