import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, Search, Users, Clock, TrendingUp, Activity } from 'lucide-react';
import { Calendar as UICalendar } from '../components/ui/calendar';
import ChatWindow from '../components/ChatWindow';
import MeetingCard from '../components/MeetingCard';
import QuickActions from '../components/QuickActions';
import CompactStatsCard from '../components/CompactStatsCard';
import MeetingForm from '../components/MeetingForm';
import Button from '../components/Button';
import Input from '../components/Input';
import HealthStatus from '../components/HealthStatus';
import AIGreeting from '../components/AIGreeting';
import CacheCleaner from '../components/CacheCleaner';
import Layout from '../components/Layout';
import { useMeetings } from '../hooks/useMeetings';
import { useAuthStore } from '../store/authStore';
import { useNavigationGuard } from '../hooks/useNavigationGuard';
import { apiClient } from '../lib/api';
import { clearAuthCache } from '../lib/cache';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { data: meetings, isLoading: meetingsLoading } = useMeetings();
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Use navigation guard to prevent back navigation issues
  useNavigationGuard();

  useEffect(() => {
    const checkAuth = async () => {
      const { accessToken, isAuthenticated } = useAuthStore.getState();

      if (!accessToken || !isAuthenticated) {
        navigate('/login');
        return;
      }

      try {
        const userData = await apiClient.getCurrentUser();
        useAuthStore.getState().setAuth(userData, accessToken, useAuthStore.getState().refreshToken || '');
      } catch (error) {
        console.error('Auth check failed:', error);
        handleLogout();
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthCache();
      logout();
      navigate('/login');
    }
  };

  const filteredMeetings = meetings?.filter(meeting => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meeting.attendees.some((a: any) => a.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = filterStatus === 'all' || meeting.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const upcomingMeetings = filteredMeetings?.filter(meeting =>
    meeting.status === 'scheduled' &&
    new Date(meeting.start_time) > new Date()
  ).sort((a, b) =>
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  ).slice(0, 10);

  const stats = {
    total: meetings?.length || 0,
    scheduled: meetings?.filter(m => m.status === 'scheduled').length || 0,
    upcoming: meetings?.filter(m => m.status === 'scheduled' && new Date(m.start_time) > new Date()).length || 0,
    canceled: meetings?.filter(m => m.status === 'canceled').length || 0,
    today: meetings?.filter(m => {
      const today = new Date().toDateString();
      const meetingDate = new Date(m.start_time).toDateString();
      return today === meetingDate && m.status === 'scheduled';
    }).length || 0,
    thisWeek: meetings?.filter(m => {
      const now = new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
      const meetingDate = new Date(m.start_time);
      return meetingDate >= weekStart && meetingDate <= weekEnd && m.status === 'scheduled';
    }).length || 0,
    thisMonth: meetings?.filter(m => {
      const now = new Date();
      const meetingDate = new Date(m.start_time);
      return meetingDate.getMonth() === now.getMonth() && 
             meetingDate.getFullYear() === now.getFullYear() &&
             m.status === 'scheduled';
    }).length || 0,
    totalAttendees: meetings?.reduce((sum, m) => sum + (m.attendees?.length || 0), 0) || 0,
    avgAttendees: meetings?.length ? Math.round((meetings.reduce((sum, m) => sum + (m.attendees?.length || 0), 0) / meetings.length) * 10) / 10 : 0
  };

  return (
    <Layout>
      <div className="h-screen flex flex-col relative overflow-hidden mobile-safe-area">
        {/* Enhanced Deep Galaxy Background */}
        <div className="stars" />
        <div className="space-particles" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Enhanced floating orbs with deeper colors */}
          <div className="absolute w-40 h-40 bg-gradient-to-r from-orange-500/15 to-red-500/10 rounded-full blur-2xl animate-float" style={{ top: '8%', left: '3%', animationDelay: '0s' }} />
          <div className="absolute w-32 h-32 bg-gradient-to-r from-purple-500/12 to-pink-500/8 rounded-full blur-2xl animate-float" style={{ top: '65%', right: '8%', animationDelay: '4s' }} />
          <div className="absolute w-28 h-28 bg-gradient-to-r from-pink-500/10 to-orange-500/8 rounded-full blur-2xl animate-float" style={{ top: '35%', left: '75%', animationDelay: '8s' }} />

          {/* Enhanced shooting stars */}
          <div className="absolute w-2 h-2 bg-gradient-to-r from-orange-400 to-transparent rounded-full" style={{ top: '15%', left: '5%', animation: 'shooting-star 12s infinite', animationDelay: '2s' }} />
          <div className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-transparent rounded-full" style={{ top: '55%', left: '65%', animation: 'shooting-star 16s infinite', animationDelay: '6s' }} />
          <div className="absolute w-2 h-2 bg-gradient-to-r from-pink-400 to-transparent rounded-full" style={{ top: '25%', left: '85%', animation: 'shooting-star 14s infinite', animationDelay: '10s' }} />
        </div>

        {/* Health Status */}
        <HealthStatus />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col lg:flex-row relative z-10">
          {/* Chat Section */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Page Header */}
            <header className="glass border-b border-white/5 px-3 sm:px-6 py-3">
              <div className="flex items-center justify-between gap-3">
                <AIGreeting userName={user?.full_name} />
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowMeetingForm(true)} className="shrink-0">
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">New</span>
                  </Button>
                  <CacheCleaner />
                </div>
              </div>
            </header>

            {/* Quick Actions */}
            <div className="p-3 sm:p-4 glass border-b border-white/5">
              <h2 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Quick Actions</h2>
              <QuickActions />
            </div>

            {/* Chat Window */}
            <div className="flex-1 min-h-0">
              <ChatWindow />
            </div>
          </div>

          {/* Sidebar - Stats & Meetings */}
          <div className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-white/5 glass">
            <div className="h-full flex flex-col">
              {/* Stats Section */}
              <div className="p-3 sm:p-4 border-b border-white/5">
                <h2 className="font-semibold text-foreground text-xs uppercase tracking-wide flex items-center gap-2 mb-3">
                  <Activity className="h-3.5 w-3.5" />
                  Meeting Overview
                </h2>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <CompactStatsCard title="Total" value={stats.total} icon={<Calendar className="h-3.5 w-3.5" />} />
                  <CompactStatsCard title="Scheduled" value={stats.scheduled} icon={<Clock className="h-3.5 w-3.5" />} />
                  <CompactStatsCard title="Upcoming" value={stats.upcoming} icon={<TrendingUp className="h-3.5 w-3.5" />} />
                  <CompactStatsCard title="Canceled" value={stats.canceled} icon={<Users className="h-3.5 w-3.5" />} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <CompactStatsCard title="Today" value={stats.today} icon={<Clock className="h-3 w-3" />} />
                  <CompactStatsCard title="Week" value={stats.thisWeek} icon={<Calendar className="h-3 w-3" />} />
                  <CompactStatsCard title="Month" value={stats.thisMonth} icon={<TrendingUp className="h-3 w-3" />} />
                </div>
              </div>

              {/* Calendar */}
              <div className="p-3 sm:p-4 border-b border-white/5">
                <h2 className="font-semibold text-foreground text-xs uppercase tracking-wide flex items-center gap-2 mb-2">
                  <Calendar className="h-3.5 w-3.5" />
                  Calendar
                </h2>
                <UICalendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-lg border border-white/5 glass w-full flex justify-center scale-90"
                />
              </div>

              {/* Search and Filter */}
              <div className="p-3 sm:p-4 border-b border-white/5 space-y-2">
                <Input
                  placeholder="Search meetings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<Search className="h-3.5 w-3.5" />}
                  className="glass border-white/5 text-xs h-9"
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full p-2 border border-white/5 rounded-lg glass text-xs bg-background/50 h-9"
                >
                  <option value="all">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="canceled">Canceled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Meetings List */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-foreground text-xs">Upcoming Meetings</h3>
                  <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-0.5 rounded-full">
                    {upcomingMeetings?.length || 0}
                  </span>
                </div>

                {meetingsLoading ? (
                  <div className="text-center text-muted-foreground py-8">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                    <p className="text-xs mt-2">Loading meetings...</p>
                  </div>
                ) : upcomingMeetings && upcomingMeetings.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingMeetings.map((meeting) => (
                      <MeetingCard key={meeting.id} meeting={meeting} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8 glass-card rounded-lg p-6">
                    <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No upcoming meetings</p>
                    <p className="text-xs mt-1">Schedule your first meeting to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Meeting Form Modal */}
        <MeetingForm
          isOpen={showMeetingForm}
          onClose={() => setShowMeetingForm(false)}
          onSubmit={(data) => {
            console.log('Meeting:', data);
            setShowMeetingForm(false);
          }}
        />
      </div>
    </Layout>
  );
}
