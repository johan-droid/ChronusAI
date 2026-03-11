import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { SendHorizontal, Sparkles, Calendar, Clock, Zap, CheckCheck, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSendMessage } from '../hooks/useSendMessage';
import { useChatStore } from '../store/chatStore';
import ChatMessage from './ChatMessage';
import OptimizedSpinner from './OptimizedSpinner';

// Enhanced quick prompts with categories
const QUICK_PROMPTS = [
  { icon: Calendar, text: "Schedule a meeting tomorrow at 2pm", category: "Schedule" },
  { icon: Clock, text: "Check my availability this week", category: "Availability" },
  { icon: Zap, text: "Reschedule my 3pm meeting to 4pm", category: "Modify" },
  { icon: Sparkles, text: "Show all my meetings for today", category: "View" },
];

// Context-aware AI Smart Suggestions
const getContextualSuggestions = (lastMessage: string): string[] => {
  const msg = lastMessage.toLowerCase();

  if (msg.includes('schedule') || msg.includes('book') || msg.includes('create')) {
    return ["Yes, confirm it", "Add 15 min buffer", "Make it 30 min instead", "Add Zoom link"];
  }
  if (msg.includes('reschedule') || msg.includes('move') || msg.includes('change')) {
    return ["Yes, that works", "Find another slot", "Keep the same duration", "Notify attendees"];
  }
  if (msg.includes('cancel') || msg.includes('delete')) {
    return ["Yes, cancel it", "Just this occurrence", "Reschedule instead", "Notify everyone"];
  }
  if (msg.includes('availability') || msg.includes('free') || msg.includes('when')) {
    return ["Show next week too", "Morning slots only", "Afternoon works", "Any time today"];
  }

  return ["Schedule a meeting", "Check availability", "Show my calendar", "Help me plan"];
};

