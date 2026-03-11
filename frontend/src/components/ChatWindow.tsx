import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { SendHorizontal, Sparkles, Calendar, Clock, Zap, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSendMessage } from '../hooks/useSendMessage';
import { useChatStore } from '../store/chatStore';
import ChatMessage from './ChatMessage';
import OptimizedSpinner from './OptimizedSpinner';

// Enhanced quick prompts
const QUICK_PROMPTS = [
  { icon: Calendar, text: "Schedule a meeting tomorrow at 2pm", category: "Schedule" },
  { icon: Clock, text: "Check my availability this week", category: "Availability" },
  { icon: Zap, text: "Reschedule my 3pm meeting to 4pm", category: "Modify" },
  { icon: Sparkles, text: "Show all my meetings for today", category: "View" },
];

const getContextualSuggestions = (lastMessage: string): string[] => {
  const msg = lastMessage.toLowerCase();
  if (msg.includes('schedule') || msg.includes('book') || msg.includes('create')) return ["Yes, confirm it", "Add 15 min buffer", "Make it 30 min instead"];
  if (msg.includes('reschedule') || msg.includes('move') || msg.includes('change')) return ["Yes, that works", "Find another slot", "Notify attendees"];
  if (msg.includes('cancel') || msg.includes('delete')) return ["Yes, cancel it", "Reschedule instead"];
  if (msg.includes('availability') || msg.includes('free') || msg.includes('when')) return ["Show next week too", "Morning slots only", "Afternoon works"];
  return ["Schedule a meeting", "Check availability", "Show my calendar"];
};

const StatusBar = memo(({ isOnline }: { isOnline: boolean | null }) => (
  <div className="shrink-0 px-4 py-3 bg-[#0a0a14]/90 backdrop-blur-xl border-b border-white/5 z-20">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center">
          <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${isOnline === true ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : isOnline === false ? 'bg-rose-400' : 'bg-slate-500'}`} />
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
    </div>
  </div>
));
StatusBar.displayName = 'StatusBar';

const SmartSuggestions = memo(({ onSuggestionClick, suggestions }: { onSuggestionClick: (text: string) => void; suggestions: string[]; }) => {
  if (!suggestions.length) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="shrink-0 px-4 py-2 border-t border-white/5 bg-transparent">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {suggestions.map((suggestion, i) => (
          <button
            key={i}
            onClick={() => onSuggestionClick(suggestion)}
            className="shrink-0 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-slate-300 transition-colors flex items-center gap-1"
          >
            {suggestion} <ArrowRight className="h-3 w-3 opacity-50" />
          </button>
        ))}
      </div>
    </motion.div>
  );
});
SmartSuggestions.displayName = 'SmartSuggestions';

const QuickPrompt = memo(({ prompt, onClick, index }: { prompt: typeof QUICK_PROMPTS[0]; onClick: (text: string) => void; index: number; }) => (
  <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} onClick={() => onClick(prompt.text)} className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors text-left w-full group">
    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center shrink-0">
      <prompt.icon className="h-5 w-5 text-blue-400 group-hover:scale-110 transition-transform" />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{prompt.category}</p>
      <p className="text-sm text-slate-200 truncate">{prompt.text}</p>
    </div>
  </motion.button>
));
QuickPrompt.displayName = 'QuickPrompt';

const EmptyState = memo(({ onQuickPrompt }: { onQuickPrompt: (text: string) => void }) => (
  <div className="flex flex-col items-center justify-center h-full px-4 py-8 space-y-6">
    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
      <Sparkles className="h-10 w-10 text-white" />
    </div>
    <div className="text-center space-y-1">
      <h3 className="text-xl font-bold text-white">AI Meeting Assistant</h3>
      <p className="text-sm text-slate-400">Schedule, reschedule, or check availability</p>
    </div>
    <div className="w-full max-w-sm space-y-2 pt-4">
      {QUICK_PROMPTS.map((prompt, i) => (
        <QuickPrompt key={i} prompt={prompt} onClick={onQuickPrompt} index={i} />
      ))}
    </div>
  </div>
));
EmptyState.displayName = 'EmptyState';

const TypingIndicator = memo(() => (
  <div className="flex items-center gap-3 px-4 py-2">
    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shrink-0">
      <Sparkles className="h-4 w-4 text-white" />
    </div>
    <div className="bg-white/5 rounded-2xl px-4 py-3 flex items-center gap-1.5">
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
    const interval = setInterval(checkStatus, 30000);
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
        textareaRef.current.style.height = '44px'; // Reset height on send
      }
    }
  }, [message, isLoading, sendMessage]);

  const handleQuickPrompt = useCallback((text: string) => {
    if (!isLoading) {
      sendMessage.mutate({ message: text });
    }
  }, [isLoading, sendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  }, [handleSubmit]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [message]);

  const suggestions = messages.length > 0 && messages[messages.length - 1]?.role === 'assistant'
    ? getContextualSuggestions(messages[messages.length - 1].content)
    : [];

  return (
    // Outer strictly enforces flex column height
    <div className="flex flex-col h-full w-full bg-transparent">
      
      <StatusBar isOnline={isLlmOnline} />

      {/* Messages Scroll Area - MUST have flex-1 min-h-0 */}
      <div className="flex-1 min-h-0 overflow-y-auto w-full scroll-smooth">
        <div className="w-full pb-6 pt-4">
          <AnimatePresence>
            {messages.length === 0 && (
              <EmptyState onQuickPrompt={handleQuickPrompt} />
            )}

            {messages.map((msg, index) => (
              <ChatMessage key={index} message={msg} />
            ))}

            {isLoading && currentResponse && (
              <ChatMessage
                message={{ role: 'assistant', content: currentResponse, timestamp: new Date().toISOString() }}
                isTyping={true}
              />
            )}

            {isLoading && !currentResponse && <TypingIndicator />}
          </AnimatePresence>
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* Suggestions block */}
      <AnimatePresence>
        {!isLoading && suggestions.length > 0 && (
          <SmartSuggestions onSuggestionClick={handleQuickPrompt} suggestions={suggestions} />
        )}
      </AnimatePresence>

      {/* Input Area - Locked to Bottom */}
      <div className="shrink-0 px-4 py-4 w-full bg-slate-900/50 backdrop-blur-lg border-t border-white/10 z-30">
        <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto relative">
          {/* Changed to items-end so button stays at bottom right when text wraps */}
          <div className="flex items-end bg-white/5 border border-white/10 rounded-2xl focus-within:border-blue-500/50 focus-within:bg-white/10 transition-all p-1">
            
            <textarea
              ref={textareaRef}
              rows={1}
              value={message}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Message ChronosAI..."
              className="flex-1 bg-transparent border-none text-white placeholder-slate-400 focus:ring-0 resize-none py-3 px-3 min-h-[44px] max-h-[150px] overflow-y-auto text-sm"
              style={{ scrollbarWidth: 'none' }}
            />
            
            <div className="shrink-0 p-1.5 mb-0.5">
              {isLoading ? (
                <div className="h-9 w-9 flex items-center justify-center">
                  <OptimizedSpinner size="sm" variant="dots" className="text-blue-400" />
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${
                    message.trim()
                      ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-md'
                      : 'bg-white/5 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <SendHorizontal className="h-4 w-4 ml-0.5" />
                </button>
              )}
            </div>
          </div>
          
          <div className="flex justify-between mt-2 px-1">
            <span className="text-[10px] text-slate-500">Press Enter to send, Shift + Enter for new line</span>
          </div>
        </form>
      </div>

    </div>
  );
}
