import { useState, memo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  Home, 
  Clock, 
  History, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Sparkles,
  User,
  MessageSquare
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import Button from './Button';
import ThemeToggle from './ThemeToggle';
import AnimatedLogo from './AnimatedLogo';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    path: '/dashboard'
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: MessageSquare,
    path: '/chat'
  },
  {
    id: 'availability',
    label: 'Availability',
    icon: Clock,
    path: '/availability'
  },
  {
    id: 'history',
    label: 'History',
    icon: History,
    path: '/history'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    path: '/settings'
  }
];

// Memoized Logo Component
const Logo = memo(() => (
  <div className="flex items-center flex-shrink-0 px-4 mb-8">
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent blur-xl opacity-50 animate-pulse" />
      <AnimatedLogo className="h-8 w-8 text-primary relative z-10" />
    </div>
    <div className="ml-3">
      <h1 className="text-xl font-bold gradient-text flex items-center gap-2">
        ChronosAI
        <Sparkles className="h-4 w-4 text-accent animate-bounce-gentle" />
      </h1>
    </div>
  </div>
));

Logo.displayName = 'Logo';

// Memoized User Info Component
const UserInfo = memo(({ user }: { user: any }) => (
  <div className="px-4 mb-6">
    <div className="glass-card rounded-lg p-3 smooth-transition hover-lift">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-glow-pulse">
            <User className="h-5 w-5 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {user?.full_name || 'User'}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {user?.email || 'user@example.com'}
          </p>
        </div>
      </div>
    </div>
  </div>
));

UserInfo.displayName = 'UserInfo';

// Memoized Nav Item Component
const NavItem = memo(({ item, isActive, onClick }: { 
  item: NavItem; 
  isActive: boolean; 
  onClick: () => void; 
}) => {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={`w-full group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg smooth-transition nav-item ${
        isActive
          ? 'bg-primary/10 text-primary border border-primary/20 animate-slide-right'
          : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
      }`}
    >
      <Icon className="mr-3 h-5 w-5 flex-shrink-0 smooth-transition" />
      <span className="flex-1 text-left">{item.label}</span>
      {item.badge && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary animate-scale-in">
          {item.badge}
        </span>
      )}
    </button>
  );
});

NavItem.displayName = 'NavItem';

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleNavigation = useCallback((path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  }, [navigate]);

  const handleLogout = useCallback(() => {
    logout();
    window.location.href = '/login';
  }, [logout]);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 glass-nav border-r border-white/5 z-40 animate-slide-right">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          <Logo />
          <UserInfo user={user} />

          {/* Navigation */}
          <nav className="flex-1 px-2 space-y-1">
            {navItems.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                isActive={isActive(item.path)}
                onClick={() => handleNavigation(item.path)}
              />
            ))}
          </nav>

          {/* Bottom Actions */}
          <div className="flex-shrink-0 px-2 py-4 space-y-2 border-t border-white/5 mt-4">
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start smooth-transition hover-lift"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 animate-slide-down">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 smooth-transition"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
            <div className="ml-3 flex items-center">
              <AnimatedLogo className="h-6 w-6 text-primary animate-bounce-gentle" />
              <span className="ml-2 text-lg font-semibold gradient-text">ChronosAI</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 glass transform transition-transform duration-300 ease-bounce-gentle animate-slide-right">
            <div className="flex flex-col h-full">
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <div className="flex items-center">
                  <AnimatedLogo className="h-6 w-6 text-primary" />
                  <span className="ml-2 text-lg font-semibold gradient-text">ChronosAI</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 smooth-transition"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Mobile User Info */}
              <div className="p-4 border-b border-white/5">
                <UserInfo user={user} />
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                  <NavItem
                    key={item.id}
                    item={item}
                    isActive={isActive(item.path)}
                    onClick={() => handleNavigation(item.path)}
                  />
                ))}
              </nav>

              {/* Mobile Bottom Actions */}
              <div className="flex-shrink-0 px-2 py-4 space-y-2 border-t border-white/5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full justify-start smooth-transition hover-lift"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
