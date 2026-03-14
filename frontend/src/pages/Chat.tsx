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
    <div className="flex flex-col h-[calc(100dvh-var(--nav-height,64px))] w-full overflow-hidden relative bg-[#050812]">
      {/* Subtle ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(56,189,248,0.08),rgba(5,8,18,0)_58%)]" />
        <div className="absolute top-0 left-[8%] w-[340px] h-[240px] bg-cyan-500/[0.05] rounded-full blur-[110px]" />
        <div className="absolute bottom-[4%] right-[7%] w-[320px] h-[220px] bg-amber-500/[0.05] rounded-full blur-[110px]" />
      </div>

      {/* Chat container */}
      <div className="flex-1 min-h-0 w-full flex justify-center relative z-10">
        <div className="w-full max-w-5xl flex flex-col h-full relative">

          {/* Header strip */}
          <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200/5 bg-[rgba(6,10,20,0.75)] backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500/20 to-cyan-400/20 border border-sky-300/20 flex items-center justify-center shadow-[0_10px_28px_rgba(56,189,248,0.14)]">
                <Bot className="h-4 w-4 text-sky-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-100 tracking-tight">ChronosAI</span>
                  <span className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    isLlmOnline === true
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                      : isLlmOnline === false
                      ? 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.45)]'
                      : 'bg-slate-500 animate-pulse'
                  }`} />
                </div>
                <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                  {isLlmOnline === true ? 'Scheduler assistant online' : isLlmOnline === false ? 'Reconnecting model service' : 'Connecting model service'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-200/10">
              <Zap className="h-3 w-3 text-amber-300/80" />
              <span className="text-[10px] text-slate-300/70 font-semibold tracking-wider uppercase">LLM</span>
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