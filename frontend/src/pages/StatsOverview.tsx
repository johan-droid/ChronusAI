import { useEffect, useState, memo, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  TrendingUp,
  Users,
  CheckCircle,
  MessageSquare,
  ChevronRight,
  Settings,
  CalendarClock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import NavigationBar from '../components/NavigationBar';
import StatsCard from '../components/StatsCard';
import { useMeetings } from '../hooks/useMeetings';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../lib/api';
import LogoutMenu from '../components/LogoutMenu';
import LoadingSpinner from '../components/LoadingSpinner';
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
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
    <div className="animate-scale-in" style={{ animationDelay: '0.05s' }}>
      <StatsCard title="Total" value={stats.total} icon={<Calendar className="h-4 w-4" />} />
    </div>
    <div className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
      <StatsCard title="Scheduled" value={stats.scheduled} icon={<CheckCircle className="h-4 w-4" />} />
    </div>
    <div className="animate-scale-in" style={{ animationDelay: '0.15s' }}>
      <StatsCard title="Upcoming" value={stats.upcoming} icon={<Clock className="h-4 w-4" />} />
    </div>
  </div>
));
StatsGrid.displayName = 'StatsGrid';

const QuickActions = memo(({ navigate }: { navigate: (path: string) => void }) => {
  const actions = [
    { path: '/chat', label: 'AI Chat', description: 'Schedule with AI', icon: MessageSquare, accent: 'from-blue-500 to-cyan-500' },
    { path: '/availability', label: 'Availability', description: 'View slots', icon: CalendarClock, accent: 'from-violet-500 to-purple-600' },
    { path: '/history', label: 'History', description: 'Past meetings', icon: Calendar, accent: 'from-amber-500 to-orange-500' },
    { path: '/settings', label: 'Settings', description: 'Preferences', icon: Settings, accent: 'from-slate-500 to-slate-600' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {actions.map(({ path, label, description, icon: Icon, accent }, i) => (
        <button
          key={path}
          type="button"
          onClick={() => navigate(path)}
          className="group relative overflow-hidden rounded-xl bg-white/[0.02] border border-white/10 p-4 text-left transition-all hover:border-white/20 hover:bg-white/[0.05] hover:shadow-sm animate-scale-in focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 min-h-[80px] active:scale-[0.98] backdrop-blur-md touch-manipulation"
          style={{ animationDelay: `${0.1 + i * 0.05}s` }}
        >
          <div className={`absolute top-0 right-0 w-8 h-8 rounded-full bg-gradient-to-br ${accent} opacity-10 group-hover:opacity-20 transition-all -translate-y-1/2 translate-x-1/2`} />
          <div className="flex items-center gap-3 mb-2">
            <div className={`relative z-10 inline-flex p-2 rounded-lg bg-gradient-to-br ${accent} shadow-sm`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <h3 className="relative z-10 font-semibold text-white text-sm tracking-tight leading-none">{label}</h3>
          </div>
          <p className="relative z-10 text-xs text-zinc-400 font-medium mb-2 line-clamp-1 hidden sm:block">{description}</p>
          <span className="relative z-10 inline-flex items-center text-xs font-medium text-blue-400 group-hover:text-blue-300 transition-all">
            Open <ChevronRight className="h-3 w-3 ml-1" />
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
      <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-400" />
            Upcoming meetings
          </h2>
          <button type="button" onClick={() => navigate('/chat')} className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-all flex items-center gap-1">
            Schedule one <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
            <Sparkles className="h-6 w-6 text-blue-400" />
          </div>
          <p className="text-zinc-400 text-sm mb-4">No upcoming meetings</p>
          <button type="button" onClick={() => navigate('/chat')} className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium transition-all hover:opacity-90">
            Schedule with AI Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Clock className="h-4 w-4 text-slate-400" />
          Upcoming meetings
        </h2>
        <button type="button" onClick={() => navigate('/history')} className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-all flex items-center gap-1">
          View all <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <ul className="divide-y divide-white/5">
        {upcoming.map((m) => (
          <li key={m.id}>
            <button type="button" onClick={() => navigate('/history')} className="w-full px-5 py-4 flex items-center gap-4 text-left transition-all hover:bg-white/[0.03] active:bg-white/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/30">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-white truncate">{m.title}</p>
                <p className="text-xs text-zinc-400">{formatMeetingTime(m.start_time)}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-500 shrink-0" />
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
  <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
    <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
      <TrendingUp className="h-4 w-4 text-slate-400" />
      This period
    </h2>
    <div className="grid grid-cols-3 gap-4">
      <div className="bg-white/[0.04] border border-white/5 p-3 text-center">
        <p className="text-2xl md:text-3xl font-semibold text-zinc-50">{stats.today}</p>
        <p className="text-xs text-zinc-400 mt-1">Today</p>
      </div>
      <div className="bg-white/[0.04] border border-white/5 p-3 text-center">
        <p className="text-2xl md:text-3xl font-semibold text-zinc-50">{stats.thisWeek}</p>
        <p className="text-xs text-zinc-400 mt-1">This week</p>
      </div>
      <div className="bg-white/[0.04] border border-white/5 p-3 text-center">
        <p className="text-2xl md:text-3xl font-semibold text-zinc-50">{stats.thisMonth}</p>
        <p className="text-xs text-zinc-400 mt-1">This month</p>
      </div>
    </div>
  </div>
));
TimeBreakdown.displayName = 'TimeBreakdown';

/* ── Greeting subtitles per time-of-day ── */
const GREETING_SUBTITLES: Record<string, string[]> = {
  morning: [
    "Rise and shine — let's plan your day!",
    "A fresh start awaits. What's on the agenda?",
    "Good vibes and clear calendars ahead."
  ],
  afternoon: [
    "Halfway through — let's stay on track!",
    "Afternoon hustle. Need to reschedule anything?",
    "Keep the momentum going!"
  ],
  evening: [
    "Winding down — let's review tomorrow.",
    "Great work today! Any last meetings to set?",
    "Evening check-in — all caught up?"
  ],
  night: [
    "Rest up — tomorrow's agenda is ready.",
    "Night mode on. See you bright and early!",
    "Sweet dreams. Your calendar's in good hands."
  ],
};

function getTimePeriod(hour: number): string {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

function getGreetingWord(period: string): string {
  const map: Record<string, string> = { morning: 'Good Morning', afternoon: 'Good Afternoon', evening: 'Good Evening', night: 'Good Night' };
  return map[period] || 'Hello';
}

/* ── Typewriter hook ── */
function useTypewriter(text: string, speed = 38) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    if (!text) return;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        setDone(true);
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return { displayed, done };
}

export default function StatsOverview() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: meetings, isLoading } = useMeetings();
  const [showLogout, setShowLogout] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Pure client-side greeting — no API call, no token cost
  const getLocalHour = useCallback(() => {
    const tz = user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false });
    return parseInt(formatter.format(new Date()), 10);
  }, [user]);

  const hour = getLocalHour();
  const period = getTimePeriod(hour);
  const greetingWord = getGreetingWord(period);
  const firstName = user?.full_name?.split(' ')[0] || 'User';

  // Pick a deterministic subtitle based on the day-of-year so it feels fresh daily
  const subtitleIndex = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
    const subs = GREETING_SUBTITLES[period];
    return dayOfYear % subs.length;
  }, [period]);
  const subtitle = GREETING_SUBTITLES[period][subtitleIndex];
  const { displayed: typedText, done: typingDone } = useTypewriter(subtitle, 35);

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
    <div key="dashboard-v5" className="min-h-screen bg-[#09090B] relative overflow-x-hidden">
      <NavigationBar
        user={user}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        setShowLogout={setShowLogout}
      />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto pb-12">
        <header className="mb-8 animate-fade-in relative">
          <div className="bg-white/[0.02] border border-white/10 backdrop-blur-md p-6 sm:p-8 rounded-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10 space-y-3">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.1]">
                {greetingWord}, <span className="text-blue-400">{firstName}</span> 👋
              </h1>

              <div className="flex items-center gap-2">
                <p className="text-slate-300 text-sm sm:text-base" style={{ fontFamily: "'Sacramento', cursive", fontSize: '1.25rem' }}>
                  {typedText}
                  {!typingDone && <span className="typewriter-cursor" />}
                </p>
              </div>
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[320px]">
            <LoadingSpinner size="lg" variant="gradient" text="Loading your dashboard..." />
          </div>
        ) : (
          <div className="space-y-8">
            <section>
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                <StatsGrid stats={stats} />
              </div>
            </section>

            <section>
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Quick actions</h2>
              <QuickActions navigate={navigate} />
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <section className="xl:col-span-2">
                <UpcomingMeetings meetings={meetings || []} navigate={navigate} />
              </section>
              <section className="space-y-6">
                <TimeBreakdown stats={{ today: stats.today, thisWeek: stats.thisWeek, thisMonth: stats.thisMonth }} />
                <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5">
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4 text-slate-400" />
                    Attendees
                  </h2>
                  <p className="text-2xl md:text-3xl font-semibold text-zinc-50">{stats.totalAttendees}</p>
                  <p className="text-xs text-zinc-400 mt-1">Across all meetings</p>
                  {stats.total > 0 && (
                    <p className="text-sm text-zinc-500 mt-2">~{(stats.totalAttendees / stats.total).toFixed(1)} per meeting</p>
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
