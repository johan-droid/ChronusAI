import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MessageSquare, BarChart3, LogOut, Menu, X, Sparkles } from 'lucide-react';
import ChatWindow from '../components/ChatWindow';
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
      } catch (error) {
        navigate('/login');
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="page-shell">
      <div className="page-bg" />
      <div className="page-grid-overlay" />

      {/* Top Navigation */}
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

      {/* Chat Content - Full Height */}
      <main className="chat-main">
        <div className="chat-container">
          <div className="chat-wrapper">
            {/* Chat Header */}
            <div className="chat-header">
              <div className="chat-header-left">
                <div className="chat-header-avatar">
                  <Sparkles className="h-5 w-5 text-blue-400" />
                  <span className="chat-header-pulse" />
                </div>
                <div>
                  <h2 className="chat-header-title">AI Meeting Assistant</h2>
                  <p className="chat-header-sub">Schedule, reschedule, or check availability using natural language</p>
                </div>
              </div>
              <div className="chat-header-status">
                <span className="chat-status-dot" />
                <span>Online</span>
              </div>
            </div>

            {/* Chat Window */}
            <div className="chat-body">
              <ChatWindow />
            </div>
          </div>
        </div>
      </main>

      <LogoutMenu isOpen={showLogout} onClose={() => setShowLogout(false)} />
    </div>
  );
}
