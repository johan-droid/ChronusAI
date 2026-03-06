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
  }, [targetValue])

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-slate-900/50 border border-white/5 backdrop-blur-xl p-6 hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
            <div className="text-blue-400">
              {icon}
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-white">
            {typeof value === 'number' ? displayValue : value}
          </p>
          {description && (
            <p className="text-xs text-slate-500">{description}</p>
          )}
        </div>
      </div>
    </div>
  )
}
