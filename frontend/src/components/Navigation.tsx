import { useLocation, useNavigate } from 'react-router-dom'
import { Calendar, Home, Clock, Settings, User } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function Navigation() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: <Home className="h-4 w-4" />,
      current: location.pathname === '/dashboard'
    },
    {
      name: 'Availability',
      href: '/availability',
      icon: <Clock className="h-4 w-4" />,
      current: location.pathname === '/availability'
    },
    {
      name: 'Calendar',
      href: '/calendar',
      icon: <Calendar className="h-4 w-4" />,
      current: location.pathname === '/calendar'
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: <Settings className="h-4 w-4" />,
      current: location.pathname === '/settings'
    }
  ]

  return (
    <nav className="bg-card border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">
              Meeting Scheduler
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => navigate(item.href)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  item.current
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </button>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-foreground">
                {user?.full_name || user?.email}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.provider === 'google' ? 'Google Account' : 'Microsoft Account'}
              </p>
            </div>
            <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
