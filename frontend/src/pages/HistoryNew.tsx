import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MessageSquare, Users, MapPin, Search, ArrowUpDown, ChevronRight } from 'lucide-react';
import { useMeetings } from '../hooks/useMeetings';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../lib/api';
import LogoutMenu from '../components/LogoutMenu';
import NavigationBar from '../components/NavigationBar';

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
      } catch {
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
      m.attendees.some((a: { email?: string }) => a.email?.toLowerCase().includes(searchTerm.toLowerCase()));
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

      <NavigationBar
        user={user}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        setShowLogout={setShowLogout}
      />

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
              const startDate = new Date(meeting.start_time);
              return (
                <div key={meeting.id} className="history-card group hover:scale-[1.01] transition-all duration-300" style={{ animationDelay: `${0.05 * index}s` }}>
                  <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                    {/* Date Column */}
                    <div className="flex sm:flex-col items-center gap-1 min-w-[60px] p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-colors">
                      <span className="text-2xl font-black text-white group-hover:text-blue-400">
                        {startDate.getDate()}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-blue-400/80">
                        {startDate.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                    </div>

                    {/* Content Column */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-white truncate group-hover:text-blue-400 transition-colors">{meeting.title}</h3>
                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${statusConfig.class}`}>
                          {statusConfig.label}
                        </div>
                      </div>

                      {meeting.description && (
                        <p className="text-sm text-slate-400 line-clamp-1 mb-3">{meeting.description}</p>
                      )}

                      <div className="flex flex-wrap gap-4 text-xs font-medium">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock className="h-3.5 w-3.5 text-blue-400" />
                          <span>{startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Users className="h-3.5 w-3.5 text-purple-400" />
                          <span>{meeting.attendees.length} people</span>
                        </div>
                        {meeting.provider && (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                            <span>{meeting.provider}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Column */}
                    <div className="hidden sm:flex items-center">
                      <button className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                        <ChevronRight className="h-5 w-5" />
                      </button>
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
