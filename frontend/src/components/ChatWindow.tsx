import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { SendHorizontal, Sparkles, Calendar, Clock, Zap, ArrowRight, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSendMessage } from '../hooks/useSendMessage';
import { useChatStore } from '../store/chatStore';
import ChatMessage from './ChatMessage';
import OptimizedSpinner from './OptimizedSpinner';

const QUICK_PROMPTS = [
  { icon: Calendar, text: "Schedule a meeting tomorrow at 2pm", category: "Schedule", desc: "Create a new calendar event" },
  { icon: Clock, text: "Check my availability this week", category: "Availability", desc: "View open time slots" },
  { icon: Zap, text: "Reschedule my 3pm meeting to 4pm", category: "Modify", desc: "Move existing events" },
  { icon: MessageSquare, text: "Show all my meetings for today", category: "View", desc: "List today's schedule" },
];

const getContextualSuggestions = (lastMessage: string): string[] => {
  const msg = lastMessage.toLowerCase();
  if (msg.includes('schedule') || msg.includes('book') || msg.includes('create')) return ["Yes, confirm it", "Add 15 min buffer", "Make it 30 min instead"];
  if (msg.includes('reschedule') || msg.includes('move') || msg.includes('change')) return ["Yes, that works", "Find another slot", "Notify attendees"];
  if (msg.includes('cancel') || msg.includes('delete')) return ["Yes, cancel it", "Reschedule instead"];
  if (msg.includes('availability') || msg.includes('free') || msg.includes('when')) return ["Show next week too", "Morning slots only", "Afternoon works"];
  return ["Schedule a meeting", "Check availability", "Show my calendar"];
};

