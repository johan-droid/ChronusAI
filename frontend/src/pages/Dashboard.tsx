import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, LogOut, Plus, Search, Users, Clock, TrendingUp, History, Sparkles, Menu, X } from 'lucide-react';
import ChatWindow from '../components/ChatWindow';
import MeetingCard from '../components/MeetingCard';
import QuickActions from '../components/QuickActions';
import StatsCard from '../components/StatsCard';
import MeetingForm from '../components/MeetingForm';
import Button from '../components/Button';
import Input from '../components/Input';
import HealthStatus from '../components/HealthStatus';
import TimeGreeting from '../components/TimeGreeting';
import CacheCleaner from '../components/CacheCleaner';
import LogoutMenu from '../components/LogoutMenu';
import { useMeetings } from '../hooks/useMeetings';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../lib/api';
import { clearAuthCache } from '../lib/cache';
import ThemeToggle from '../components/ThemeToggle';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { data: meetings, isLoading: meetingsLoading } = useMeetings();
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    <div className="h-screen bg-background flex relative overflow-hidden mobile-safe-area">
      {/* Enhanced Galaxy Background */}
      <div className="stars" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating orbs */}
        <div className="absolute w-32 h-32 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-xl animate-float" style={{ top: '10%', left: '5%', animationDelay: '0s' }} />
        <div className="absolute w-24 h-24 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-full blur-xl animate-float" style={{ top: '70%', right: '10%', animationDelay: '3s' }} />
        <div className="absolute w-20 h-20 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-xl animate-float" style={{ top: '40%', left: '80%', animationDelay: '6s' }} />
        
        {/* Shooting stars */}
        <div className="absolute w-1 h-1 bg-white rounded-full" style={{ top: '20%', left: '10%', animation: 'shooting-star 8s infinite', animationDelay: '2s' }} />
        <div className="absolute w-1 h-1 bg-blue-300 rounded-full" style={{ top: '60%', left: '70%', animation: 'shooting-star 12s infinite', animationDelay: '5s' }} />
        
        {/* Nebula clouds */}
        <div className="absolute w-96 h-96 bg-gradient-radial from-blue-500/5 via-purple-500/3 to-transparent rounded-full blur-3xl animate-pulse" style={{ top: '-10%', right: '-10%' }} />
        <div className="absolute w-80 h-80 bg-gradient-radial from-green-500/5 via-blue-500/3 to-transparent rounded-full blur-3xl animate-pulse" style={{ bottom: '-10%', left: '-10%', animationDelay: '4s' }} />
      </div>

      {/* Health Status */}
      <HealthStatus />

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col relative z-10 transition-all duration-300 ${
        isMobile && sidebarOpen ? 'blur-sm' : ''
      }`}>
        {/* Mobile Header */}
        <header className="border-b border-white/5 glass px-4 py-3 md:px-6 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors md:hidden"
                >
                  <Menu className="h-5 w-5 text-foreground" />
                </button>
              )}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent blur-xl opacity-50 animate-pulse" />
                <Calendar className="h-6 w-6 md:h-8 md:w-8 text-primary relative z-10" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg md:text-xl font-semibold gradient-text flex items-center gap-2">
                  ChronosAI
                  <Sparkles className="h-3 w-3 md:h-4 md:w-4 text-accent animate-pulse" />
                </h1>
                <TimeGreeting userName={user?.full_name} />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-3">
              <ThemeToggle />
              {!isMobile && <CacheCleaner />}
              <Button variant="outline" size="sm" onClick={() => navigate('/history')} className="hidden sm:flex">
                <History className="h-4 w-4 mr-2" />
                History
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowMeetingForm(true)}>
                <Plus className="h-4 w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">New</span>
              </Button>
              <button
                onClick={() => setShowLogoutMenu(true)}
                className="flex items-center space-x-2 px-2 md:px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Quick Actions */}
        {isMobile && (
          <div className="p-3 glass border-b border-white/5">
            <QuickActions />
          </div>
        )}

        {/* Desktop Quick Actions */}
        {!isMobile && (
          <div className="p-4 md:p-6 glass border-b border-white/5">
            <h2 className="text-xs font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Quick Actions</h2>
            <QuickActions />
          </div>
        )}

        {/* Chat Window */}
        <div className="flex-1 overflow-hidden">
          <ChatWindow />
        </div>
      </div>

      {/* Sidebar */}
      <div className={`${
        isMobile 
          ? `fixed top-0 right-0 h-full w-72 transform transition-transform duration-300 z-50 ${
              sidebarOpen ? 'translate-x-0' : 'translate-x-full'
            }`
          : 'flex-[3] border-l border-white/5'
      } glass relative`}>
        <div className="h-full flex flex-col">
          {/* Mobile Sidebar Header */}
          {isMobile && (
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h2 className="font-semibold text-foreground">Overview</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-foreground" />
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="p-3 md:p-4 border-b border-white/5">
            {!isMobile && <h2 className="font-semibold text-foreground mb-3 text-xs uppercase tracking-wide">Overview</h2>}
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <StatsCard title="Total" value={stats.total} icon={<Calendar className="h-3 w-3 md:h-4 md:w-4" />} />
              <StatsCard title="Today" value={stats.today} icon={<Clock className="h-3 w-3 md:h-4 md:w-4" />} />
              <StatsCard title="Week" value={stats.thisWeek} icon={<TrendingUp className="h-3 w-3 md:h-4 md:w-4" />} />
              <StatsCard title="Active" value={stats.scheduled} icon={<Users className="h-3 w-3 md:h-4 md:w-4" />} />
            </div>
          </div>

          {/* Search */}
          <div className="p-3 md:p-4 border-b border-white/5 space-y-2 md:space-y-3">
            <Input
              placeholder="Search meetings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Search className="h-3 w-3 md:h-4 md:w-4" />}
              className="glass border-white/5 text-xs md:text-sm"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-2 border border-white/5 rounded-md glass text-xs md:text-sm"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>

          {/* Meetings */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-2 md:space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-foreground text-xs md:text-sm">Upcoming</h2>
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

          {/* Mobile Actions */}
          {isMobile && (
            <div className="p-3 border-t border-white/5 space-y-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/history')} className="w-full text-xs">
                <History className="h-3 w-3 mr-2" />
                History
              </Button>
              <CacheCleaner />
            </div>
          )}
        </div>
      </div>

      {/* Logout Menu */}
      <LogoutMenu 
        isOpen={showLogoutMenu} 
        onClose={() => setShowLogoutMenu(false)} 
      />

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
