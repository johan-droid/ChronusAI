import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, TrendingUp, Users, CheckCircle, XCircle, MessageSquare, BarChart3, LogOut, Menu, X, Sparkles, ArrowUpRight, Activity, Zap } from 'lucide-react';
import StatsCard from '../components/StatsCard';
import { useMeetings } from '../hooks/useMeetings';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../lib/api';
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

  const upcomingMeetings = meetings?.filter(m =>
    m.status === 'scheduled' && new Date(m.start_time) > new Date()
  ).sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()).slice(0, 5);

  const quickActions = [
    { icon: <MessageSquare className="h-5 w-5" />, label: 'Chat with AI', desc: 'Schedule via chat', path: '/chat', color: 'from-blue-500 to-cyan-500' },
    { icon: <Clock className="h-5 w-5" />, label: 'Availability', desc: 'View free slots', path: '/availability', color: 'from-emerald-500 to-teal-500' },
    { icon: <Calendar className="h-5 w-5" />, label: 'History', desc: 'Past meetings', path: '/history', color: 'from-violet-500 to-purple-500' },
  ];

  return (
    <div className="page-shell">
      {/* Background effects */}
      <div className="page-bg" />
      <div className="page-grid-overlay" />

      {/* Top Navigation Bar */}
      <nav className="saas-nav">
        <div className="saas-nav-inner">
          <div className="saas-nav-content">
            {/* Logo */}
            <div className="saas-nav-logo" onClick={() => navigate('/dashboard')}>
              <img src="/logo.png" alt="ChronosAI" className="saas-nav-logo-img" />
              <span className="saas-nav-logo-text">ChronosAI</span>
            </div>

            {/* Desktop Navigation Pills */}
            <div className="saas-nav-pills">
              <button onClick={() => navigate('/dashboard')} className="saas-nav-pill saas-nav-pill--active">
                <BarChart3 className="h-4 w-4" />
                <span>Dashboard</span>
              </button>
              <button onClick={() => navigate('/chat')} className="saas-nav-pill">
                <MessageSquare className="h-4 w-4" />
                <span>Chat</span>
              </button>
              <button onClick={() => navigate('/availability')} className="saas-nav-pill">
                <Clock className="h-4 w-4" />
                <span>Availability</span>
              </button>
              <button onClick={() => navigate('/history')} className="saas-nav-pill">
                <Calendar className="h-4 w-4" />
                <span>History</span>
              </button>
            </div>

            {/* User Menu */}
            <div className="saas-nav-user">
              <div className="saas-nav-user-info">
                <p className="saas-nav-user-name">{user?.full_name || 'User'}</p>
                <p className="saas-nav-user-email">{user?.email}</p>
              </div>
              <button onClick={() => setShowLogout(true)} className="saas-nav-logout-btn" title="Sign out">
                <LogOut className="h-4 w-4" />
              </button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="saas-nav-mobile-toggle">
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="saas-mobile-menu">
              <button onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }} className="saas-mobile-item saas-mobile-item--active">
                <BarChart3 className="h-4 w-4" /> Dashboard
              </button>
              <button onClick={() => { navigate('/chat'); setMobileMenuOpen(false); }} className="saas-mobile-item">
                <MessageSquare className="h-4 w-4" /> Chat
              </button>
              <button onClick={() => { navigate('/availability'); setMobileMenuOpen(false); }} className="saas-mobile-item">
                <Clock className="h-4 w-4" /> Availability
              </button>
              <button onClick={() => { navigate('/history'); setMobileMenuOpen(false); }} className="saas-mobile-item">
                <Calendar className="h-4 w-4" /> History
              </button>
              <button onClick={() => { setShowLogout(true); setMobileMenuOpen(false); }} className="saas-mobile-item saas-mobile-item--danger">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="saas-main">
        {/* Welcome Header */}
        <div className="dashboard-welcome fade-in-up">
          <div className="dashboard-welcome-left">
            <div className="dashboard-welcome-badge">
              <Activity className="h-3.5 w-3.5" />
              <span>Live Overview</span>
            </div>
            <h1 className="dashboard-welcome-title">
              Welcome back, <span className="gradient-text-blue">{user?.full_name?.split(' ')[0] || 'User'}</span>
            </h1>
            <p className="dashboard-welcome-sub">Here's an overview of your meeting activity and upcoming schedule.</p>
          </div>
          <div className="dashboard-welcome-right">
            <p className="dashboard-welcome-date">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="saas-loader">
            <div className="saas-loader-spinner" />
            <p>Loading your dashboard...</p>
          </div>
        ) : (
          <div className="dashboard-grid">
            {/* Primary Stats Row */}
            <div className="dashboard-stats-row fade-in-up" style={{ animationDelay: '0.1s' }}>
              <StatsCard title="Total Meetings" value={stats.total} icon={<Calendar className="h-4 w-4" />} />
              <StatsCard title="Scheduled" value={stats.scheduled} icon={<CheckCircle className="h-4 w-4" />} />
              <StatsCard title="Upcoming" value={stats.upcoming} icon={<Clock className="h-4 w-4" />} />
              <StatsCard title="Canceled" value={stats.canceled} icon={<XCircle className="h-4 w-4" />} />
            </div>

            {/* Content Grid */}
            <div className="dashboard-content-grid">
              {/* Left Column - Timeline & Analytics */}
              <div className="dashboard-content-left">
                {/* Time Analytics */}
                <div className="saas-card fade-in-up" style={{ animationDelay: '0.2s' }}>
                  <div className="saas-card-header">
                    <div className="saas-card-header-left">
                      <TrendingUp className="h-4 w-4 text-blue-400" />
                      <h3>Time Analytics</h3>
                    </div>
                  </div>
                  <div className="dashboard-analytics-grid">
                    <div className="dashboard-analytics-item">
                      <div className="dashboard-analytics-icon dashboard-analytics-icon--blue">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="dashboard-analytics-value">{stats.today}</p>
                        <p className="dashboard-analytics-label">Today</p>
                      </div>
                    </div>
                    <div className="dashboard-analytics-item">
                      <div className="dashboard-analytics-icon dashboard-analytics-icon--purple">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="dashboard-analytics-value">{stats.thisWeek}</p>
                        <p className="dashboard-analytics-label">This Week</p>
                      </div>
                    </div>
                    <div className="dashboard-analytics-item">
                      <div className="dashboard-analytics-icon dashboard-analytics-icon--emerald">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="dashboard-analytics-value">{stats.thisMonth}</p>
                        <p className="dashboard-analytics-label">This Month</p>
                      </div>
                    </div>
                    <div className="dashboard-analytics-item">
                      <div className="dashboard-analytics-icon dashboard-analytics-icon--amber">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="dashboard-analytics-value">{stats.totalAttendees}</p>
                        <p className="dashboard-analytics-label">Total Attendees</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upcoming Meetings */}
                <div className="saas-card fade-in-up" style={{ animationDelay: '0.3s' }}>
                  <div className="saas-card-header">
                    <div className="saas-card-header-left">
                      <Sparkles className="h-4 w-4 text-purple-400" />
                      <h3>Upcoming Meetings</h3>
                    </div>
                    <span className="saas-badge">{upcomingMeetings?.length || 0}</span>
                  </div>
                  <div className="dashboard-meetings-list">
                    {upcomingMeetings && upcomingMeetings.length > 0 ? (
                      upcomingMeetings.map((meeting) => (
                        <div key={meeting.id} className="dashboard-meeting-item">
                          <div className="dashboard-meeting-time">
                            <span className="dashboard-meeting-hour">
                              {new Date(meeting.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                            <span className="dashboard-meeting-date">
                              {new Date(meeting.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <div className="dashboard-meeting-divider" />
                          <div className="dashboard-meeting-details">
                            <p className="dashboard-meeting-title">{meeting.title}</p>
                            <p className="dashboard-meeting-attendees">
                              <Users className="h-3 w-3" />
                              {meeting.attendees.length} attendee{meeting.attendees.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="dashboard-meeting-status dashboard-meeting-status--scheduled">
                            Scheduled
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="dashboard-empty">
                        <Calendar className="h-10 w-10" />
                        <p>No upcoming meetings</p>
                        <span>Use AI Chat to schedule your first meeting</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Quick Actions & Engagement */}
              <div className="dashboard-content-right">
                {/* Quick Actions */}
                <div className="saas-card fade-in-up" style={{ animationDelay: '0.25s' }}>
                  <div className="saas-card-header">
                    <div className="saas-card-header-left">
                      <Zap className="h-4 w-4 text-amber-400" />
                      <h3>Quick Actions</h3>
                    </div>
                  </div>
                  <div className="dashboard-actions">
                    {quickActions.map((action, i) => (
                      <button key={i} onClick={() => navigate(action.path)} className="dashboard-action-btn">
                        <div className={`dashboard-action-icon bg-gradient-to-br ${action.color}`}>
                          {action.icon}
                        </div>
                        <div className="dashboard-action-text">
                          <p className="dashboard-action-label">{action.label}</p>
                          <p className="dashboard-action-desc">{action.desc}</p>
                        </div>
                        <ArrowUpRight className="dashboard-action-arrow" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Engagement */}
                <div className="saas-card fade-in-up" style={{ animationDelay: '0.35s' }}>
                  <div className="saas-card-header">
                    <div className="saas-card-header-left">
                      <Users className="h-4 w-4 text-emerald-400" />
                      <h3>Engagement</h3>
                    </div>
                  </div>
                  <div className="dashboard-engagement">
                    <div className="dashboard-engagement-item">
                      <div className="dashboard-engagement-bar">
                        <div className="dashboard-engagement-fill" style={{ width: `${Math.min((stats.totalAttendees / Math.max(stats.total, 1)) * 20, 100)}%` }} />
                      </div>
                      <div className="dashboard-engagement-info">
                        <span className="dashboard-engagement-value">{stats.total > 0 ? (stats.totalAttendees / stats.total).toFixed(1) : 0}</span>
                        <span className="dashboard-engagement-label">Avg. Attendees / Meeting</span>
                      </div>
                    </div>
                    <div className="dashboard-engagement-item">
                      <div className="dashboard-engagement-bar">
                        <div className="dashboard-engagement-fill dashboard-engagement-fill--purple" style={{ width: `${Math.min((stats.scheduled / Math.max(stats.total, 1)) * 100, 100)}%` }} />
                      </div>
                      <div className="dashboard-engagement-info">
                        <span className="dashboard-engagement-value">{stats.total > 0 ? Math.round((stats.scheduled / stats.total) * 100) : 0}%</span>
                        <span className="dashboard-engagement-label">Active Rate</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <LogoutMenu isOpen={showLogout} onClose={() => setShowLogout(false)} />
    </div>
  );
}
