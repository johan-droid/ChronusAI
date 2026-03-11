import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatWindow from '../components/ChatWindow';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../lib/api';

export default function Chat() {
  const navigate = useNavigate();

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
      {/* Chat takes all remaining height */}
      <div className="flex-1 min-h-0 w-full flex justify-center z-10">
        <div className="w-full flex flex-col h-full relative">
          <div className="flex-1 min-h-0 w-full relative">
            <ChatWindow />
          </div>
        </div>
      </div>
    </div>
  );
}
