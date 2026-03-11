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
    <div className="flex flex-col h-[100dvh] w-full bg-[#1a1915] overflow-hidden relative">

      {/* Navigation */}
      <NavigationBar
        user={user}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        setShowLogout={setShowLogout}
      />

      {/* Chat takes all remaining height */}
      <main className="flex-1 min-h-0 w-full flex justify-center z-10">
        <div className="w-full flex flex-col h-full relative">
          <div className="flex-1 min-h-0 w-full relative">
            <ChatWindow />
          </div>
        </div>
      </main>

      <LogoutMenu isOpen={showLogout} onClose={() => setShowLogout(false)} />
    </div>
  );
}
