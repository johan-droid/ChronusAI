import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MessageSquare, BarChart3, LogOut, Menu, X, Users, MapPin } from 'lucide-react';
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
    if (filter === 'all') return true;
    return m.status === filter;
  }).sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'canceled': return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'rescheduled': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-grid-white/[0.02]" />
      
      {/* Top Navigation */}
      <nav className="relative z-50 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">ChronosAI</span>
            </div>

            <div className="hidden md:flex items-center gap-2 bg-slate-900/50 rounded-full p-1.5 border border-white/5">
              <button onClick={() => navigate('/dashboard')} className="px-5 py-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/50 text-sm font-medium transition-all">
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
              <button onClick={() => navigate('/history')} className="px-5 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium shadow-lg shadow-blue-500/20 transition-all">
                <Calendar className="h-4 w-4 inline mr-2" />
                History
              </button>
            </div>

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

          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-2 animate-fade-in">
              <button onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }} className="w-full px-4 py-3 rounded-xl bg-slate-800/50 text-slate-300 text-sm font-medium flex items-center gap-3 hover:bg-slate-700/50">
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
              <button onClick={() => { navigate('/history'); setMobileMenuOpen(false); }} className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium flex items-center gap-3">
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
        <div className="mb-6 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Meeting History</h1>
          <p className="text-slate-400 text-sm sm:text-base">View all your past and upcoming meetings</p>
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2 animate-slide-in-left">
          {['all', 'scheduled', 'canceled', 'rescheduled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filter === status
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 border border-white/5'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Meetings List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : filteredMeetings && filteredMeetings.length > 0 ? (
          <div className="space-y-3 animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
            {filteredMeetings.map((meeting) => (
              <div key={meeting.id} className="bg-slate-900/30 backdrop-blur-xl rounded-2xl border border-white/5 p-6 hover:border-blue-500/30 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                        <Calendar className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white mb-1">{meeting.title}</h3>
                        {meeting.description && (
                          <p className="text-sm text-slate-400 mb-2">{meeting.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(meeting.start_time).toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {meeting.attendees.length} attendee{meeting.attendees.length !== 1 ? 's' : ''}
                          </div>
                          {meeting.provider && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {meeting.provider}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(meeting.status)}`}>
                      {meeting.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/30 backdrop-blur-xl rounded-2xl border border-white/5 p-12 text-center">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-slate-600" />
            <h3 className="text-lg font-semibold text-white mb-2">No meetings found</h3>
            <p className="text-slate-400 text-sm">Try adjusting your filters or schedule a new meeting</p>
          </div>
        )}
      </main>

      <LogoutMenu isOpen={showLogout} onClose={() => setShowLogout(false)} />
    </div>
  );
}
