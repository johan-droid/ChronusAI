import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { Send, Loader2, Sparkles, Calendar, Clock, Activity } from 'lucide-react';
import { useSendMessage } from '../hooks/useSendMessage';
import { useChatStore } from '../store/chatStore';
import ChatMessage from './ChatMessage';

const QUICK_PROMPTS = [
  { icon: Calendar, text: "Schedule a meeting tomorrow at 2pm" },
  { icon: Clock, text: "Check my availability this week" },
  { icon: Sparkles, text: "Reschedule my 3pm meeting to 4pm" },
];

const StatusBar = memo(({ isOnline }: { isOnline: boolean | null }) => (
  <div className="px-6 py-4 bg-black/40 backdrop-blur-2xl border-b border-white/5 shrink-0 relative z-30 shadow-2xl">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="relative flex items-center justify-center">
          <div className={`w-3 h-3 rounded-full transition-colors duration-500 shadow-[0_0_10px_rgba(0,0,0,0.5)] ${isOnline === true ? 'bg-emerald-400 shadow-emerald-400/20' : isOnline === false ? 'bg-rose-400 shadow-rose-400/20' : 'bg-slate-600'}`} />
          {isOnline === true && <div className="absolute inset-0 w-3 h-3 bg-emerald-400 rounded-full animate-ping opacity-40" />}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Sparkles className="h-4 w-4 text-blue-400 animate-pulse-slow" />
            <span className="text-base font-black text-white tracking-tight">ChronosAI</span>
          </div>
          <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
            {isOnline === true ? 'System Online • Neural Link Active' : isOnline === false ? 'System Offline • Reconnecting' : 'Initializing Neural Link...'}
          </p>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-blue-500/5 border border-blue-500/10">
        <Activity className="h-3.5 w-3.5 text-blue-400" />
        <span className="text-[10px] font-black text-blue-400 tracking-tighter uppercase">Protocol v2.4</span>
      </div>
    </div>
  </div>
));

StatusBar.displayName = 'StatusBar';

// Memoized Quick Prompt Component
const QuickPrompt = memo(({ prompt, onClick }: {
  prompt: typeof QUICK_PROMPTS[0];
  onClick: (text: string) => void;
}) => (
  <button
    onClick={() => onClick(prompt.text)}
    className="glass-card rounded-2xl p-4 text-left hover:bg-slate-700/50 hover:border-blue-500/30 smooth-transition group hover-lift animate-scale-in min-h-[56px] active:scale-[0.98] touch-manipulation"
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 smooth-transition">
        <prompt.icon className="h-5 w-5 text-blue-400" />
      </div>
      <span className="text-sm text-slate-200 group-hover:text-white smooth-transition">{prompt.text}</span>
    </div>
  </button>
));

QuickPrompt.displayName = 'QuickPrompt';

// Memoized Empty State Component
const EmptyState = memo(({ onQuickPrompt }: { onQuickPrompt: (text: string) => void }) => (
  <div className="flex flex-col items-center justify-center h-full space-y-6 animate-fade-in">
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 blur-3xl opacity-20 animate-pulse" />
      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl relative z-10 animate-float-gentle">
        <Sparkles className="h-10 w-10 text-white" />
      </div>
    </div>
    <div className="text-center space-y-2">
      <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-slide-up">
        AI Meeting Assistant
      </h3>
      <p className="text-sm text-slate-400 max-w-md animate-slide-up" style={{ animationDelay: '0.1s' }}>
        Schedule, reschedule, or check availability using natural language
      </p>
    </div>
    <div className="grid grid-cols-1 gap-2 sm:gap-3 w-full max-w-lg px-1">
      {QUICK_PROMPTS.map((prompt, i) => (
        <div key={i} style={{ animationDelay: `${0.2 + i * 0.1}s` }}>
          <QuickPrompt prompt={prompt} onClick={onQuickPrompt} />
        </div>
      ))}
    </div>
  </div>
));

EmptyState.displayName = 'EmptyState';

// Memoized Loading Component
const LoadingIndicator = memo(() => (
  <div className="flex items-center gap-2 animate-slide-up">
    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
      <Loader2 className="h-5 w-5 text-white animate-spin" />
    </div>
    <div className="glass-card rounded-3xl px-4 py-3 shadow-lg">
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-xs text-slate-400">Thinking...</span>
      </div>
    </div>
  </div>
));

LoadingIndicator.displayName = 'LoadingIndicator';

export default function ChatWindow() {
  const [message, setMessage] = useState('');
  const [isLlmOnline, setIsLlmOnline] = useState<boolean | null>(null);
  const { messages, isLoading, currentResponse } = useChatStore();
  const sendMessage = useSendMessage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Poll LLM status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/health/llm`);
        const data = await response.json();
        setIsLlmOnline(data.status === 'online');
      } catch (err) {
        setIsLlmOnline(false);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentResponse, scrollToBottom]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      sendMessage.mutate({ message: message.trim() });
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [message, isLoading, sendMessage]);

  const handleQuickPrompt = useCallback((text: string) => {
    if (!isLoading) {
      sendMessage.mutate({ message: text });
    }
  }, [isLoading, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const isMobile = window.innerWidth < 768;
      if (!isMobile) {
        e.preventDefault();
        handleSubmit(e);
      }
    }
  }, [handleSubmit]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0 w-full relative bg-[#050510] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-3xl">
      <StatusBar isOnline={isLlmOnline} />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-8 space-y-8 overscroll-contain bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.05),transparent)]">
        {messages.length === 0 && (
          <EmptyState onQuickPrompt={handleQuickPrompt} />
        )}

        {messages.map((msg, index) => (
          <div key={index} className="animate-fade-in">
            <ChatMessage message={msg} />
          </div>
        ))}

        {isLoading && currentResponse && (
          <div className="animate-fade-in">
            <ChatMessage
              message={{
                role: 'assistant',
                content: currentResponse,
                timestamp: new Date().toISOString()
              }}
              isTyping={true}
            />
          </div>
        )}

        {isLoading && !currentResponse && <LoadingIndicator />}

        <div ref={messagesEndRef} className="h-4 sm:h-8" />
      </div>

      {/* Input Area */}
      <div className="shrink-0 p-5 sm:p-8 bg-black/40 backdrop-blur-2xl border-t border-white/5 relative z-40 shadow-[0_-20px_40px_rgba(0,0,0,0.4)]">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-end gap-3 sm:gap-4">
          <div className="flex-1 relative group bg-white/[0.03] rounded-[2rem] border border-white/10 focus-within:border-blue-500/50 focus-within:bg-white/[0.05] transition-all hover:border-white/20">
            <textarea
              ref={textareaRef}
              rows={1}
              value={message}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Message ChronosAI..."
              className="w-full bg-transparent border-none focus:ring-0 text-slate-100 placeholder:text-slate-500 text-base py-4 pl-6 pr-14 resize-none min-h-[56px] font-medium"
            />
            <div className="absolute right-4 bottom-2.5">
              <div className={`p-2 rounded-full transition-all ${message.trim() ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-slate-500 opacity-50'}`}>
                <Send className={`h-5 w-5 ${message.trim() ? 'scale-100' : 'scale-90 hover:scale-95'}`} />
              </div>
            </div>
          </div>
        </form>
        <p className="text-center text-[10px] text-slate-600 mt-4 font-bold uppercase tracking-widest">
          ChronosAI can assist with scheduling, availability, and more.
        </p>
      </div>
    </div>
  );
}
