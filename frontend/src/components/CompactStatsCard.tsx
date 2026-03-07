interface CompactStatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
}

export default function CompactStatsCard({ title, value, icon }: CompactStatsCardProps) {
  return (
    <div className="glass-card rounded-xl p-3 hover:border-primary/30 transition-all duration-300">
      <div className="flex items-center gap-2 mb-1">
        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
      </div>
      <p className="text-2xl font-bold text-foreground ml-8">{value}</p>
    </div>
  )
}
