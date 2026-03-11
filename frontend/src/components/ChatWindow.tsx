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
      className="px-4 py-3 bg-gray-50 border-t border-gray-200"
    >
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {suggestions.map((suggestion, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSuggestionClick(suggestion)}
              className="flex-shrink-0 px-3 py-2 bg-card border border-border hover:border-primary hover:bg-card rounded-lg text-xs text-muted-foreground hover:text-primary transition-all active:scale-95 whitespace-nowrap flex items-center gap-1.5 touch-manipulation min-h-[32px]"
            >
              <span className="truncate max-w-[120px]">{suggestion}</span>
              <ArrowRight className="h-3 w-3 text-gray-400" />
            </motion.button>
          ))}
        </div>
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
    className="group flex items-center gap-3 p-4 bg-card border border-border hover:border-primary hover:bg-card rounded-xl transition-all active:scale-[0.98] touch-manipulation text-left w-full"
  >
    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
      <prompt.icon className="h-5 w-5 text-primary" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{prompt.category}</p>
      <p className="text-sm text-foreground group-hover:text-primary transition-colors">{prompt.text}</p>
    </div>
  </motion.button>
));

QuickPrompt.displayName = 'QuickPrompt';

// Enhanced Empty State with clean design
const EmptyState = memo(({ onQuickPrompt }: { onQuickPrompt: (text: string) => void }) => (
  <div className="flex flex-col items-center justify-center h-full px-4 py-8 space-y-6">
    <motion.div
      className="relative"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
        <Sparkles className="h-8 w-8 text-primary-foreground" />
      </div>
    </motion.div>

    <div className="text-center space-y-3">
      <motion.h3
        className="text-xl font-semibold text-foreground"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        AI Meeting Assistant
      </motion.h3>
      <motion.p
        className="text-sm text-muted-foreground max-w-md leading-relaxed"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Schedule, reschedule, or check availability using natural language
      </motion.p>
    </div>

    <motion.div
      className="w-full max-w-lg space-y-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      {QUICK_PROMPTS.slice(0, 3).map((prompt, i) => (
        <QuickPrompt key={i} prompt={prompt} onClick={onQuickPrompt} index={i} />
      ))}
    </motion.div>
  </div>
));

EmptyState.displayName = 'EmptyState';

// Typing Indicator with animated dots
const TypingIndicator = memo(() => (
  <div className="flex items-center gap-3 px-4 py-4">
    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
      <Sparkles className="h-4 w-4 text-primary-foreground" />
    </div>
    <div className="bg-muted rounded-xl px-4 py-3 flex items-center gap-2">
      <motion.span
        className="w-2 h-2 bg-muted-foreground rounded-full"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
      />
      <motion.span
        className="w-2 h-2 bg-muted-foreground rounded-full"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
      />
      <motion.span
        className="w-2 h-2 bg-muted-foreground rounded-full"
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
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [message]);

  // Get contextual suggestions based on last AI message
  const suggestions = messages.length > 0 && messages[messages.length - 1]?.role === 'assistant'
    ? getContextualSuggestions(messages[messages.length - 1].content)
    : [];

  return (
    <div className="flex flex-col h-full min-h-0 w-full relative overflow-hidden bg-white">
      {/* Messages Area - Clean White Background */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 space-y-1 overscroll-contain">
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

      {/* Smart Suggestions - Context-aware */}
      <AnimatePresence>
        {!isLoading && suggestions.length > 0 && (
          <SmartSuggestions
            onSuggestionClick={handleQuickPrompt}
            suggestions={suggestions}
          />
        )}
      </AnimatePresence>

      {/* Input Area - Fixed at Bottom with Gradient Fade */}
      <div className="shrink-0 relative">
        {/* Gradient Fade Above Input */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-transparent to-card pointer-events-none z-10" />
        
        <div className="bg-card border-t border-border px-4 py-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto relative">
            <div className="flex items-end gap-3 bg-card border border-border rounded-2xl shadow-sm focus-within:border-primary focus-within:shadow-md transition-all duration-200">
              {/* Text Input */}
              <textarea
                ref={textareaRef}
                rows={1}
                value={message}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Message ChronosAI..."
                className="flex-1 bg-transparent border-0 outline-none resize-none text-base leading-relaxed text-foreground placeholder-muted-foreground"
                style={{ scrollbarWidth: 'none' }}
              />
              
              {/* Send Button */}
              <div className="flex items-center pr-2 pb-1">
                {isLoading ? (
                  <div className="flex items-center gap-2 px-2">
                    <OptimizedSpinner size="sm" variant="dots" className="text-primary" />
                    <span className="text-xs text-muted-foreground hidden sm:inline">ChronosAI is thinking...</span>
                  </div>
                ) : (
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.95 }}
                    disabled={!message.trim()}
                    className={`p-2 rounded-lg transition-all duration-200 min-h-[32px] touch-manipulation ${
                      message.trim()
                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                        : 'bg-card/10 text-muted-foreground cursor-not-allowed'
                    }`}
                  >
                    <SendHorizontal className="h-4 w-4" />
                  </motion.button>
                )}
              </div>
            </div>
            
            {/* Helper Text */}
            <div className="flex items-center justify-between mt-2 px-2">
              <p className="text-xs text-gray-500">
                {isTyping ? 'Typing...' : 'Press Enter to send • Shift + Enter for new line'}
              </p>
              {isLlmOnline && (
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-xs text-gray-500">AI Ready</span>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
