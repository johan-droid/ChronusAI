import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MessageSquare, BarChart3, LogOut, Menu, X, Sparkles } from 'lucide-react';
import ChatWindow from '../components/ChatWindow';
import AnimatedLogo from '../components/AnimatedLogo';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../lib/api';
import LogoutMenu from '../components/LogoutMenu';

export default function Chat() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
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
      } catch {
        navigate('/login');
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="page-shell" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="page-bg" />
      <div className="page-grid-overlay" />

      <nav className="saas-nav" style={{ flexShrink: 0 }}>
        <div className="saas-nav-inner">
          <div className="saas-nav-content">
            <div className="saas-nav-logo" onClick={() => navigate('/dashboard')}>
              <AnimatedLogo className="saas-nav-logo-img" />
              <span className="saas-nav-logo-text">ChronosAI</span>
            </div>

            <div className="saas-nav-pills">
              <button onClick={() => navigate('/dashboard')} className="saas-nav-pill">
                <BarChart3 className="h-4 w-4" />
                <span>Dashboard</span>
              </button>
              <button onClick={() => navigate('/chat')} className="saas-nav-pill saas-nav-pill--active">
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
              <button onClick={() => { navigate('/chat'); setMobileMenuOpen(false); }} className="saas-mobile-item saas-mobile-item--active">
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

      <main className="relative z-10" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col min-h-0 px-3 sm:px-6 py-3 sm:py-6">
          <div className="flex-1 min-h-0 bg-slate-900/30 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/5 shadow-2xl overflow-hidden flex flex-col">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/5 bg-slate-900/50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg font-semibold text-white truncate">AI Meeting Assistant</h2>
                  <p className="text-[11px] sm:text-xs text-slate-400 truncate">Schedule, reschedule, or check availability</p>
                </div>
              </div>
            </div>

            {/* Chat Window - flex-1 + min-h-0 ensures proper scroll */}
            <div className="flex-1 min-h-0">
              <ChatWindow />
            </div>
          </div>
        </div>
      </main>

      <LogoutMenu isOpen={showLogout} onClose={() => setShowLogout(false)} />
    </div>
  );
}

