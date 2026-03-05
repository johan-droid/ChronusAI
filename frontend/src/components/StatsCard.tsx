import { TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'

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
  const [displayValue, setDisplayValue] = useState(0)
  const targetValue = typeof value === 'number' ? value : parseInt(value) || 0

  useEffect(() => {
    if (typeof value === 'number') {
      const duration = 1000 // 1 second
      const steps = 30
      const increment = targetValue / steps
      let current = 0

      const timer = setInterval(() => {
        current += increment
        if (current >= targetValue) {
          setDisplayValue(targetValue)
          clearInterval(timer)
        } else {
          setDisplayValue(Math.floor(current))
        }
      }, duration / steps)

      return () => clearInterval(timer)
    }
  }, [targetValue])

  return (
    <div className="group relative overflow-hidden rounded-xl glass border border-primary/20 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(168,85,247,0.2)]">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300" />

      <div className="relative z-10 p-4">
        {/* Header */}
        <div className="flex items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium font-['Orbitron'] text-muted-foreground group-hover:text-foreground transition-colors">
            {title}
          </h3>
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 group-hover:from-primary/20 group-hover:to-accent/20 transition-all">
            <div className="h-4 w-4 text-primary group-hover:scale-110 transition-transform">
              {icon}
            </div>
          </div>
        </div>

        {/* Value */}
        <div className="space-y-1">
          <div className="text-3xl font-bold font-['Orbitron'] bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent group-hover:scale-105 transition-transform origin-left">
            {typeof value === 'number' ? displayValue : value}
          </div>
          
          {description && (
            <p className="text-xs text-muted-foreground font-['Space_Mono']">
              {description}
            </p>
          )}
          
          {trend && (
            <div className="flex items-center space-x-1 text-xs pt-2">
              <TrendingUp className={`h-3 w-3 ${trend.isPositive ? 'text-green-400' : 'text-red-400 rotate-180'}`} />
              <span className={`font-['Space_Mono'] ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-muted-foreground">from last week</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom indicator bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
    </div>
  )
}
