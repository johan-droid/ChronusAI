import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MessageSquare, BarChart3, LogOut, Menu, X, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../lib/api';
import LogoutMenu from '../components/LogoutMenu';

interface TimeSlot {
  start_time: string;
  end_time: string;
  is_available: boolean;
  timezone: string;
}

export default function Availability() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [showLogout, setShowLogout] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [availableCount, setAvailableCount] = useState(0);
  const [busyCount, setBusyCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { accessToken, isAuthenticated } = useAuthStore.getState();
      if (!accessToken || !isAuthenticated) {
        navigate('/login');
        return;
      }
      try {
        await apiClient.getCurrentUser();
        await fetchAvailability();
      } catch (error) {
        navigate('/login');
      }
    };
    checkAuth();
  }, [navigate]);

  const fetchAvailability = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getAvailability(selectedDate, user?.timezone);
      setTimeSlots(data.slots);
      setAvailableCount(data.available_count);
      setBusyCount(data.busy_count);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAvailability();
    }
  }, [selectedDate, user]);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
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
              <button onClick={() => navigate('/availability')} className="px-5 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium shadow-lg shadow-blue-500/20 transition-all">
                <Clock className="h-4 w-4 inline mr-2" />
                Availability
              </button>
              <button onClick={() => navigate('/history')} className="px-5 py-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/50 text-sm font-medium transition-all">
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
              <button onClick={() => { navigate('/availability'); setMobileMenuOpen(false); }} className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium flex items-center gap-3">
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
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Check Availability</h1>
          <p className="text-slate-400 text-sm sm:text-base">View your free time slots for {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          
          {/* Date Picker */}
          <div className="mt-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-in-left">
            {/* Time Slots */}
            <div className="bg-slate-900/30 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-400" />
                Available Time Slots
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[600px] overflow-y-auto">
                {timeSlots.map((slot, idx) => (
                  <button
                    key={idx}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      slot.is_available
                        ? 'bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/30 cursor-not-allowed opacity-50'
                    }`}
                    disabled={!slot.is_available}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {slot.is_available ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {formatTime(slot.start_time)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Legend & Info */}
            <div className="space-y-6">
              <div className="bg-slate-900/30 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Legend</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Available</p>
                      <p className="text-xs text-slate-400">Free to schedule meetings</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                      <XCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Busy</p>
                      <p className="text-xs text-slate-400">Already booked or unavailable</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/30 backdrop-blur-xl rounded-2xl border border-white/5 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Quick Stats</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-slate-800/30 rounded-xl border border-white/5">
                    <p className="text-2xl font-bold text-green-400">{availableCount}</p>
                    <p className="text-xs text-slate-400 mt-1">Available Slots</p>
                  </div>
                  <div className="text-center p-4 bg-slate-800/30 rounded-xl border border-white/5">
                    <p className="text-2xl font-bold text-red-400">{busyCount}</p>
                    <p className="text-xs text-slate-400 mt-1">Busy Slots</p>
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
