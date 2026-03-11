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
    <div className="flex flex-col h-screen bg-[#F9FAFB] relative overflow-hidden">
      <NavigationBar
        user={user}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        setShowLogout={setShowLogout}
      />

      <main className="flex-1 relative z-10 w-full flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 bg-white relative overflow-hidden">
          {/* Header Area - Clean SaaS Style */}
          <div className="px-6 py-4 border-b border-gray-200 bg-white shrink-0">
            <div className="flex items-center gap-3 max-w-4xl mx-auto">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">ChronosAI Assistant</h2>
                <p className="text-xs text-gray-500">AI-powered meeting scheduling</p>
              </div>
            </div>
          </div>

          {/* Chat Window Container - Constrained Width */}
          <div className="flex-1 flex flex-col min-h-0 relative max-w-4xl mx-auto w-full">
            <ChatWindow />
          </div>
        </div>
      </main>

      <LogoutMenu isOpen={showLogout} onClose={() => setShowLogout(false)} />
    </div >
  );
}