/* ───── Status Bar ───── */
const StatusBar = memo(({ isOnline }: { isOnline: boolean | null }) => (
  <div className="shrink-0 px-4 sm:px-6 py-3 bg-[#0a0a14]/80 backdrop-blur-xl border-b border-white/5 z-20">
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0a0a14] transition-colors duration-300 ${
          isOnline === true ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]' : isOnline === false ? 'bg-rose-400' : 'bg-slate-500'
        }`} />
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-[14px] font-semibold text-white">ChronosAI</span>
          <span className="text-[10px] font-medium text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-md border border-blue-500/20">AI</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {isOnline === true ? 'Online · Ready to help' : isOnline === false ? 'Reconnecting…' : 'Connecting…'}
        </p>
      </div>
    </div>
    {/* Accent line */}
    <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
  </div>
));
StatusBar.displayName = 'StatusBar';

/* ───── Smart Suggestions ───── */
const SmartSuggestions = memo(({ onSuggestionClick, suggestions }: { onSuggestionClick: (text: string) => void; suggestions: string[] }) => {
  if (!suggestions.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="shrink-0 px-4 sm:px-6 py-2.5 border-t border-white/5 bg-[#0a0a14]/60 backdrop-blur-md"
    >
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
        {suggestions.map((suggestion, i) => (
          <button
            key={i}
            onClick={() => onSuggestionClick(suggestion)}
            className="shrink-0 px-3.5 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] rounded-xl text-[13px] text-slate-300 transition-all flex items-center gap-1.5 group"
          >
            {suggestion}
            <ArrowRight className="h-3 w-3 opacity-40 group-hover:opacity-70 group-hover:translate-x-0.5 transition-all" />
          </button>
        ))}
      </div>
    </motion.div>
  );
});
SmartSuggestions.displayName = 'SmartSuggestions';

/* ───── Quick Prompt Card ───── */
const QuickPrompt = memo(({ prompt, onClick, index }: { prompt: typeof QUICK_PROMPTS[0]; onClick: (text: string) => void; index: number }) => (
  <motion.button
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.15 + index * 0.08 }}
    onClick={() => onClick(prompt.text)}
    className="flex items-center gap-3.5 p-3.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.07] hover:border-white/[0.14] rounded-xl transition-all text-left w-full group hover:shadow-lg hover:shadow-blue-500/[0.04]"
  >
    <div className="w-10 h-10 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/15 rounded-xl flex items-center justify-center shrink-0 group-hover:border-blue-500/30 transition-colors">
      <prompt.icon className="h-5 w-5 text-blue-400 group-hover:scale-110 transition-transform" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] text-blue-400/60 uppercase tracking-wider font-semibold">{prompt.category}</p>
      <p className="text-[14px] text-slate-200 truncate leading-snug mt-0.5">{prompt.text}</p>
      <p className="text-[11px] text-slate-500 mt-0.5">{prompt.desc}</p>
    </div>
  </motion.button>
));
QuickPrompt.displayName = 'QuickPrompt';

/* ───── Empty State ───── */
const EmptyState = memo(({ onQuickPrompt }: { onQuickPrompt: (text: string) => void }) => (
  <div className="flex flex-col items-center justify-center h-full px-5 py-10 space-y-7">
    {/* Animated hero icon */}
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      <div className="w-[72px] h-[72px] bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/25">
        <Sparkles className="h-9 w-9 text-white" />
      </div>
      {/* Rotating ring */}
      <div className="absolute -inset-3 rounded-3xl border border-blue-500/20 animate-[spin_8s_linear_infinite]" />
      <div className="absolute -inset-5 rounded-3xl border border-indigo-500/10 animate-[spin_12s_linear_infinite_reverse]" />
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="text-center space-y-2"
    >
      <h3 className="text-2xl font-bold text-white tracking-tight">AI Calendar Agent</h3>
      <p className="text-[14px] text-slate-400 max-w-xs mx-auto leading-relaxed">
        Schedule meetings, check availability, and manage your calendar with natural language
      </p>
    </motion.div>

    <div className="w-full max-w-sm space-y-2 pt-2">
      {QUICK_PROMPTS.map((prompt, i) => (
        <QuickPrompt key={i} prompt={prompt} onClick={onQuickPrompt} index={i} />
      ))}
    </div>
  </div>
));
EmptyState.displayName = 'EmptyState';

/* ───── Typing Indicator ───── */
const TypingIndicator = memo(() => (
  <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
      <Sparkles className="h-4 w-4 text-white" />
    </div>
    <div className="chat-shimmer rounded-2xl px-5 py-3.5">
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-blue-400/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-blue-400/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-[13px] text-slate-400 ml-1">Thinking…</span>
      </div>
    </div>
  </div>
));
TypingIndicator.displayName = 'TypingIndicator';

/* ═══════════════════════════════════════════════════ */

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
        textareaRef.current.style.height = '48px';
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
    <div className="flex flex-col h-full w-full bg-transparent">

      <StatusBar isOnline={isLlmOnline} />

      {/* Messages Scroll Area */}
      <div className="flex-1 min-h-0 overflow-y-auto w-full scroll-smooth">
        <div className="w-full pb-6 pt-2">
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

      {/* Smart Suggestions */}
      <AnimatePresence>
        {!isLoading && suggestions.length > 0 && (
          <SmartSuggestions onSuggestionClick={handleQuickPrompt} suggestions={suggestions} />
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="shrink-0 px-4 sm:px-6 py-4 w-full bg-[#0a0a14]/70 backdrop-blur-xl border-t border-white/[0.06] z-30">
        <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto">
          <div className="flex items-end bg-white/[0.04] border border-white/[0.08] rounded-2xl focus-within:border-blue-500/40 focus-within:bg-white/[0.06] focus-within:shadow-[0_0_20px_rgba(59,130,246,0.08)] transition-all p-1">

            <textarea
              ref={textareaRef}
              rows={1}
              value={message}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Message ChronosAI..."
              className="flex-1 bg-transparent border-none text-white placeholder-slate-500 focus:ring-0 resize-none py-3 px-3.5 min-h-[48px] max-h-[150px] overflow-y-auto text-[15px] leading-relaxed"
              style={{ scrollbarWidth: 'none' }}
            />

            <div className="shrink-0 p-1.5 mb-0.5">
              {isLoading ? (
                <div className="h-10 w-10 flex items-center justify-center">
                  <OptimizedSpinner size="sm" variant="dots" className="text-blue-400" />
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    message.trim()
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/25 hover:scale-105 active:scale-95'
                      : 'bg-white/[0.04] text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <SendHorizontal className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-between mt-2 px-1">
            <span className="text-[10px] text-slate-600">
              Press <kbd className="px-1 py-0.5 bg-white/[0.04] rounded text-slate-500 font-mono">Enter</kbd> to send · <kbd className="px-1 py-0.5 bg-white/[0.04] rounded text-slate-500 font-mono">Shift+Enter</kbd> for new line
            </span>
          </div>
        </form>
      </div>

    </div>
  );
}
