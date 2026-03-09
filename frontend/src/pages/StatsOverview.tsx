import { useEffect, useState, memo, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Calendar,
  Clock,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  MessageSquare,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Settings,
  CalendarClock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import StatsCard from '../components/StatsCard';
import { useMeetings } from '../hooks/useMeetings';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../lib/api';
import LogoutMenu from '../components/LogoutMenu';
import LoadingSpinner from '../components/LoadingSpinner';
import AnimatedLogo from '../components/AnimatedLogo';
import type { Meeting } from '../types';

const formatMeetingTime = (start: string) => {
  const d = new Date(start);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return `Tomorrow, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const NavButton = memo(({
  path,
  label,
  icon: Icon,
  isActive,
  onClick,
}: {
  path: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick: (path: string) => void;
}) => (
  <button
    type="button"
    onClick={() => onClick(path)}
    className={`px-5 py-2.5 rounded-full text-sm font-medium smooth-transition flex items-center gap-2 ${isActive
      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/20'
      : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
  >
    <Icon className="h-4 w-4 shrink-0" />
    {label}
  </button>
));
NavButton.displayName = 'NavButton';

const NavigationBar = memo(({
  user,
  navigate,
  mobileMenuOpen,
  setMobileMenuOpen,
  setShowLogout,
  currentPath,
}: {
  user: { id: string; email: string; full_name?: string; timezone: string; provider: string } | null;
  navigate: (path: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  setShowLogout: (show: boolean) => void;
  currentPath: string;
}) => {
  const handleNav = useCallback((path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  }, [navigate, setMobileMenuOpen]);

  return (
    <nav className="relative z-50 border-b border-white/5 bg-[rgba(5,5,20,0.85)] backdrop-blur-xl animate-slide-in-bottom safe-area-top">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => handleNav('/dashboard')} className="flex items-center gap-2 sm:gap-3 smooth-transition hover:opacity-90 min-h-[44px] -ml-1">
            <AnimatedLogo className="h-8 w-8 sm:h-10 sm:w-10" />
            <span className="text-lg sm:text-xl font-bold gradient-text">ChronosAI</span>
          </button>

          <div className="hidden md:flex items-center gap-1.5 rounded-2xl bg-white/[0.03] p-1.5 border border-white/5">
            <NavButton path="/dashboard" label="Dashboard" icon={BarChart3} isActive={currentPath === '/dashboard'} onClick={handleNav} />
            <NavButton path="/chat" label="Chat" icon={MessageSquare} isActive={currentPath === '/chat'} onClick={handleNav} />
            <NavButton path="/availability" label="Availability" icon={Clock} isActive={currentPath === '/availability'} onClick={handleNav} />
            <NavButton path="/history" label="History" icon={Calendar} isActive={currentPath === '/history'} onClick={handleNav} />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-white">{user?.full_name || 'User'}</p>
              <p className="text-xs text-slate-400 truncate max-w-[160px]">{user?.email}</p>
            </div>
            <button type="button" onClick={() => setShowLogout(true)} className="hidden sm:flex w-10 h-10 rounded-xl bg-white/5 border border-white/10 items-center justify-center hover:bg-white/10 smooth-transition">
              <LogOut className="h-4 w-4 text-slate-400" />
            </button>
            <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 smooth-transition">
              {mobileMenuOpen ? <X className="h-5 w-5 text-slate-400" /> : <Menu className="h-5 w-5 text-slate-400" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 space-y-1.5 animate-fade-in">
            {[
              { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
              { path: '/chat', label: 'Chat', icon: MessageSquare },
              { path: '/availability', label: 'Availability', icon: Clock },
              { path: '/history', label: 'History', icon: Calendar },
            ].map(({ path, label, icon: Icon }) => (
              <button key={path} type="button" onClick={() => handleNav(path)} className={`w-full px-4 py-3.5 min-h-[48px] rounded-xl text-sm font-medium flex items-center gap-3 smooth-transition ${currentPath === path ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10 active:bg-white/10'}`}>
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
            <button type="button" onClick={() => { setShowLogout(true); setMobileMenuOpen(false); }} className="w-full px-4 py-3.5 min-h-[48px] rounded-xl bg-red-500/10 text-red-400 text-sm font-medium flex items-center gap-3 hover:bg-red-500/20 border border-red-500/20 smooth-transition">
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
  };
}) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
    <div className="animate-scale-in" style={{ animationDelay: '0.05s' }}>
      <StatsCard title="Total Meetings" value={stats.total} icon={<Calendar className="h-4 w-4" />} />
    </div>
    <div className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
      <StatsCard title="Scheduled" value={stats.scheduled} icon={<CheckCircle className="h-4 w-4" />} />
    </div>
    <div className="animate-scale-in" style={{ animationDelay: '0.15s' }}>
      <StatsCard title="Upcoming" value={stats.upcoming} icon={<Clock className="h-4 w-4" />} />
    </div>
    <div className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
      <StatsCard title="Canceled" value={stats.canceled} icon={<XCircle className="h-4 w-4" />} />
    </div>
  </div>
));
StatsGrid.displayName = 'StatsGrid';

const QuickActions = memo(({ navigate }: { navigate: (path: string) => void }) => {
  const actions = [
    { path: '/chat', label: 'AI Chat', description: 'Schedule with natural language', icon: MessageSquare, accent: 'from-blue-500 to-cyan-500' },
    { path: '/availability', label: 'Availability', description: 'Set your free slots', icon: CalendarClock, accent: 'from-violet-500 to-purple-600' },
    { path: '/history', label: 'History', description: 'View past meetings', icon: Calendar, accent: 'from-amber-500 to-orange-500' },
    { path: '/settings', label: 'Settings', description: 'Integrations & preferences', icon: Settings, accent: 'from-slate-500 to-slate-600' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {actions.map(({ path, label, description, icon: Icon, accent }, i) => (
        <button
          key={path}
          type="button"
          onClick={() => navigate(path)}
          className="group relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/10 p-4 sm:p-5 text-left smooth-transition hover:border-white/20 hover:bg-white/[0.06] hover:shadow-xl hover:shadow-blue-500/5 animate-scale-in focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 min-h-[100px] sm:min-h-0 active:scale-[0.98]"
          style={{ animationDelay: `${0.1 + i * 0.05}s` }}
        >
          <div className={`absolute top-0 right-0 w-20 h-20 rounded-full bg-gradient-to-br ${accent} opacity-10 group-hover:opacity-20 smooth-transition -translate-y-1/2 translate-x-1/2`} />
          <div className={`relative z-10 inline-flex p-2.5 rounded-xl bg-gradient-to-br ${accent} shadow-lg mb-3`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <h3 className="relative z-10 font-semibold text-white mb-0.5">{label}</h3>
          <p className="relative z-10 text-xs text-slate-400 mb-3">{description}</p>
          <span className="relative z-10 inline-flex items-center text-xs font-medium text-blue-400 group-hover:text-blue-300 smooth-transition">
            Open <ChevronRight className="h-3.5 w-3 ml-0.5" />
          </span>
        </button>
      ))}
    </div>
  );
});
QuickActions.displayName = 'QuickActions';

const UpcomingMeetings = memo(({ meetings, navigate }: { meetings: Meeting[]; navigate: (path: string) => void }) => {
  const upcoming = useMemo(() => {
    const now = new Date();
    return meetings
      .filter(m => m.status === 'scheduled' && new Date(m.start_time) > now)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 5);
  }, [meetings]);

  if (upcoming.length === 0) {
    return (
      <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            Upcoming meetings
          </h2>
          <button type="button" onClick={() => navigate('/chat')} className="text-sm font-medium text-blue-400 hover:text-blue-300 smooth-transition flex items-center gap-1">
            Schedule one <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
            <Sparkles className="h-7 w-7 text-blue-400" />
          </div>
          <p className="text-slate-400 text-sm mb-4">No upcoming meetings</p>
          <button type="button" onClick={() => navigate('/chat')} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium smooth-transition hover:opacity-90">
            Schedule with AI Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/10 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 sm:py-4 border-b border-white/5">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          Upcoming meetings
        </h2>
        <button type="button" onClick={() => navigate('/history')} className="text-sm font-medium text-blue-400 hover:text-blue-300 smooth-transition flex items-center gap-1">
          View all <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <ul className="divide-y divide-white/5">
        {upcoming.map((m) => (
          <li key={m.id}>
            <button type="button" onClick={() => navigate('/history')} className="w-full px-4 sm:px-5 py-3.5 sm:py-4 min-h-[56px] flex items-center gap-3 sm:gap-4 text-left smooth-transition hover:bg-white/[0.03] active:bg-white/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/30">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white truncate">{m.title}</p>
                <p className="text-xs text-slate-400">{formatMeetingTime(m.start_time)}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
});
UpcomingMeetings.displayName = 'UpcomingMeetings';

const TimeBreakdown = memo(({ stats }: {
  stats: { today: number; thisWeek: number; thisMonth: number };
}) => (
  <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 sm:p-5">
    <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
      <TrendingUp className="h-4 w-4 text-slate-400" />
      This period
    </h2>
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      <div className="rounded-xl bg-white/[0.04] border border-white/5 p-2.5 sm:p-3 text-center">
        <p className="text-2xl font-bold text-white">{stats.today}</p>
        <p className="text-xs text-slate-400 mt-0.5">Today</p>
      </div>
      <div className="rounded-xl bg-white/[0.04] border border-white/5 p-2.5 sm:p-3 text-center">
        <p className="text-2xl font-bold text-white">{stats.thisWeek}</p>
        <p className="text-xs text-slate-400 mt-0.5">This week</p>
      </div>
      <div className="rounded-xl bg-white/[0.04] border border-white/5 p-2.5 sm:p-3 text-center">
        <p className="text-2xl font-bold text-white">{stats.thisMonth}</p>
        <p className="text-xs text-slate-400 mt-0.5">This month</p>
      </div>
    </div>
  </div>
));
TimeBreakdown.displayName = 'TimeBreakdown';

export default function StatsOverview() {
  const navigate = useNavigate();
  const location = useLocation();
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
    const todayStr = now.toDateString();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return {
      total: meetings.length,
      scheduled: meetings.filter(m => m.status === 'scheduled').length,
      canceled: meetings.filter(m => m.status === 'canceled').length,
      cancelled: meetings.filter(m => m.status === 'canceled').length,
      completed: meetings.filter(m => m.status === 'scheduled' && new Date(m.start_time) < new Date()).length,
      today: meetings.filter(m => new Date(m.start_time).toDateString() === todayStr).length,
      thisWeek: meetings.filter(m => {
        const d = new Date(m.start_time);
        return d >= weekStart && d <= weekEnd;
      }).length,
      thisMonth: meetings.filter(m => {
        const d = new Date(m.start_time);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length,
      upcoming: meetings.filter(m => m.status === 'scheduled' && new Date(m.start_time) > new Date()).length,
      totalAttendees: meetings.reduce((sum, m) => sum + m.attendees.length, 0),
    };
  }, [meetings]);

  return (
    <div className="min-h-screen bg-[#030303] relative overflow-x-hidden">
      <div className="galaxy-bg opacity-90" />
      <div className="stars opacity-60">
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
        currentPath={location.pathname}
      />

      <main className="saas-main">
        <header className="mb-5 sm:mb-8 animate-fade-in">
          <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-white mb-0.5 sm:mb-1">
            {(() => {
              const tz = user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
              const hour = new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: tz }).replace(/\D/g, '');
              const h = parseInt(hour, 10);
              const greeting = h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
              const firstName = user?.full_name?.split(' ')[0] || 'User';
              return <>{greeting}, <span className="gradient-text">{firstName}</span> 👋</>;
            })()}
          </h1>
          <p className="text-slate-400 text-xs sm:text-base">Here’s your meeting overview and quick actions.</p>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[320px]">
            <LoadingSpinner size="lg" variant="gradient" text="Loading your dashboard..." />
          </div>
        ) : (
          <div className="space-y-5 sm:space-y-8">
            <section>
              <h2 className="text-xs sm:text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 sm:mb-4">Quick actions</h2>
              <QuickActions navigate={navigate} />
            </section>

            <section>
              <h2 className="text-xs sm:text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 sm:mb-4">Overview</h2>
              <StatsGrid stats={stats} />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              <section className="lg:col-span-2">
                <UpcomingMeetings meetings={meetings || []} navigate={navigate} />
              </section>
              <section>
                <TimeBreakdown stats={{ today: stats.today, thisWeek: stats.thisWeek, thisMonth: stats.thisMonth }} />
                <div className="mt-4 rounded-2xl bg-white/[0.03] border border-white/10 p-4 sm:p-5">
                  <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-slate-400" />
                    Attendees
                  </h2>
                  <p className="text-2xl font-bold text-white">{stats.totalAttendees}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Across all meetings</p>
                  {stats.total > 0 && (
                    <p className="text-sm text-slate-500 mt-2">~{(stats.totalAttendees / stats.total).toFixed(1)} per meeting</p>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      <LogoutMenu isOpen={showLogout} onClose={() => setShowLogout(false)} />
    </div>
  );
}
