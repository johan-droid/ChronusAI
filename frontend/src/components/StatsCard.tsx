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

export default function StatsCard({ title, value, description, icon }: StatsCardProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const targetValue = typeof value === 'number' ? value : parseInt(value) || 0

  useEffect(() => {
    if (typeof value === 'number') {
      const duration = 1000
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
  }, [targetValue, value])

  return (
    <div className="group relative overflow-hidden rounded-xl bg-white/[0.02] border border-white/10 backdrop-blur-md p-4 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05] hover:shadow-sm">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="bg-white/5 p-2 rounded-lg border border-white/10">
            <div className="text-blue-400">{icon}</div>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-zinc-400">{title}</p>
          <p className="text-2xl md:text-3xl font-semibold text-zinc-50 tabular-nums">
            {typeof value === 'number' ? displayValue : value}
          </p>
          {description && (
            <p className="text-xs text-zinc-500">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
