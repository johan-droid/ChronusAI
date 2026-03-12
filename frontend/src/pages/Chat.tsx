import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Bot } from 'lucide-react';
import ChatWindow from '../components/ChatWindow';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../lib/api';
import { useLlmStatus } from '../hooks/useUserSession';

export default function Chat() {
  const navigate = useNavigate();
  const { isLlmOnline } = useLlmStatus();

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
    <div className="flex flex-col h-[calc(100dvh-72px)] w-full overflow-hidden relative">
      {/* Chat container */}
      <div className="flex-1 min-h-0 w-full flex justify-center relative z-10">
        <div className="w-full max-w-4xl flex flex-col h-full relative">
          
          {/* Subtle header strip */}
          <div className="shrink-0 hidden sm:flex items-center justify-between px-6 py-2.5 border-b border-white/[0.04]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500/15 to-purple-500/15 border border-indigo-500/20 flex items-center justify-center">
                <Bot className="h-3.5 w-3.5 text-indigo-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-white/80">ChronosAI</span>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  isLlmOnline === true 
                    ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]' 
                    : isLlmOnline === false 
                    ? 'bg-rose-400' 
                    : 'bg-slate-500 animate-pulse'
                }`} />
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-amber-400/40" />
              <span className="text-[10px] text-white/25 font-medium tracking-wide uppercase">AI-Powered</span>
            </div>
          </div>

          {/* Chat Window fills the rest */}
          <div className="flex-1 min-h-0 w-full">
            <ChatWindow />
          </div>
        </div>
      </div>
    </div>
  );
}