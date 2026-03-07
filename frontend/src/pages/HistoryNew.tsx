import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MessageSquare, BarChart3, LogOut, Menu, X, Users, MapPin, Search, ArrowUpDown } from 'lucide-react';
import { useMeetings } from '../hooks/useMeetings';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../lib/api';
import LogoutMenu from '../components/LogoutMenu';

export default function History() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: meetings, isLoading } = useMeetings();
  const [showLogout, setShowLogout] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

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

  const filteredMeetings = meetings?.filter(m => {
    const matchesFilter = filter === 'all' || m.status === filter;
    const matchesSearch = !searchTerm ||
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.attendees.some((a: any) => a.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  }).sort((a, b) => {
    const diff = new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    return sortOrder === 'desc' ? -diff : diff;
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'scheduled': return { class: 'history-status--scheduled', label: 'Scheduled' };
      case 'canceled': return { class: 'history-status--canceled', label: 'Canceled' };
      case 'rescheduled': return { class: 'history-status--rescheduled', label: 'Rescheduled' };
      default: return { class: 'history-status--default', label: status };
    }
  };

  const statusCounts = {
    all: meetings?.length || 0,
    scheduled: meetings?.filter(m => m.status === 'scheduled').length || 0,
    canceled: meetings?.filter(m => m.status === 'canceled').length || 0,
    rescheduled: meetings?.filter(m => m.status === 'rescheduled').length || 0,
  };

  return (
    <div className="page-shell">
      <div className="page-bg" />
      <div className="page-grid-overlay" />

      {/* Navigation */}
      <nav className="saas-nav">
        <div className="saas-nav-inner">
          <div className="saas-nav-content">
            <div className="saas-nav-logo" onClick={() => navigate('/dashboard')}>
              <div className="saas-nav-logo-icon">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <span className="saas-nav-logo-text">ChronosAI</span>
            </div>

            <div className="saas-nav-pills">
              <button onClick={() => navigate('/dashboard')} className="saas-nav-pill">
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
              <button onClick={() => navigate('/history')} className="saas-nav-pill saas-nav-pill--active">
                <Calendar className="h-4 w-4" />
                <span>History</span>
              </button>
            </div>

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

          {mobileMenuOpen && (
            <div className="saas-mobile-menu">
              <button onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }} className="saas-mobile-item">
                <BarChart3 className="h-4 w-4" /> Dashboard
              </button>
              <button onClick={() => { navigate('/chat'); setMobileMenuOpen(false); }} className="saas-mobile-item">
                <MessageSquare className="h-4 w-4" /> Chat
              </button>
              <button onClick={() => { navigate('/availability'); setMobileMenuOpen(false); }} className="saas-mobile-item">
                <Clock className="h-4 w-4" /> Availability
              </button>
              <button onClick={() => { navigate('/history'); setMobileMenuOpen(false); }} className="saas-mobile-item saas-mobile-item--active">
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
        {/* Page Header */}
        <div className="history-header fade-in-up">
          <div>
            <h1 className="history-title">Meeting History</h1>
            <p className="history-subtitle">View and manage all your past and upcoming meetings</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="history-toolbar fade-in-up" style={{ animationDelay: '0.05s' }}>
          {/* Search */}
          <div className="history-search">
            <Search className="history-search-icon" />
            <input
              type="text"
              placeholder="Search meetings, attendees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="history-search-input"
            />
          </div>

          {/* Sort toggle */}
          <button
            onClick={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')}
            className="history-sort-btn"
            title={sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
          >
            <ArrowUpDown className="h-4 w-4" />
            <span>{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="history-filters fade-in-up" style={{ animationDelay: '0.1s' }}>
          {(['all', 'scheduled', 'canceled', 'rescheduled'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`history-filter-tab ${filter === status ? 'history-filter-tab--active' : ''}`}
            >
              <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
              <span className="history-filter-count">{statusCounts[status]}</span>
            </button>
          ))}
        </div>

        {/* Meetings List */}
        {isLoading ? (
          <div className="saas-loader">
            <div className="saas-loader-spinner" />
            <p>Loading meetings...</p>
          </div>
        ) : filteredMeetings && filteredMeetings.length > 0 ? (
          <div className="history-list fade-in-up" style={{ animationDelay: '0.15s' }}>
            {filteredMeetings.map((meeting, index) => {
              const statusConfig = getStatusConfig(meeting.status);
              return (
                <div key={meeting.id} className="history-card" style={{ animationDelay: `${0.05 * index}s` }}>
                  <div className="history-card-left">
                    <div className="history-card-date">
                      <span className="history-card-day">
                        {new Date(meeting.start_time).getDate()}
                      </span>
                      <span className="history-card-month">
                        {new Date(meeting.start_time).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                    </div>
                  </div>
                  <div className="history-card-body">
                    <div className="history-card-main">
                      <h3 className="history-card-title">{meeting.title}</h3>
                      {meeting.description && (
                        <p className="history-card-desc">{meeting.description}</p>
                      )}
                      <div className="history-card-meta">
                        <div className="history-meta-item">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{new Date(meeting.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                        </div>
                        <div className="history-meta-item">
                          <Users className="h-3.5 w-3.5" />
                          <span>{meeting.attendees.length} attendee{meeting.attendees.length !== 1 ? 's' : ''}</span>
                        </div>
                        {meeting.provider && (
                          <div className="history-meta-item">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{meeting.provider}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className={`history-status ${statusConfig.class}`}>
                      {statusConfig.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="history-empty fade-in-up">
            <Calendar className="h-16 w-16" />
            <h3>No meetings found</h3>
            <p>Try adjusting your filters or search term, or schedule a new meeting via AI Chat</p>
            <button onClick={() => navigate('/chat')} className="history-empty-btn">
              <MessageSquare className="h-4 w-4" />
              Go to Chat
            </button>
          </div>
        )}
      </main>

      <LogoutMenu isOpen={showLogout} onClose={() => setShowLogout(false)} />
    </div>
  );
}
