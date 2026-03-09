import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MessageSquare, Users, MapPin, Search, ArrowUpDown } from 'lucide-react';
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

      <main className="saas-main px-3 sm:px-4 lg:px-6">
        {/* Page Header */}
        <div className="mb-4 sm:mb-6 fade-in-up">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">Meeting History</h1>
              <p className="text-xs sm:text-sm text-slate-400">View and manage all your meetings</p>
            </div>
          </div>
        </div>

        {/* Toolbar - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 fade-in-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search meetings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <button
            onClick={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-slate-300 hover:bg-white/[0.05] active:scale-[0.98] transition-all"
            title={sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
          >
            <ArrowUpDown className="h-4 w-4" />
            <span className="sm:hidden">{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
          </button>
        </div>

        {/* Filter Tabs - Horizontal scroll on mobile */}
        <div className="mb-4 fade-in-up overflow-x-auto scrollbar-hide" style={{ animationDelay: '0.1s' }}>
          <div className="flex gap-2 min-w-max pb-1">
            {(['all', 'scheduled', 'canceled', 'rescheduled'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${filter === status 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white/[0.03] text-slate-400 border border-white/10 hover:bg-white/[0.05]'
                }`}
              >
                <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-white/10 rounded-full">{statusCounts[status]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Meetings List */}
        {isLoading ? (
          <div className="saas-loader">
            <div className="saas-loader-spinner" />
            <p>Loading meetings...</p>
          </div>
        ) : filteredMeetings && filteredMeetings.length > 0 ? (
          <div className="history-list fade-in-up space-y-3" style={{ animationDelay: '0.15s' }}>
            {filteredMeetings.map((meeting, index) => {
              const statusConfig = getStatusConfig(meeting.status);
              const startDate = new Date(meeting.start_time);
              const isToday = new Date().toDateString() === startDate.toDateString();
              
              return (
                <div 
                  key={meeting.id} 
                  className="bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-2xl p-4 transition-all active:scale-[0.98] touch-manipulation"
                  style={{ animationDelay: `${0.05 * index}s` }}
                >
                  {/* Modern Mobile Card Layout */}
                  <div className="flex gap-3">
                    {/* Left: Date Column - Compact */}
                    <div className="flex flex-col items-center min-w-[52px]">
                      <span className={`text-xs font-bold uppercase tracking-wider ${isToday ? 'text-blue-400' : 'text-slate-500'}`}>
                        {isToday ? 'TODAY' : startDate.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-2xl font-black text-white leading-none mt-0.5">
                        {startDate.getDate()}
                      </span>
                      <span className="text-[10px] text-slate-600 mt-0.5">
                        {startDate.toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                    </div>

                    {/* Right: Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title & Status Row */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-sm sm:text-base font-bold text-white leading-tight line-clamp-2">
                          {meeting.title}
                        </h3>
                        <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight border ${statusConfig.class}`}>
                          {statusConfig.label}
                        </span>
                      </div>

                      {/* Description */}
                      {meeting.description && (
                        <p className="text-xs text-slate-400 line-clamp-1 mb-2">{meeting.description}</p>
                      )}

                      {/* Info Pills Row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1 text-[11px] text-slate-300">
                          <Clock className="h-3 w-3 text-blue-400" />
                          <span>{startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                        </div>
                        <span className="text-slate-600">•</span>
                        <div className="flex items-center gap-1 text-[11px] text-slate-300">
                          <Users className="h-3 w-3 text-purple-400" />
                          <span>{meeting.attendees.length}</span>
                        </div>
                        {meeting.provider && (
                          <>
                            <span className="text-slate-600">•</span>
                            <div className="flex items-center gap-1 text-[11px] text-slate-300">
                              <MapPin className="h-3 w-3 text-emerald-400" />
                              <span className="capitalize">{meeting.provider}</span>
                            </div>
                          </>
                        )}
                      </div>
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
