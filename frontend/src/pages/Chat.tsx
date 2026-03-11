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
    // The master container: strictly 100dvh, flex-col, hidden overflow
    <div className="flex flex-col h-[100dvh] w-full bg-[#09090B] overflow-hidden relative">
      
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        <div className="absolute bottom-0 right-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-6000"></div>
      </div>
      
      <div className="page-bg pointer-events-none" />
      <div className="page-grid-overlay pointer-events-none" />

      {/* Nav is inherently shrink-0 */}
      <NavigationBar
        user={user}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        setShowLogout={setShowLogout}
      />

      {/* Main Content Area: Takes up remaining height, passes it down */}
      <main className="flex-1 min-h-0 w-full flex justify-center bg-transparent z-10">
        <div className="w-full max-w-5xl flex flex-col h-full bg-slate-900/10 backdrop-blur-md border-x border-white/5 shadow-2xl relative">
          
          {/* Header Area - Locked at top */}
          <div className="shrink-0 hidden sm:block px-6 py-3 border-b border-white/5 bg-slate-900/40">
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

          {/* Chat Window fills the rest */}
          <div className="flex-1 min-h-0 w-full relative">
            <ChatWindow />
          </div>

        </div>
      </main>

      <LogoutMenu isOpen={showLogout} onClose={() => setShowLogout(false)} />
    </div>
  );
}
