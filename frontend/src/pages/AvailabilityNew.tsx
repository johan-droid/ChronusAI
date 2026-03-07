import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MessageSquare, BarChart3, LogOut, Menu, X, CheckCircle, XCircle, RefreshCw, Sunrise, Sunset } from 'lucide-react';
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
    setSelectedDate(d.toISOString().split('T')[0]);
  };
  const goToNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };
  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
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

      {/* Navigation */}
      <nav className="saas-nav">
        <div className="saas-nav-inner">
          <div className="saas-nav-content">
            <div className="saas-nav-logo" onClick={() => navigate('/dashboard')}>
              <img src="/logo.png" alt="ChronosAI" className="saas-nav-logo-img" />
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
              <button onClick={() => navigate('/availability')} className="saas-nav-pill saas-nav-pill--active">
                <Clock className="h-4 w-4" />
                <span>Availability</span>
              </button>
              <button onClick={() => navigate('/history')} className="saas-nav-pill">
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
              <button onClick={() => { navigate('/availability'); setMobileMenuOpen(false); }} className="saas-mobile-item saas-mobile-item--active">
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
        {/* Page Header */}
        <div className="avail-header fade-in-up">
          <div>
            <h1 className="avail-title">Check Availability</h1>
            <p className="avail-subtitle">
              View your free time slots for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="avail-date-controls">
            <button onClick={goToPrevDay} className="avail-date-btn" title="Previous day">←</button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="avail-date-input"
            />
            <button onClick={goToNextDay} className="avail-date-btn" title="Next day">→</button>
            <button onClick={goToToday} className="avail-date-btn avail-date-btn--today" title="Go to today">Today</button>
            <button onClick={fetchAvailability} className="avail-date-btn" title="Refresh">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
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
