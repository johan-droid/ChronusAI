import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MessageSquare, BarChart3, LogOut, Menu, X, Sparkles } from 'lucide-react';
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
    <div className="h-screen h-[100dvh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative flex flex-col overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />

      <nav className="relative z-50 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl safe-area-top shrink-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => navigate('/dashboard')} className="flex items-center gap-2 sm:gap-3 min-h-[44px] -ml-1">
              <AnimatedLogo className="h-8 w-8 sm:h-10 sm:w-10" />
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">ChronosAI</span>
            </button>

            <div className="hidden md:flex items-center gap-2 bg-slate-900/50 rounded-full p-1.5 border border-white/5">
              <button onClick={() => navigate('/dashboard')} className="px-5 py-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/50 text-sm font-medium transition-all">
                <BarChart3 className="h-4 w-4 inline mr-2" />
                Dashboard
              </button>
              <button onClick={() => navigate('/chat')} className="px-5 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium shadow-lg shadow-blue-500/20 transition-all">
                <MessageSquare className="h-4 w-4 inline mr-2" />
                Chat
              </button>
              <button onClick={() => navigate('/availability')} className="px-5 py-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/50 text-sm font-medium transition-all">
                <Clock className="h-4 w-4 inline mr-2" />
                Availability
              </button>
              <button onClick={() => navigate('/history')} className="px-5 py-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/50 text-sm font-medium transition-all">
                <Clock className="h-4 w-4 inline mr-2" />
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
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-slate-800/50 border border-white/5 flex items-center justify-center hover:bg-slate-700/50 transition-all">
                {mobileMenuOpen ? <X className="h-5 w-5 text-slate-400" /> : <Menu className="h-5 w-5 text-slate-400" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-2 animate-fade-in">
              <button onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }} className="w-full px-4 py-3.5 min-h-[48px] rounded-xl bg-slate-800/50 text-slate-300 text-sm font-medium flex items-center gap-3 hover:bg-slate-700/50 active:bg-slate-700/50 touch-manipulation">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </button>
              <button onClick={() => { navigate('/chat'); setMobileMenuOpen(false); }} className="w-full px-4 py-3.5 min-h-[48px] rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium flex items-center gap-3">
                <MessageSquare className="h-4 w-4" />
                Chat
              </button>
              <button onClick={() => { navigate('/availability'); setMobileMenuOpen(false); }} className="w-full px-4 py-3.5 min-h-[48px] rounded-xl bg-slate-800/50 text-slate-300 text-sm font-medium flex items-center gap-3 hover:bg-slate-700/50 active:bg-slate-700/50">
                <Clock className="h-4 w-4" />
                Availability
              </button>
              <button onClick={() => { navigate('/history'); setMobileMenuOpen(false); }} className="w-full px-4 py-3.5 min-h-[48px] rounded-xl bg-slate-800/50 text-slate-300 text-sm font-medium flex items-center gap-3 hover:bg-slate-700/50 active:bg-slate-700/50">
                <Clock className="h-4 w-4" />
                History
              </button>
              <button onClick={() => { setShowLogout(true); setMobileMenuOpen(false); }} className="w-full px-4 py-3.5 min-h-[48px] rounded-xl bg-red-500/10 text-red-400 text-sm font-medium flex items-center gap-3 hover:bg-red-500/20 border border-red-500/20">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col min-h-0">
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

