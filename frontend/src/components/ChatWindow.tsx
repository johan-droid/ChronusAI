import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { Send, Loader2, Sparkles, Calendar, Clock, Zap, Mic, Paperclip, Plus, Smile, CheckCheck, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
      className="px-3 py-2 bg-gradient-to-r from-blue-500/5 to-purple-500/5 border-t border-white/5"
    >
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x">
        {suggestions.map((suggestion, i) => (
          <motion.button
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSuggestionClick(suggestion)}
            className="flex-shrink-0 snap-start px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 rounded-full text-xs text-slate-300 transition-all active:scale-95 whitespace-nowrap flex items-center gap-1.5"
          >
            <span>{suggestion}</span>
            <ArrowRight className="h-3 w-3 opacity-50" />
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
    className="group flex items-center gap-3 p-3.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-blue-500/30 rounded-2xl transition-all active:scale-[0.98] touch-manipulation text-left w-full"
  >
    <div className="w-11 h-11 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
      <prompt.icon className="h-5 w-5 text-blue-400" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{prompt.category}</p>
      <p className="text-sm text-slate-200 group-hover:text-white transition-colors truncate">{prompt.text}</p>
    </div>
  </motion.button>
));

QuickPrompt.displayName = 'QuickPrompt';

// Enhanced Empty State with animated icon
const EmptyState = memo(({ onQuickPrompt }: { onQuickPrompt: (text: string) => void }) => (
  <div className="flex flex-col items-center justify-center h-full px-4 py-6 space-y-6">
    <motion.div 
      className="relative"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 blur-3xl opacity-30" />
      <motion.div 
        className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl relative"
        animate={{ 
          boxShadow: ['0 0 20px rgba(59,130,246,0.3)', '0 0 40px rgba(59,130,246,0.5)', '0 0 20px rgba(59,130,246,0.3)']
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Sparkles className="h-10 w-10 text-white" />
      </motion.div>
    </motion.div>
    
    <div className="text-center space-y-2">
      <motion.h3 
        className="text-xl font-bold text-white"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        AI Meeting Assistant
      </motion.h3>
      <motion.p 
        className="text-sm text-slate-400 max-w-[220px] leading-relaxed"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        Schedule, reschedule, or check availability using natural language
      </motion.p>
    </div>
    
    <motion.div 
      className="w-full max-w-sm space-y-2.5"
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
  <div className="flex items-center gap-2 px-4 py-2">
    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
      <Sparkles className="h-4 w-4 text-white" />
    </div>
    <div className="bg-white/5 rounded-2xl px-4 py-3 flex items-center gap-1.5 min-w-[60px]">
      <motion.span 
        className="w-2 h-2 bg-blue-400 rounded-full"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
      />
      <motion.span 
        className="w-2 h-2 bg-blue-400 rounded-full"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
      />
      <motion.span 
        className="w-2 h-2 bg-blue-400 rounded-full"
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
  const [showActions, setShowActions] = useState(false);
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
      setShowActions(false);
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

  // Get contextual suggestions based on last AI message
  const suggestions = messages.length > 0 && messages[messages.length - 1]?.role === 'assistant'
    ? getContextualSuggestions(messages[messages.length - 1].content)
    : [];

  return (
    <div className="flex flex-col h-full min-h-0 w-full relative bg-[#050510] sm:rounded-[2.5rem] overflow-hidden border border-white/5 shadow-3xl">
      <StatusBar isOnline={isLlmOnline} />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-5 py-4 sm:py-6 space-y-3 sm:space-y-5 overscroll-contain bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.05),transparent)]">
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

      {/* Input Area - Enhanced WhatsApp Style */}
      <div className="shrink-0 p-2.5 sm:p-4 bg-[#0a0a14]/95 backdrop-blur-xl border-t border-white/5 relative z-40">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-end gap-2">
          {/* Plus Button for Actions */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowActions(!showActions)}
            className={`p-3 rounded-full transition-all flex-shrink-0 ${showActions ? 'bg-blue-500 text-white rotate-45' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
          >
            <Plus className="h-5 w-5" />
          </motion.button>

          {/* Input Container */}
          <div className="flex-1 relative bg-white/[0.05] rounded-3xl border border-white/10 focus-within:border-blue-500/50 focus-within:bg-white/[0.08] transition-all">
            <div className="flex items-end">
              {/* Emoji Button */}
              <button
                type="button"
                className="p-2.5 sm:p-3 text-slate-400 hover:text-slate-200 transition-colors flex-shrink-0"
              >
                <Smile className="h-5 w-5" />
              </button>
              
              {/* Text Input */}
              <textarea
                ref={textareaRef}
                rows={1}
                value={message}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Message ChronosAI..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-slate-100 placeholder:text-slate-500 text-sm sm:text-base py-2.5 px-1 resize-none min-h-[44px] max-h-[120px] font-medium"
                style={{ scrollbarWidth: 'none' }}
              />
              
              {/* Attachment & Voice - Hidden when typing */}
              <AnimatePresence>
                {!message.trim() && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1 pr-2 flex-shrink-0"
                  >
                    <button
                      type="button"
                      className="p-2.5 sm:p-3 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      className="p-2.5 sm:p-3 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      <Mic className="h-5 w-5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {/* Send/Voice Button */}
          <motion.button
            type="submit"
            whileTap={{ scale: 0.9 }}
            disabled={!message.trim() || isLoading}
            className={`p-3 sm:p-3.5 rounded-full transition-all duration-200 flex-shrink-0 ${
              message.trim() && !isLoading
                ? 'bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/25'
                : 'bg-white/5 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
            ) : message.trim() ? (
              <Send className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : (
              <Mic className="h-5 w-5 sm:h-6 sm:w-6" />
            )}
          </motion.button>
        </form>
        
        {/* Helper Text */}
        <p className="text-center text-[9px] sm:text-[10px] text-slate-600 mt-2 font-medium uppercase tracking-wider">
          Press Enter to send • Shift + Enter for new line
        </p>
      </div>
    </div>
  );
}
