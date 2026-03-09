import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import NavigationBar from '../components/NavigationBar';
import ChatWindow from '../components/ChatWindow';
import LogoutMenu from '../components/LogoutMenu';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../lib/api';

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
    <div className="flex flex-col h-[100dvh] max-h-[100dvh] bg-[#050510] relative overflow-hidden">
      <div className="page-bg" />
      <div className="page-grid-overlay" />

      <NavigationBar
        user={user}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        setShowLogout={setShowLogout}
      />


      <main className="flex-1 relative z-10 w-full flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900/10 backdrop-blur-2xl border-x border-white/5 shadow-3xl overflow-hidden relative">
          {/* Header Area - Slimmer & Immersive */}
          <div className="hidden sm:block px-6 py-2 border-b border-white/5 bg-slate-900/40 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <h2 className="text-[11px] font-bold text-white uppercase tracking-wider opacity-60">Immersive Mode</h2>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-white">ChronosAI Assistant</h2>
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                </div>
              </div>
            </div>
          </div>

          {/* Chat Window Container - Fully expanded */}
          <div className="flex-1 flex flex-col min-h-0 relative">
            <ChatWindow />
          </div>
        </div>
      </main>

      <LogoutMenu isOpen={showLogout} onClose={() => setShowLogout(false)} />
    </div >
  );
}

