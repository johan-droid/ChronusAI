import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, TrendingUp, Users, CheckCircle, XCircle, MessageSquare, BarChart3, LogOut, Menu, X } from 'lucide-react';
import StatsCard from '../components/StatsCard';
import { useMeetings } from '../hooks/useMeetings';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../lib/api';
import { useState } from 'react';
import LogoutMenu from '../components/LogoutMenu';

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
      } catch (error) {
        navigate('/login');
      }
    };
    checkAuth();
  }, [navigate]);

  const stats = {
    total: meetings?.length || 0,
    scheduled: meetings?.filter(m => m.status === 'scheduled').length || 0,
    canceled: meetings?.filter(m => m.status === 'canceled').length || 0,
    today: meetings?.filter(m => {
      const today = new Date().toDateString();
      return new Date(m.start_time).toDateString() === today;
    }).length || 0,
    thisWeek: meetings?.filter(m => {
      const now = new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const meetingDate = new Date(m.start_time);
      return meetingDate >= weekStart && meetingDate <= weekEnd;
    }).length || 0,
    thisMonth: meetings?.filter(m => {
      const now = new Date();
      const meetingDate = new Date(m.start_time);
      return meetingDate.getMonth() === now.getMonth() && meetingDate.getFullYear() === now.getFullYear();
    }).length || 0,
    upcoming: meetings?.filter(m => m.status === 'scheduled' && new Date(m.start_time) > new Date()).length || 0,
    totalAttendees: meetings?.reduce((sum, m) => sum + m.attendees.length, 0) || 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Subtle background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-grid-white/[0.02]" />
      
      {/* Top Navigation Bar */}
      <nav className="relative z-50 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">ChronosAI</span>
            </div>

            {/* Desktop Navigation Pills */}
            <div className="hidden md:flex items-center gap-2 bg-slate-900/50 rounded-full p-1.5 border border-white/5">
              <button onClick={() => navigate('/dashboard')} className="px-5 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium shadow-lg shadow-blue-500/20 transition-all">
                <BarChart3 className="h-4 w-4 inline mr-2" />
                Dashboard
              </button>
              <button onClick={() => navigate('/chat')} className="px-5 py-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/50 text-sm font-medium transition-all">
                <MessageSquare className="h-4 w-4 inline mr-2" />
                Chat
              </button>
              <button onClick={() => navigate('/availability')} className="px-5 py-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/50 text-sm font-medium transition-all">
                <Clock className="h-4 w-4 inline mr-2" />
                Availability
              </button>
              <button onClick={() => navigate('/history')} className="px-5 py-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/50 text-sm font-medium transition-all">
                <Calendar className="h-4 w-4 inline mr-2" />
                History
              </button>
            </div>

            {/* User Menu & Mobile Toggle */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-white">{user?.full_name || 'User'}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
              <button onClick={() => setShowLogout(true)} className="hidden sm:flex w-10 h-10 rounded-full bg-slate-800/50 border border-white/5 items-center justify-center hover:bg-slate-700/50 transition-all">
                <LogOut className="h-4 w-4 text-slate-400" />
              </button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden w-10 h-10 rounded-full bg-slate-800/50 border border-white/5 flex items-center justify-center hover:bg-slate-700/50 transition-all">
                {mobileMenuOpen ? <X className="h-5 w-5 text-slate-400" /> : <Menu className="h-5 w-5 text-slate-400" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-2 animate-fade-in">
              <button onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }} className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium flex items-center gap-3">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </button>
              <button onClick={() => { navigate('/chat'); setMobileMenuOpen(false); }} className="w-full px-4 py-3 rounded-xl bg-slate-800/50 text-slate-300 text-sm font-medium flex items-center gap-3 hover:bg-slate-700/50">
                <MessageSquare className="h-4 w-4" />
                Chat
              </button>
              <button onClick={() => { navigate('/availability'); setMobileMenuOpen(false); }} className="w-full px-4 py-3 rounded-xl bg-slate-800/50 text-slate-300 text-sm font-medium flex items-center gap-3 hover:bg-slate-700/50">
                <Clock className="h-4 w-4" />
                Availability
              </button>
              <button onClick={() => { navigate('/history'); setMobileMenuOpen(false); }} className="w-full px-4 py-3 rounded-xl bg-slate-800/50 text-slate-300 text-sm font-medium flex items-center gap-3 hover:bg-slate-700/50">
                <Calendar className="h-4 w-4" />
                History
              </button>
              <button onClick={() => { setShowLogout(true); setMobileMenuOpen(false); }} className="w-full px-4 py-3 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium flex items-center gap-3 hover:bg-red-500/20 border border-red-500/20">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Welcome Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
            Welcome back, <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">{user?.full_name?.split(' ')[0] || 'User'}</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">Here's your meeting overview</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
              <StatsCard title="Total Meetings" value={stats.total} icon={<Calendar className="h-4 w-4" />} />
              <StatsCard title="Scheduled" value={stats.scheduled} icon={<CheckCircle className="h-4 w-4" />} />
              <StatsCard title="Upcoming" value={stats.upcoming} icon={<Clock className="h-4 w-4" />} />
              <StatsCard title="Canceled" value={stats.canceled} icon={<XCircle className="h-4 w-4" />} />
            </div>

            {/* Time-based Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
              <StatsCard title="Today" value={stats.today} icon={<Clock className="h-4 w-4" />} description="Meetings scheduled for today" />
              <StatsCard title="This Week" value={stats.thisWeek} icon={<Calendar className="h-4 w-4" />} description="Meetings this week" />
              <StatsCard title="This Month" value={stats.thisMonth} icon={<TrendingUp className="h-4 w-4" />} description="Meetings this month" />
            </div>

            {/* Engagement Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 animate-slide-in-left" style={{ animationDelay: '0.3s' }}>
              <StatsCard title="Total Attendees" value={stats.totalAttendees} icon={<Users className="h-4 w-4" />} description="Across all meetings" />
              <StatsCard title="Avg. Attendees" value={stats.total > 0 ? (stats.totalAttendees / stats.total).toFixed(1) : 0} icon={<Users className="h-4 w-4" />} description="Per meeting" />
            </div>
          </div>
        )}
      </main>

      <LogoutMenu isOpen={showLogout} onClose={() => setShowLogout(false)} />
    </div>
  );
}
