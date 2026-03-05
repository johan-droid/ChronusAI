import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, LogOut, Plus, Search, Users, Clock, TrendingUp, History } from 'lucide-react';
import ChatWindow from '../components/ChatWindow';
import MeetingCard from '../components/MeetingCard';
import QuickActions from '../components/QuickActions';
import StatsCard from '../components/StatsCard';
import MeetingForm from '../components/MeetingForm';
import Button from '../components/Button';
import Input from '../components/Input';
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

  const handleQuickSchedule = () => {
    setShowMeetingForm(true);
  };

  const handleCheckAvailability = () => {
    // Navigate to availability view or show modal
    console.log('Check availability');
  };

  const handleScheduleWithAttendees = () => {
    setShowMeetingForm(true);
  };

  const handleMeetingSubmit = (meetingData: any) => {
    // Handle meeting creation/update
    console.log('Meeting data:', meetingData);
    setShowMeetingForm(false);
  };

  return (
    <div className="h-screen bg-background flex">
      {/* Main Chat Area (70%) */}
      <div className="flex-[7] flex flex-col">
        {/* Header */}
        <header className="border-b bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  AI Meeting Scheduler
                </h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {user?.full_name || user?.email}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/history')}
              >
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMeetingForm(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Meeting
              </Button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Quick Actions */}
        <div className="p-6 bg-card border-b">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <QuickActions
            onQuickSchedule={handleQuickSchedule}
            onCheckAvailability={handleCheckAvailability}
            onScheduleWithAttendees={handleScheduleWithAttendees}
          />
        </div>

        {/* Chat Window */}
        <div className="flex-1">
          <ChatWindow />
        </div>
      </div>

      {/* Sidebar (30%) */}
      <div className="flex-[3] border-l bg-card">
        <div className="h-full flex flex-col">
          {/* Stats */}
          <div className="p-4 border-b">
            <h2 className="font-semibold text-foreground mb-4">Overview</h2>
            <div className="grid grid-cols-2 gap-3">
              <StatsCard
                title="Total"
                value={stats.total}
                icon={<Calendar className="h-4 w-4" />}
              />
              <StatsCard
                title="Today"
                value={stats.today}
                icon={<Clock className="h-4 w-4" />}
              />
              <StatsCard
                title="This Week"
                value={stats.thisWeek}
                icon={<TrendingUp className="h-4 w-4" />}
              />
              <StatsCard
                title="Scheduled"
                value={stats.scheduled}
                icon={<Users className="h-4 w-4" />}
              />
            </div>
          </div>

          {/* Search and Filter */}
          <div className="p-4 border-b space-y-3">
            <Input
              placeholder="Search meetings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-2 border border-input rounded-md bg-background text-sm"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="canceled">Canceled</option>
              <option value="rescheduled">Rescheduled</option>
            </select>
          </div>

          {/* Meetings List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-foreground">Upcoming Meetings</h2>
              <span className="text-sm text-muted-foreground">
                {meetingsLoading ? 'Loading...' : `${upcomingMeetings?.length || 0} meetings`}
              </span>
            </div>
            
            {meetingsLoading ? (
              <div className="text-center text-muted-foreground py-8">
                Loading meetings...
              </div>
            ) : upcomingMeetings && upcomingMeetings.length > 0 ? (
              upcomingMeetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No upcoming meetings</p>
                <p className="text-sm">Start scheduling with the chat or quick actions!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Meeting Form Modal */}
      <MeetingForm
        isOpen={showMeetingForm}
        onClose={() => setShowMeetingForm(false)}
        onSubmit={handleMeetingSubmit}
      />
    </div>
  );
}
