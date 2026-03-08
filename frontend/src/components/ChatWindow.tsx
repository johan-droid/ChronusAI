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

const StatusBar = memo(() => (
  <div className="px-3 sm:px-4 py-2.5 sm:py-3 glass border-b border-white/5 animate-slide-down shrink-0">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
          <div className="absolute inset-0 w-2.5 h-2.5 bg-green-400 rounded-full animate-ping" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-400 animate-bounce-gentle" />
            <span className="text-sm font-semibold text-white">ChronusAI</span>
          </div>
          <p className="text-[10px] text-slate-400">Online • Ready to assist</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-slate-400">
        <Activity className="h-3 w-3" />
        <span>AI-Powered</span>
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
  const { messages, isLoading, currentResponse } = useChatStore();
  const sendMessage = useSendMessage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  }, []);

  return (
    <div className="flex flex-col h-full">
      <StatusBar />

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-3 overscroll-contain">
        {messages.length === 0 && (
          <EmptyState onQuickPrompt={handleQuickPrompt} />
        )}
        
        {messages.map((msg, index) => (
          <div key={index} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
            <ChatMessage message={msg} />
          </div>
        ))}
        
        {isLoading && currentResponse && (
          <div className="animate-slide-up">
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
        
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="border-t border-white/5 p-3 sm:p-4 glass animate-slide-up shrink-0 pb-[env(safe-area-inset-bottom)]">
        <div className="flex gap-2 sm:gap-3">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Schedule, reschedule, or check availability..."
            className="flex-1 min-h-[48px] max-h-[120px] px-3 sm:px-4 py-3 glass-card rounded-xl sm:rounded-2xl text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 smooth-transition"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!message.trim() || isLoading}
            className="w-12 h-12 min-w-[48px] min-h-[48px] bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl sm:rounded-2xl hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105 smooth-transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center flex-shrink-0 animate-glow-pulse touch-manipulation active:scale-95"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