const StatusBar = memo(({ isOnline }: { isOnline: boolean | null }) => (
  <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-[#0a0a14]/90 backdrop-blur-xl border-b border-white/5 shrink-0 sticky top-0 z-20">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative">
          <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${isOnline === true ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : isOnline === false ? 'bg-rose-400' : 'bg-slate-500'}`} />
          {isOnline === true && <div className="absolute inset-0 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping opacity-30" />}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm sm:text-sm font-semibold text-white">ChronosAI</span>
            <Sparkles className="h-3 w-3 text-blue-400" />
          </div>
          <p className="text-[9px] sm:text-[10px] text-slate-400">
            {isOnline === true ? 'Online • Ready to help' : isOnline === false ? 'Reconnecting...' : 'Connecting...'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-slate-500 bg-white/5 px-2 py-1 rounded-full">
        <CheckCheck className="h-3 w-3 text-blue-400" />
        <span className="hidden sm:inline">AI Powered</span>
        <span className="sm:hidden">AI</span>
      </div>
    </div>
  </div>
));

StatusBar.displayName = 'StatusBar';

// Smart Suggestion Chips with horizontal scroll
const SmartSuggestions = memo(({ onSuggestionClick, suggestions }: {
  onSuggestionClick: (text: string) => void;
  suggestions: string[];
}) => {
  if (!suggestions.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-2 sm:px-3 py-2 bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-t border-white/5"
    >
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x">
        {suggestions.map((suggestion, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSuggestionClick(suggestion)}
            className="flex-shrink-0 snap-start px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 rounded-full text-xs text-slate-300 transition-all active:scale-95 whitespace-nowrap flex items-center gap-1.5 touch-manipulation min-h-[36px] sm:min-h-[40px]"
          >
            <span className="truncate max-w-[120px] sm:max-w-none">{suggestion}</span>
            <ArrowRight className="h-3 w-3 opacity-50 flex-shrink-0" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
});

SmartSuggestions.displayName = 'SmartSuggestions';

// Enhanced Quick Prompt Component
const QuickPrompt = memo(({ prompt, onClick, index }: {
  prompt: typeof QUICK_PROMPTS[0];
  onClick: (text: string) => void;
  index: number;
}) => (
  <motion.button
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    onClick={() => onClick(prompt.text)}
    className="group flex items-center gap-3 p-3 sm:p-3.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-blue-500/30 rounded-2xl transition-all active:scale-[0.98] touch-manipulation text-left w-full"
  >
    <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
      <prompt.icon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{prompt.category}</p>
      <p className="text-sm text-slate-200 group-hover:text-white transition-colors truncate">{prompt.text}</p>
    </div>
  </motion.button>
));

QuickPrompt.displayName = 'QuickPrompt';

// Enhanced Empty State with animated icon
const EmptyState = memo(({ onQuickPrompt }: { onQuickPrompt: (text: string) => void }) => (
  <div className="flex flex-col items-center justify-center h-full px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
    <motion.div
      className="relative"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 blur-3xl opacity-30" />
      <motion.div
        className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl relative"
        animate={{
          boxShadow: ['0 0 20px rgba(59,130,246,0.3)', '0 0 40px rgba(59,130,246,0.5)', '0 0 20px rgba(59,130,246,0.3)']
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
      </motion.div>
    </motion.div>

    <div className="text-center space-y-2">
      <motion.h3
        className="text-lg sm:text-xl font-bold text-white"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        AI Meeting Assistant
      </motion.h3>
      <motion.p
        className="text-xs sm:text-sm text-slate-400 max-w-[200px] sm:max-w-[220px] leading-relaxed"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Schedule, reschedule, or check availability using natural language
      </motion.p>
    </div>

    <motion.div
      className="w-full max-w-xs sm:max-w-sm space-y-2 sm:space-y-2.5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      {QUICK_PROMPTS.map((prompt, i) => (
        <QuickPrompt key={i} prompt={prompt} onClick={onQuickPrompt} index={i} />
      ))}
    </motion.div>
  </div>
));

EmptyState.displayName = 'EmptyState';

// Typing Indicator with animated dots
const TypingIndicator = memo(() => (
  <div className="flex items-center gap-2 px-3 sm:px-4 py-2">
    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
      <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
    </div>
    <div className="bg-white/5 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-1.5 min-w-[50px] sm:min-w-[60px]">
      <motion.span
        className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
      />
      <motion.span
        className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
      />
      <motion.span
        className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
      />
    </div>
  </div>
));

TypingIndicator.displayName = 'TypingIndicator';

export default function ChatWindow() {
  const [message, setMessage] = useState('');
  const [isLlmOnline, setIsLlmOnline] = useState<boolean | null>(null);
  const [isTyping, setIsTyping] = useState(false);
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
      } catch {
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
      setIsTyping(false);
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
    setIsTyping(e.target.value.length > 0);
  }, []);

  // Handle dynamic textarea resizing efficiently
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [message]);

  // Get contextual suggestions based on last AI message
  const suggestions = messages.length > 0 && messages[messages.length - 1]?.role === 'assistant'
    ? getContextualSuggestions(messages[messages.length - 1].content)
    : [];

  return (
    <div className="flex flex-col h-full min-h-0 w-full relative overflow-hidden">
      <StatusBar isOnline={isLlmOnline} />

      {/* Messages Area - Constrained Width */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 sm:px-3 md:px-5 py-3 sm:py-4 md:py-6 space-y-3 sm:space-y-4 md:space-y-5 overscroll-contain bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.05),transparent)]">
        <div className="max-w-3xl mx-auto w-full">
          <AnimatePresence>
            {messages.length === 0 && (
              <EmptyState onQuickPrompt={handleQuickPrompt} />
            )}

            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ChatMessage message={msg} />
              </motion.div>
            ))}

            {isLoading && currentResponse && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <ChatMessage
                  message={{
                    role: 'assistant',
                    content: currentResponse,
                    timestamp: new Date().toISOString()
                  }}
                  isTyping={true}
                />
              </motion.div>
            )}

            {isLoading && !currentResponse && <TypingIndicator />}
          </AnimatePresence>

          <div ref={messagesEndRef} className="h-2" />
        </div>
      </div>

      {/* Smart Suggestions - Context-aware */}
      <AnimatePresence>
        {!isLoading && suggestions.length > 0 && (
          <SmartSuggestions
            onSuggestionClick={handleQuickPrompt}
            suggestions={suggestions}
          />
        )}
      </AnimatePresence>

      {/* Input Area - Premium Glassmorphism Floating Bar */}
      <div className="shrink-0 p-4 sm:p-6 mb-6 bg-transparent relative z-40 pb-safe-area-inset-bottom">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative">
          <div className="flex items-center bg-white/[0.03] backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl focus-within:border-blue-500/50 focus-within:shadow-blue-500/25 transition-all duration-300">
            {/* Text Input */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={message}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Message ChronosAI..."
              className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 text-slate-100 placeholder:text-slate-500 text-base sm:text-base md:text-lg py-3 sm:py-3.5 md:py-4 px-4 sm:px-5 md:px-6 resize-none min-h-[44px] sm:min-h-[48px] md:min-h-[52px] max-h-[120px] font-medium outline-none"
              style={{ scrollbarWidth: 'none' }}
            />
            
            {/* Loading State or Send Button */}
            <div className="flex items-center pr-2 pl-1 min-h-[44px]">
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <OptimizedSpinner size="sm" variant="dots" className="text-blue-400" />
                  <span className="text-xs text-slate-400 hidden sm:inline">AI is thinking...</span>
                </div>
              ) : (
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.95 }}
                  disabled={!message.trim()}
                  className={`p-3 sm:p-3.5 rounded-full transition-all duration-200 min-h-[44px] touch-manipulation ${
                    message.trim()
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-blue-500/30'
                      : 'bg-white/10 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <SendHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
                </motion.button>
              )}
            </div>
          </div>
          
          {/* Helper Text */}
          <div className="flex items-center justify-between mt-2 sm:mt-3 px-2">
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
              {isTyping ? 'Typing...' : 'Press Enter to send • Shift + Enter for new line'}
            </p>
            {isLlmOnline && (
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] sm:text-[11px] text-slate-500">AI Ready</span>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
