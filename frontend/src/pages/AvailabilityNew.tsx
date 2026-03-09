import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, XCircle, CheckCircle, Clock, Sunrise, Sunset } from 'lucide-react';
import NavigationBar from '../components/NavigationBar';
import LogoutMenu from '../components/LogoutMenu';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../lib/api';

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
  // Get local date string in YYYY-MM-DD format
  const getLocalDateString = (date = new Date()) => {
    // This handles the local timezone offset correctly for the input field
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
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
        const currentUser = await apiClient.getCurrentUser();
        // If user doesn't have a timezone set, detect it
        if (!currentUser.timezone || currentUser.timezone === 'UTC') {
          console.log('Detecting timezone...');
          await apiClient.detectTimezone();
          // Re-fetch user to get updated timezone
          await apiClient.getCurrentUser();
        }
        await fetchAvailability();
      } catch (err) {
        console.error('Auth/Timezone error:', err);
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
    } catch (err: unknown) {
      setError((err as any)?.response?.data?.detail || (err as Error)?.message || 'Failed to load availability');
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
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getTimeCategory = (isoString: string) => {
    const hour = new Date(isoString).getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const morningSlots = timeSlots.filter(s => getTimeCategory(s.start_time) === 'morning');
  const afternoonSlots = timeSlots.filter(s => getTimeCategory(s.start_time) === 'afternoon');
  const eveningSlots = timeSlots.filter(s => getTimeCategory(s.start_time) === 'evening');

  const totalSlots = availableCount + busyCount;
  const availPercent = totalSlots > 0 ? Math.round((availableCount / totalSlots) * 100) : 0;

  // Date navigation helpers
  const goToPrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(getLocalDateString(d));
  };
  const goToNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(getLocalDateString(d));
  };
  const goToToday = () => {
    setSelectedDate(getLocalDateString());
  };

  const TimeSlotSection = ({ title, icon, slots, gradient }: { title: string; icon: React.ReactNode; slots: TimeSlot[]; gradient: string }) => (
    slots.length > 0 ? (
      <div className="avail-section fade-in-up">
        <div className="avail-section-header">
          <div className={`avail-section-icon ${gradient}`}>{icon}</div>
          <h3 className="avail-section-title">{title}</h3>
          <span className="avail-section-count">{slots.filter(s => s.is_available).length}/{slots.length} free</span>
        </div>
        <div className="avail-slots-grid">
          {slots.map((slot, idx) => (
            <div
              key={idx}
              className={`avail-slot ${slot.is_available ? 'avail-slot--free' : 'avail-slot--busy'}`}
            >
              <span className="avail-slot-indicator" />
              <span className="avail-slot-time">{formatTime(slot.start_time)}</span>
              <span className="avail-slot-label">{slot.is_available ? 'Free' : 'Busy'}</span>
            </div>
          ))}
        </div>
      </div>
    ) : null
  );

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

      {/* Main Content */}
      <main className="saas-main px-3 sm:px-4 lg:px-6">
        {/* Page Header - Mobile Optimized */}
        <div className="mb-4 sm:mb-6 fade-in-up">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">Check Availability</h1>
              <p className="text-xs sm:text-sm text-slate-400 truncate">
                {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
            </div>

            {/* Mobile-Optimized Date Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={goToPrevDay}
                className="p-2 sm:px-3 sm:py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-95 transition-all touch-manipulation"
                title="Previous day"
              >
                <span className="sm:hidden">←</span>
                <span className="hidden sm:inline text-sm">← Prev</span>
              </button>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2 py-2 sm:px-3 sm:py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs sm:text-sm focus:outline-none focus:border-blue-500/50"
              />

              <button
                onClick={goToNextDay}
                className="p-2 sm:px-3 sm:py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-95 transition-all touch-manipulation"
                title="Next day"
              >
                <span className="sm:hidden">→</span>
                <span className="hidden sm:inline text-sm">Next →</span>
              </button>

              <button
                onClick={goToToday}
                className="px-2 py-2 sm:px-3 sm:py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs sm:text-sm font-medium hover:bg-blue-500/30 active:scale-95 transition-all touch-manipulation"
              >
                Today
              </button>

              <button
                onClick={fetchAvailability}
                className="p-2 sm:px-3 sm:py-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-95 transition-all touch-manipulation"
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="avail-error fade-in-up">
            <XCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="saas-loader">
            <div className="saas-loader-spinner" />
            <p>Loading availability...</p>
          </div>
        ) : (
          <div className="avail-layout fade-in-up">
            {/* Summary Cards */}
            <div className="avail-summary">
              <div className="avail-summary-card avail-summary-card--green">
                <div className="avail-summary-icon">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div className="avail-summary-info">
                  <p className="avail-summary-value">{availableCount}</p>
                  <p className="avail-summary-label">Available Slots</p>
                </div>
              </div>
              <div className="avail-summary-card avail-summary-card--red">
                <div className="avail-summary-icon">
                  <XCircle className="h-5 w-5" />
                </div>
                <div className="avail-summary-info">
                  <p className="avail-summary-value">{busyCount}</p>
                  <p className="avail-summary-label">Busy Slots</p>
                </div>
              </div>
              <div className="avail-summary-card avail-summary-card--blue">
                <div className="avail-summary-icon">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="avail-summary-info">
                  <p className="avail-summary-value">{availPercent}%</p>
                  <p className="avail-summary-label">Availability</p>
                </div>
                <div className="avail-progress">
                  <div className="avail-progress-fill" style={{ width: `${availPercent}%` }} />
                </div>
              </div>
            </div>

            {/* Time Slots by Period */}
            <div className="avail-periods">
              <TimeSlotSection
                title="Morning"
                icon={<Sunrise className="h-4 w-4" />}
                slots={morningSlots}
                gradient="avail-icon--amber"
              />
              <TimeSlotSection
                title="Afternoon"
                icon={<Clock className="h-4 w-4" />}
                slots={afternoonSlots}
                gradient="avail-icon--blue"
              />
              <TimeSlotSection
                title="Evening"
                icon={<Sunset className="h-4 w-4" />}
                slots={eveningSlots}
                gradient="avail-icon--purple"
              />
              {timeSlots.length === 0 && (
                <div className="dashboard-empty">
                  <Clock className="h-10 w-10" />
                  <p>No time slots for this date</p>
                  <span>Try selecting a different date</span>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <LogoutMenu isOpen={showLogout} onClose={() => setShowLogout(false)} />
    </div>
  );
}

