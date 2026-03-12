import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Zap } from 'lucide-react';
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
    <div className="flex flex-col h-[calc(100dvh-var(--nav-height,64px))] w-full overflow-hidden relative bg-[#09090B]">
      {/* Subtle ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-indigo-500/[0.03] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[200px] bg-purple-500/[0.02] rounded-full blur-[100px]" />
      </div>

      {/* Chat container */}
      <div className="flex-1 min-h-0 w-full flex justify-center relative z-10">
        <div className="w-full max-w-4xl flex flex-col h-full relative">
          
          {/* Header strip — polished, minimal */}
          <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-2.5 border-b border-white/[0.04] bg-[rgba(9,9,11,0.5)] backdrop-blur-xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/25 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                <Bot className="h-4 w-4 text-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white/90 tracking-tight">ChronosAI</span>
                  <span className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    isLlmOnline === true 
                      ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]' 
                      : isLlmOnline === false 
                      ? 'bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.4)]' 
                      : 'bg-slate-500 animate-pulse'
                  }`} />
                </div>
                <span className="text-[10px] text-white/30 font-medium">
                  {isLlmOnline === true ? 'Ready to assist' : isLlmOnline === false ? 'Reconnecting...' : 'Connecting...'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <Zap className="h-3 w-3 text-amber-400/50" />
              <span className="text-[10px] text-white/25 font-semibold tracking-wider uppercase">AI</span>
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