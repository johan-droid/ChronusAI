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
    <div className="flex flex-col h-screen max-h-screen bg-[#050510] relative overflow-hidden">
      <div className="page-bg" />
      <div className="page-grid-overlay" />

      <NavigationBar
        user={user}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        setShowLogout={setShowLogout}
      />


      <main className="flex-1 relative z-10 w-full max-w-5xl mx-auto flex flex-col min-h-0 overflow-hidden sm:px-4 sm:py-4">
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900/40 backdrop-blur-2xl sm:rounded-3xl sm:border sm:border-white/10 shadow-3xl overflow-hidden relative -mt-[1px]">
          {/* Header Area - Mobile optimized */}
          <div className="px-4 py-2 sm:py-3 border-b border-white/5 bg-slate-900/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">AI Meeting Assistant</h2>
                <p className="text-[10px] text-slate-400 hidden sm:block">Schedule meetings with natural language</p>
              </div>
            </div>
          </div>

          {/* Chat Window Container - flex-1 ensures it fills the space */}
          <div className="flex-1 flex flex-col min-h-0 relative">
            <ChatWindow />
          </div>
        </div>
      </main>

      <LogoutMenu isOpen={showLogout} onClose={() => setShowLogout(false)} />
    </div >
  );
}

