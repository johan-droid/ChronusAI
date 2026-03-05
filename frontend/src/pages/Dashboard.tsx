import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, LogOut, Plus, Search, Users, Clock, TrendingUp, History, Sparkles } from 'lucide-react';
import ChatWindow from '../components/ChatWindow';
import MeetingCard from '../components/MeetingCard';
import QuickActions from '../components/QuickActions';
import StatsCard from '../components/StatsCard';
import MeetingForm from '../components/MeetingForm';
import Button from '../components/Button';
import Input from '../components/Input';
import HealthStatus from '../components/HealthStatus';
import TimeGreeting from '../components/TimeGreeting';
import { useMeetings } from '../hooks/useMeetings';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../lib/api';
import ThemeToggle from '../components/ThemeToggle';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { data: meetings, isLoading: meetingsLoading } = useMeetings();
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const userData = await apiClient.getCurrentUser();
        useAuthStore.getState().setAuth(userData, token);
      } catch (error) {
        console.error('Auth check failed:', error);
        logout();
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate, logout]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    logout();
    navigate('/login');
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
    today: meetings?.filter(m => {
      const today = new Date().toDateString();
      const meetingDate = new Date(m.start_time).toDateString();
      return today === meetingDate;
    }).length || 0,
    thisWeek: meetings?.filter(m => {
      const now = new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const weekEnd = new Date(now.setDate(now.getDate() - now.getDay() + 6));
      const meetingDate = new Date(m.start_time);
      return meetingDate >= weekStart && meetingDate <= weekEnd;
    }).length || 0
  };

  return (
    <div className="h-screen bg-background flex relative overflow-hidden">
      {/* Health Status */}
      <HealthStatus />

      {/* Main Chat Area */}
      <div className="flex-[7] flex flex-col relative z-10">
        {/* Header */}
        <header className="border-b border-white/5 glass px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent blur-xl opacity-50 animate-pulse" />
                <Calendar className="h-8 w-8 text-primary relative z-10" />
              </div>
              <div>
                <h1 className="text-xl font-semibold gradient-text flex items-center gap-2">
                  ChronosAI
                  <Sparkles className="h-4 w-4 text-accent animate-pulse" />
                </h1>
                <TimeGreeting userName={user?.full_name} />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={() => navigate('/history')}>
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowMeetingForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New
              </Button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Quick Actions */}
        <div className="p-4 md:p-6 glass border-b border-white/5">
          <h2 className="text-sm font-semibold mb-4 text-muted-foreground">Quick Actions</h2>
          <QuickActions
            onQuickSchedule={() => setShowMeetingForm(true)}
            onCheckAvailability={() => console.log('Check availability')}
            onScheduleWithAttendees={() => setShowMeetingForm(true)}
          />
        </div>

        {/* Chat Window */}
        <div className="flex-1 overflow-hidden">
          <ChatWindow />
        </div>
      </div>

      {/* Sidebar */}
      <div className="flex-[3] border-l border-white/5 glass relative z-10">
        <div className="h-full flex flex-col">
          {/* Stats */}
          <div className="p-4 border-b border-white/5">
            <h2 className="font-semibold text-foreground mb-4 text-sm">Overview</h2>
            <div className="grid grid-cols-2 gap-3">
              <StatsCard title="Total" value={stats.total} icon={<Calendar className="h-4 w-4" />} />
              <StatsCard title="Today" value={stats.today} icon={<Clock className="h-4 w-4" />} />
              <StatsCard title="Week" value={stats.thisWeek} icon={<TrendingUp className="h-4 w-4" />} />
              <StatsCard title="Active" value={stats.scheduled} icon={<Users className="h-4 w-4" />} />
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-white/5 space-y-3">
            <Input
              placeholder="Search meetings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="h-4 w-4" />}
              className="glass border-white/5"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-2 border border-white/5 rounded-md glass text-sm"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>

          {/* Meetings */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-foreground text-sm">Upcoming</h2>
              <span className="text-xs text-muted-foreground">
                {meetingsLoading ? 'Loading...' : `${upcomingMeetings?.length || 0}`}
              </span>
            </div>
            
            {meetingsLoading ? (
              <div className="text-center text-muted-foreground py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
              </div>
            ) : upcomingMeetings && upcomingMeetings.length > 0 ? (
              upcomingMeetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8 glass rounded-lg p-6">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="text-sm">No upcoming meetings</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Meeting Form */}
      <MeetingForm
        isOpen={showMeetingForm}
        onClose={() => setShowMeetingForm(false)}
        onSubmit={(data) => {
          console.log('Meeting:', data);
          setShowMeetingForm(false);
        }}
      />
    </div>
  );
}
