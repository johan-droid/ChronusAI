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
      icon: <Calendar className="h-6 w-6" />,
      action: () => handleQuickAction('Schedule a 30 minute meeting for tomorrow at 2pm', onQuickSchedule),
      gradient: 'from-primary via-accent to-primary',
      hoverGlow: 'hover:shadow-[0_0_40px_rgba(168,85,247,0.4)]',
      badge: <Zap className="h-4 w-4" />
    },
    {
      title: 'Check Availability',
      description: 'View your free slots',
      icon: <Clock className="h-6 w-6" />,
      action: () => handleQuickAction('What is my availability for this week?', onCheckAvailability),
      gradient: 'from-secondary via-primary to-secondary',
      hoverGlow: 'hover:shadow-[0_0_40px_rgba(59,130,246,0.4)]',
      badge: <Sparkles className="h-4 w-4" />
    },
    {
      title: 'Team Meeting',
      description: 'Schedule with attendees',
      icon: <Users className="h-6 w-6" />,
      action: () => handleQuickAction('Schedule a team meeting for next Monday at 10am for 1 hour', onScheduleWithAttendees),
      gradient: 'from-accent via-secondary to-accent',
      hoverGlow: 'hover:shadow-[0_0_40px_rgba(236,72,153,0.4)]',
      badge: <Star className="h-4 w-4" />
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {quickActions.map((action, index) => (
        <button
          key={index}
          onClick={action.action}
          disabled={sendMessage.isPending}
          className={`group relative overflow-hidden rounded-xl p-6 transition-all duration-300 hover:scale-105 ${action.hoverGlow} glass border border-primary/20 hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          {/* Animated gradient background */}
          <div className={`absolute inset-0 bg-gradient-to-r ${action.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
          
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000">
            <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12" />
          </div>

          {/* Floating particles */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full opacity-20 group-hover:opacity-40 transition-opacity"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${20 + i * 10}%`,
                  animation: `float ${2 + i}s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </div>
          
          {/* Content */}
          <div className="relative z-10 flex flex-col items-center text-center space-y-3">
            {/* Icon with glow */}
            <div className="relative">
              <div className={`absolute inset-0 bg-gradient-to-r ${action.gradient} blur-xl opacity-50 group-hover:opacity-75 transition-opacity rounded-full`} />
              <div className="relative p-3 rounded-full bg-gradient-to-br from-card/50 to-card backdrop-blur-sm">
                <div className="text-foreground group-hover:scale-110 transition-transform">
                  {action.icon}
                </div>
              </div>
              
              {/* Badge */}
              <div className="absolute -top-1 -right-1 p-1.5 rounded-full bg-gradient-to-br from-accent to-primary text-white shadow-lg group-hover:scale-110 transition-transform">
                {action.badge}
              </div>
            </div>
            
            {/* Text */}
            <div>
              <h3 className="font-bold text-foreground font-['Orbitron'] text-lg group-hover:text-primary transition-colors">
                {action.title}
              </h3>
              <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors font-['Space_Mono'] mt-1">
                {action.description}
              </p>
            </div>

            {/* Action indicator */}
            <div className={`w-full h-1 bg-gradient-to-r ${action.gradient} rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`} />
          </div>
        </button>
      ))}
    </div>
  )
}
