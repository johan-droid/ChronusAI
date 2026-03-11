import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className="flex flex-col h-[100dvh] w-full bg-[#09090B] overflow-hidden relative">

      {/* Ambient background blobs */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
        <div className="absolute bottom-0 right-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-6000" />
      </div>

      <div className="page-bg pointer-events-none" />
      <div className="page-grid-overlay pointer-events-none" />

      {/* Navigation */}
      <NavigationBar
        user={user}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        setShowLogout={setShowLogout}
      />

      {/* Chat takes all remaining height — no duplicate header */}
      <main className="flex-1 min-h-0 w-full flex justify-center bg-transparent z-10">
        <div className="w-full max-w-5xl flex flex-col h-full bg-[#0a0a14]/40 backdrop-blur-md border-x border-white/[0.04] shadow-2xl relative">
          <div className="flex-1 min-h-0 w-full relative">
            <ChatWindow />
          </div>
        </div>
      </main>

      <LogoutMenu isOpen={showLogout} onClose={() => setShowLogout(false)} />
    </div>
  );
}
