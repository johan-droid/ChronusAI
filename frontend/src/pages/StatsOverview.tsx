import { useEffect, useState, memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, TrendingUp, Users, CheckCircle, XCircle, MessageSquare, BarChart3, LogOut, Menu, X } from 'lucide-react';
import StatsCard from '../components/StatsCard';
import { useMeetings } from '../hooks/useMeetings';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../lib/api';
import LogoutMenu from '../components/LogoutMenu';
import LoadingSpinner from '../components/LoadingSpinner';
import AnimatedLogo from '../components/AnimatedLogo';

// Memoized Navigation Component
const NavigationBar = memo(({
  user,
  navigate,
  mobileMenuOpen,
  setMobileMenuOpen,
  setShowLogout
}: {
  user: {
    id: string;
    email: string;
    full_name?: string;
    timezone: string;
    provider: string;
  } | null;
  navigate: (path: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  setShowLogout: (show: boolean) => void;
}) => {
  const handleNavigation = useCallback((path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  }, [navigate, setMobileMenuOpen]);

  const handleLogout = useCallback(() => {
    setShowLogout(true);
    setMobileMenuOpen(false);
  }, [setShowLogout, setMobileMenuOpen]);

  return (
    <nav className="relative z-50 border-b border-white/5 glass animate-slide-down">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 animate-slide-right">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 animate-glow-pulse">
              <AnimatedLogo className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">ChronosAI</span>
          </div>

          {/* Desktop Navigation Pills */}
          <div className="hidden md:flex items-center gap-2 glass-card rounded-full p-1.5 animate-slide-down" style={{ animationDelay: '0.1s' }}>
            <button onClick={() => handleNavigation('/dashboard')} className="px-5 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium shadow-lg shadow-blue-500/20 smooth-transition">
              <BarChart3 className="h-4 w-4 inline mr-2" />
              Dashboard
            </button>
            <button onClick={() => handleNavigation('/chat')} className="px-5 py-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/50 text-sm font-medium smooth-transition">
              <MessageSquare className="h-4 w-4 inline mr-2" />
              Chat
            </button>
            <button onClick={() => handleNavigation('/availability')} className="px-5 py-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/50 text-sm font-medium smooth-transition">
              <Clock className="h-4 w-4 inline mr-2" />
              Availability
            </button>
            <button onClick={() => handleNavigation('/history')} className="px-5 py-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/50 text-sm font-medium smooth-transition">
              <Calendar className="h-4 w-4 inline mr-2" />
              History
            </button>
          </div>

          {/* User Menu & Mobile Toggle */}
          <div className="flex items-center gap-3 animate-slide-left">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-white">{user?.full_name || 'User'}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
            <button onClick={() => setShowLogout(true)} className="hidden sm:flex w-10 h-10 rounded-full glass-card items-center justify-center hover:bg-slate-700/50 smooth-transition hover-lift">
              <LogOut className="h-4 w-4 text-slate-400" />
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden w-10 h-10 rounded-full glass-card flex items-center justify-center hover:bg-slate-700/50 smooth-transition hover-lift">
              {mobileMenuOpen ? <X className="h-5 w-5 text-slate-400" /> : <Menu className="h-5 w-5 text-slate-400" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-2 animate-slide-down">
            <button onClick={() => handleNavigation('/dashboard')} className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium flex items-center gap-3 smooth-transition">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </button>
            <button onClick={() => handleNavigation('/chat')} className="w-full px-4 py-3 rounded-xl glass-card text-slate-300 text-sm font-medium flex items-center gap-3 hover:bg-slate-700/50 smooth-transition">
              <MessageSquare className="h-4 w-4" />
              Chat
            </button>
            <button onClick={() => handleNavigation('/availability')} className="w-full px-4 py-3 rounded-xl glass-card text-slate-300 text-sm font-medium flex items-center gap-3 hover:bg-slate-700/50 smooth-transition">
              <Clock className="h-4 w-4" />
              Availability
            </button>
            <button onClick={() => handleNavigation('/history')} className="w-full px-4 py-3 rounded-xl glass-card text-slate-300 text-sm font-medium flex items-center gap-3 hover:bg-slate-700/50 smooth-transition">
              <Calendar className="h-4 w-4" />
              History
            </button>
            <button onClick={handleLogout} className="w-full px-4 py-3 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium flex items-center gap-3 hover:bg-red-500/20 border border-red-500/20 smooth-transition">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
});

NavigationBar.displayName = 'NavigationBar';

// Memoized Stats Grid Component
const StatsGrid = memo(({ stats }: { 
  stats: {
    total: number;
    scheduled: number;
    canceled: number;
    cancelled: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    upcoming: number;
    completed: number;
    totalAttendees: number;
  }
}) => (
  <div className="space-y-6">
    {/* Overview Stats */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
      <div className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
        <StatsCard title="Total Meetings" value={stats.total} icon={<Calendar className="h-4 w-4" />} />
      </div>
      <div className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
        <StatsCard title="Scheduled" value={stats.scheduled} icon={<CheckCircle className="h-4 w-4" />} />
      </div>
      <div className="animate-scale-in" style={{ animationDelay: '0.3s' }}>
        <StatsCard title="Upcoming" value={stats.upcoming} icon={<Clock className="h-4 w-4" />} />
      </div>
      <div className="animate-scale-in" style={{ animationDelay: '0.4s' }}>
        <StatsCard title="Canceled" value={stats.canceled} icon={<XCircle className="h-4 w-4" />} />
      </div>
    </div>

    {/* Time-based Analytics */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
      <div className="animate-scale-in" style={{ animationDelay: '0.5s' }}>
        <StatsCard title="Today" value={stats.today} icon={<Clock className="h-4 w-4" />} description="Meetings scheduled for today" />
      </div>
      <div className="animate-scale-in" style={{ animationDelay: '0.6s' }}>
        <StatsCard title="This Week" value={stats.thisWeek} icon={<Calendar className="h-4 w-4" />} description="Meetings this week" />
      </div>
      <div className="animate-scale-in" style={{ animationDelay: '0.7s' }}>
        <StatsCard title="This Month" value={stats.thisMonth} icon={<TrendingUp className="h-4 w-4" />} description="Meetings this month" />
      </div>
    </div>

    {/* Engagement Metrics */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
      <div className="animate-scale-in" style={{ animationDelay: '0.8s' }}>
        <StatsCard title="Total Attendees" value={stats.totalAttendees} icon={<Users className="h-4 w-4" />} description="Across all meetings" />
      </div>
      <div className="animate-scale-in" style={{ animationDelay: '0.9s' }}>
        <StatsCard title="Avg. Attendees" value={stats.total > 0 ? (stats.totalAttendees / stats.total).toFixed(1) : 0} icon={<Users className="h-4 w-4" />} description="Per meeting" />
      </div>
    </div>
  </div>
));

StatsGrid.displayName = 'StatsGrid';

export default function StatsOverview() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: meetings, isLoading } = useMeetings();
  const [showLogout, setShowLogout] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { accessToken, isAuthenticated } = useAuthStore.getState();
      if (!accessToken || !isAuthenticated) {
        navigate('/login');
        return;
      }
      try {
        await apiClient.getCurrentUser();
      } catch {
        navigate('/login');
      }
    };
    checkAuth();
  }, [navigate]);

  const stats = useMemo(() => {
    if (!meetings) return {
      total: 0,
      scheduled: 0,
      canceled: 0,
      cancelled: 0,
      completed: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      upcoming: 0,
      totalAttendees: 0,
    };

    const now = new Date();
    const today = now.toDateString();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return {
      total: meetings.length,
      scheduled: meetings.filter(m => m.status === 'scheduled').length,
      canceled: meetings.filter(m => m.status === 'canceled').length,
      cancelled: meetings.filter(m => m.status === 'canceled').length,
      completed: meetings.filter(m => m.status === 'scheduled' && new Date(m.start_time) < new Date()).length,
      today: meetings.filter(m => new Date(m.start_time).toDateString() === today).length,
      thisWeek: meetings.filter(m => {
        const meetingDate = new Date(m.start_time);
        return meetingDate >= weekStart && meetingDate <= weekEnd;
      }).length,
      thisMonth: meetings.filter(m => {
        const meetingDate = new Date(m.start_time);
        return meetingDate.getMonth() === now.getMonth() && meetingDate.getFullYear() === now.getFullYear();
      }).length,
      upcoming: meetings.filter(m => m.status === 'scheduled' && new Date(m.start_time) > new Date()).length,
      totalAttendees: meetings.reduce((sum, m) => sum + m.attendees.length, 0),
    };
  }, [meetings]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Optimized background effects */}
      <div className="galaxy-bg" />
      <div className="stars">
        <div className="star" />
        <div className="star" />
        <div className="star" />
      </div>

      <NavigationBar
        user={user}
        navigate={navigate}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        setShowLogout={setShowLogout}
      />

      {/* Main Content */}
      <main className="saas-main">
        {/* Welcome Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
            Welcome back, <span className="gradient-text">{user?.full_name?.split(' ')[0] || 'User'}</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">Here's your meeting overview</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" variant="gradient" text="Loading your dashboard..." />
          </div>
        ) : (
          <StatsGrid stats={stats} />
        )}
      </main>

      <LogoutMenu isOpen={showLogout} onClose={() => setShowLogout(false)} />
    </div>
  );
}
