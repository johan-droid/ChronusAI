import { Calendar, Clock, Users, Zap, Sparkles, Star } from 'lucide-react'
import { useSendMessage } from '../hooks/useSendMessage'

interface QuickActionsProps {
  onQuickSchedule?: () => void
  onCheckAvailability?: () => void
  onScheduleWithAttendees?: () => void
}

export default function QuickActions({ 
  onQuickSchedule, 
  onCheckAvailability, 
  onScheduleWithAttendees 
}: QuickActionsProps) {
  const sendMessage = useSendMessage();

  const handleQuickAction = (message: string, fallback?: () => void) => {
    if (sendMessage.isPending) return;
    
    try {
      sendMessage.mutate({ message });
    } catch (error) {
      fallback?.();
    }
  };

  const quickActions = [
    {
      title: 'Quick Schedule',
      description: 'Instant meeting creation',
      icon: <Calendar className="h-4 w-4 md:h-5 md:w-5" />,
      action: () => handleQuickAction('Schedule a 30 minute meeting for tomorrow at 2pm', onQuickSchedule),
      gradient: 'from-primary via-accent to-primary',
      badge: <Zap className="h-3 w-3" />
    },
    {
      title: 'Check Availability',
      description: 'View your free slots',
      icon: <Clock className="h-4 w-4 md:h-5 md:w-5" />,
      action: () => handleQuickAction('What is my availability for this week?', onCheckAvailability),
      gradient: 'from-secondary via-primary to-secondary',
      badge: <Sparkles className="h-3 w-3" />
    },
    {
      title: 'Team Meeting',
      description: 'Schedule with attendees',
      icon: <Users className="h-4 w-4 md:h-5 md:w-5" />,
      action: () => handleQuickAction('Schedule a team meeting for next Monday at 10am for 1 hour', onScheduleWithAttendees),
      gradient: 'from-accent via-secondary to-accent',
      badge: <Star className="h-3 w-3" />
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
      {quickActions.map((action, index) => (
        <button
          key={index}
          onClick={action.action}
          disabled={sendMessage.isPending}
          className="group relative overflow-hidden rounded-lg md:rounded-xl p-3 md:p-4 transition-all duration-300 hover:scale-105 glass border border-primary/20 hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[80px] md:min-h-[120px]"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          {/* Animated gradient background */}
          <div className={`absolute inset-0 bg-gradient-to-r ${action.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
          
          {/* Content */}
          <div className="relative z-10 flex items-center md:flex-col md:items-center md:text-center space-x-3 md:space-x-0 md:space-y-2">
            {/* Icon with badge */}
            <div className="relative flex-shrink-0">
              <div className="relative p-2 md:p-3 rounded-lg bg-gradient-to-br from-card/50 to-card backdrop-blur-sm">
                <div className="text-foreground group-hover:scale-110 transition-transform">
                  {action.icon}
                </div>
              </div>
              
              {/* Badge */}
              <div className="absolute -top-1 -right-1 p-1 rounded-full bg-gradient-to-br from-accent to-primary text-white shadow-lg group-hover:scale-110 transition-transform">
                {action.badge}
              </div>
            </div>
            
            {/* Text */}
            <div className="flex-1 md:flex-none text-left md:text-center">
              <h3 className="font-semibold text-foreground text-sm md:text-base group-hover:text-primary transition-colors">
                {action.title}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground group-hover:text-foreground transition-colors mt-0.5">
                {action.description}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
