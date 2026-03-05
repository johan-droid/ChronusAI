import { Calendar, Clock, Users } from 'lucide-react'

interface QuickActionsProps {
  onQuickSchedule: () => void
  onCheckAvailability: () => void
  onScheduleWithAttendees: () => void
}

export default function QuickActions({ 
  onQuickSchedule, 
  onCheckAvailability, 
  onScheduleWithAttendees 
}: QuickActionsProps) {
  const quickActions = [
    {
      title: 'Quick Schedule',
      description: 'Schedule a meeting for tomorrow at 10 AM',
      icon: <Calendar className="h-5 w-5" />,
      action: onQuickSchedule,
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Check Availability',
      description: 'See when I\'m free this week',
      icon: <Clock className="h-5 w-5" />,
      action: onCheckAvailability,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Team Meeting',
      description: 'Schedule with team members',
      icon: <Users className="h-5 w-5" />,
      action: onScheduleWithAttendees,
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {quickActions.map((action, index) => (
        <button
          key={index}
          onClick={action.action}
          className={`p-4 rounded-lg text-white transition-colors ${action.color} flex flex-col items-center text-center space-y-2 hover:shadow-lg`}
        >
          <div className="p-2 bg-white/20 rounded-full">
            {action.icon}
          </div>
          <div>
            <h3 className="font-semibold">{action.title}</h3>
            <p className="text-sm opacity-90">{action.description}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
