import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { Send, Loader2, Sparkles, Calendar, Clock, Zap, Mic, Paperclip, Smile, Check, CheckCheck } from 'lucide-react';
import { useSendMessage } from '../hooks/useSendMessage';
import { useChatStore } from '../store/chatStore';
import ChatMessage from './ChatMessage';

// Enhanced quick prompts with categories
const QUICK_PROMPTS = [
  { icon: Calendar, text: "Schedule a meeting tomorrow at 2pm", category: "Schedule" },
  { icon: Clock, text: "Check my availability this week", category: "Availability" },
  { icon: Zap, text: "Reschedule my 3pm meeting to 4pm", category: "Modify" },
  { icon: Sparkles, text: "Show all my meetings for today", category: "View" },
];

// AI Smart Suggestions based on context
const AI_SUGGESTIONS = [
  "Yes, that works for me",
  "Can we reschedule?",
  "Add 15 min buffer",
  "Send invite to team",
  "Book a Zoom room",
];

const StatusBar = memo(({ isOnline }: { isOnline: boolean | null }) => (
  <div className="px-4 py-3 bg-[#0a0a14]/90 backdrop-blur-xl border-b border-white/5 shrink-0 sticky top-0 z-20">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${isOnline === true ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : isOnline === false ? 'bg-rose-400' : 'bg-slate-500'}`} />
          {isOnline === true && <div className="absolute inset-0 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping opacity-30" />}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-white">ChronosAI</span>
            <Sparkles className="h-3 w-3 text-blue-400" />
          </div>
          <p className="text-[10px] text-slate-400">
            {isOnline === true ? 'Online • Ready to help' : isOnline === false ? 'Reconnecting...' : 'Connecting...'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-white/5 px-2 py-1 rounded-full">
        <CheckCheck className="h-3 w-3 text-blue-400" />
        <span>AI Powered</span>
      </div>
    </div>
  </div>
));

StatusBar.displayName = 'StatusBar';

// Smart Suggestion Chips
const SmartSuggestions = memo(({ onSuggestionClick, isVisible }: { 
  onSuggestionClick: (text: string) => void;
  isVisible: boolean;
}) => {
  if (!isVisible) return null;
  
  return (
    <div className="px-4 py-2 bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-t border-white/5">
      <p className="text-[10px] text-slate-500 mb-2 font-medium">Quick replies</p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {AI_SUGGESTIONS.map((suggestion, i) => (
          <button
            key={i}
            onClick={() => onSuggestionClick(suggestion)}
            className="flex-shrink-0 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 rounded-full text-xs text-slate-300 transition-all active:scale-95 whitespace-nowrap"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
});

SmartSuggestions.displayName = 'SmartSuggestions';

// Enhanced Quick Prompt Component
const QuickPrompt = memo(({ prompt, onClick }: {
  prompt: typeof QUICK_PROMPTS[0];
  onClick: (text: string) => void;
}) => (
  <button
    onClick={() => onClick(prompt.text)}
    className="group flex items-center gap-3 p-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-blue-500/30 rounded-xl transition-all active:scale-[0.98] touch-manipulation"
  >
    <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
      <prompt.icon className="h-5 w-5 text-blue-400" />
    </div>
    <div className="flex-1 text-left">
      <p className="text-xs text-slate-500 mb-0.5">{prompt.category}</p>
      <p className="text-sm text-slate-200 group-hover:text-white transition-colors">{prompt.text}</p>
    </div>
  </button>
));

QuickPrompt.displayName = 'QuickPrompt';

// Enhanced Empty State
const EmptyState = memo(({ onQuickPrompt }: { onQuickPrompt: (text: string) => void }) => (
  <div className="flex flex-col items-center justify-center h-full px-6 py-8 space-y-6">
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 blur-2xl opacity-20" />
      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl relative">
        <Sparkles className="h-8 w-8 text-white" />
      </div>
    </div>
    
    <div className="text-center space-y-1">
      <h3 className="text-lg font-semibold text-white">AI Meeting Assistant</h3>
      <p className="text-xs text-slate-400 max-w-[200px]">
        Schedule, reschedule, or check availability using natural language
      </p>
    </div>
    
    <div className="w-full space-y-2">
      {QUICK_PROMPTS.map((prompt, i) => (
        <QuickPrompt key={i} prompt={prompt} onClick={onQuickPrompt} />
      ))}
    </div>
  </div>
));

EmptyState.displayName = 'EmptyState';

// Typing Indicator
const TypingIndicator = memo(() => (
  <div className="flex items-center gap-2 px-4 py-2">
    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
      <Sparkles className="h-4 w-4 text-white" />
    </div>
    <div className="bg-white/5 rounded-2xl px-4 py-3 flex items-center gap-1">
      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  </div>
));

TypingIndicator.displayName = 'TypingIndicator';

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
    <div className="flex flex-col h-full min-h-0 w-full relative bg-[#050510] sm:rounded-[2.5rem] overflow-hidden border border-white/5 shadow-3xl">
      <StatusBar isOnline={isLlmOnline} />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6 overscroll-contain bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.05),transparent)]">
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

        {isLoading && !currentResponse && <TypingIndicator />}

        <div ref={messagesEndRef} className="h-2 sm:h-4" />
      </div>

      {/* Smart Suggestions - shown after AI response */}
      <SmartSuggestions 
        onSuggestionClick={handleQuickPrompt} 
        isVisible={!isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'assistant'} 
      />

      {/* Input Area - WhatsApp Style */}
      <div className="shrink-0 p-3 sm:p-4 bg-[#0a0a14]/90 backdrop-blur-xl border-t border-white/5 relative z-40">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-end gap-2 sm:gap-3">
          {/* Input Container */}
          <div className="flex-1 relative bg-white/[0.05] rounded-3xl border border-white/10 focus-within:border-blue-500/50 focus-within:bg-white/[0.08] transition-all">
            <div className="flex items-end">
              {/* Left Actions */}
              <button
                type="button"
                className="p-2 sm:p-3 text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
              >
                <Paperclip className="h-5 w-5" />
              </button>
              
              {/* Text Input */}
              <textarea
                ref={textareaRef}
                rows={1}
                value={message}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Message ChronosAI..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-100 placeholder:text-slate-500 text-sm sm:text-base py-3 px-2 resize-none min-h-[48px] max-h-[120px] font-medium"
                style={{ scrollbarWidth: 'none' }}
              />
              
              {/* Right Actions */}
              <div className="flex items-center gap-1 pr-2 flex-shrink-0">
                <button
                  type="button"
                  className="p-2 sm:p-3 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <Smile className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  className="p-2 sm:p-3 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <Mic className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Send Button */}
          <button
            type="submit"
            disabled={!message.trim() || isLoading}
            className={`p-3 sm:p-4 rounded-full transition-all duration-200 flex-shrink-0 ${
              message.trim() && !isLoading
                ? 'bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/20'
                : 'bg-white/5 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
            ) : (
              <Send className="h-5 w-5 sm:h-6 sm:w-6" />
            )}
          </button>
        </form>
        
        {/* Helper Text */}
        <p className="text-center text-[9px] sm:text-[10px] text-slate-600 mt-2 font-medium uppercase tracking-wider">
          Press Enter to send • Shift + Enter for new line
        </p>
      </div>
    </div>
  );
}
