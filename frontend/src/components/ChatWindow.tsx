import { useState, useRef, useEffect, useLayoutEffect, memo, useCallback } from 'react';
import { SendHorizontal, ArrowRight, Calendar, Clock, Edit2, Eye, X, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSendMessage } from '../hooks/useSendMessage';
import { useChatStore } from '../store/chatStore';
import { useUserSession, useLlmStatus } from '../hooks/useUserSession';
import ChatMessage from './ChatMessage';
import OptimizedSpinner from './OptimizedSpinner';
import ReminderPicker from './ReminderPicker';

const QUICK_PROMPTS = [
  { icon: Calendar, label: "Schedule", text: "Schedule a meeting tomorrow at 2pm", color: "from-blue-400 to-cyan-400", iconBg: "bg-blue-500/10 border-blue-500/15", hoverBorder: "hover:border-blue-500/30" },
  { icon: Clock, label: "Availability", text: "Check my availability this week", color: "from-emerald-400 to-teal-400", iconBg: "bg-emerald-500/10 border-emerald-500/15", hoverBorder: "hover:border-emerald-500/30" },
  { icon: Edit2, label: "Modify", text: "Reschedule my 3pm meeting to 4pm", color: "from-amber-400 to-orange-400", iconBg: "bg-amber-500/10 border-amber-500/15", hoverBorder: "hover:border-amber-500/30" },
  { icon: Eye, label: "View", text: "Show all my meetings for today", color: "from-purple-400 to-pink-400", iconBg: "bg-purple-500/10 border-purple-500/15", hoverBorder: "hover:border-purple-500/30" },
  { icon: X, label: "Cancel", text: "Cancel my next meeting", color: "from-rose-400 to-red-400", iconBg: "bg-rose-500/10 border-rose-500/15", hoverBorder: "hover:border-rose-500/30" },
];

const getContextualSuggestions = (lastMessage: string): string[] => {
  const msg = lastMessage.toLowerCase();
  if (msg.includes('schedule') || msg.includes('book') || msg.includes('create')) return ["Yes, confirm it", "Add 15 min buffer", "Make it 30 min instead"];
  if (msg.includes('reschedule') || msg.includes('move') || msg.includes('change')) return ["Yes, that works", "Find another slot", "Notify attendees"];
  if (msg.includes('cancel') || msg.includes('delete')) return ["Yes, cancel it", "Reschedule instead"];
  if (msg.includes('availability') || msg.includes('free') || msg.includes('when')) return ["Show next week too", "Morning slots only", "Afternoon works"];
  return ["Schedule a meeting", "Check availability", "Show my calendar"];
};

/* ───── Smart Suggestions (touch-target compliant) ───── */
const SmartSuggestions = memo(({ onSuggestionClick, suggestions }: { onSuggestionClick: (text: string) => void; suggestions: string[] }) => {
  if (!suggestions.length) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="shrink-0 px-4 sm:px-6 py-2.5"
    >
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5 max-w-3xl mx-auto">
        {suggestions.map((suggestion, i) => (
          <button
            key={i}
            onClick={() => onSuggestionClick(suggestion)}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-medium text-indigo-300/60 bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/20 hover:bg-indigo-500/[0.04] hover:text-indigo-300/80 transition-all duration-200 group"
          >
            {suggestion}
            <ArrowRight className="h-3 w-3 opacity-30 group-hover:opacity-60 group-hover:translate-x-0.5 transition-all" />
          </button>
        ))}
      </div>
    </motion.div>
  );
});
SmartSuggestions.displayName = 'SmartSuggestions';

/* ───── Typing Indicator ───── */
const TypingIndicator = memo(() => (
  <div className="flex justify-start px-4 sm:px-6 py-3 max-w-3xl mx-auto w-full">
    <div className="rounded-2xl px-5 py-3.5 bg-white/[0.03] border border-white/[0.05]">
      <div className="flex items-center gap-2.5">
        <div className="flex gap-1.5">
          <span className="w-1.5 h-1.5 bg-indigo-400/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 bg-indigo-400/35 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 bg-indigo-400/20 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-[12px] text-white/25 ml-0.5 font-medium">Thinking...</span>
      </div>
    </div>
  </div>
));
TypingIndicator.displayName = 'TypingIndicator';

/* ═══════════════════════════════════════════════════ */

export default function ChatWindow() {
  const [message, setMessage] = useState('');
  const { messages, isLoading, currentResponse, clearMessages } = useChatStore();
  const { greeting, firstName } = useUserSession();
  const { isLlmOnline } = useLlmStatus();
  const sendMessage = useSendMessage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // reminder preferences for the next scheduled meeting
  const [showReminders, setShowReminders] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState<number[]>([]);
  const [reminderMethods, setReminderMethods] = useState<string[]>(['email']);

  const handleReminderChange = useCallback((mins: number[], meths: string[]) => {
    setReminderMinutes(mins);
    setReminderMethods(meths);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearMessages();
    };
  }, [clearMessages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentResponse, scrollToBottom]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      sendMessage.mutate({
        message: message.trim(),
        reminder_schedule_minutes: reminderMinutes.length ? reminderMinutes : undefined,
        reminder_methods: reminderMinutes.length && reminderMethods.length ? reminderMethods : undefined,
      });
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = '52px';
      }
    }
  }, [message, isLoading, sendMessage, reminderMinutes, reminderMethods]);

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

  // useLayoutEffect prevents flickering during textarea resize
  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [message]);

  const suggestions = messages.length > 0 && messages[messages.length - 1]?.role === 'assistant'
    ? getContextualSuggestions(messages[messages.length - 1].content)
    : [];

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full w-full bg-transparent">

      {/* Messages Scroll Area */}
      <div className="flex-1 min-h-0 overflow-y-auto w-full scroll-smooth">
        <div className="w-full pb-6 pt-2">
          <AnimatePresence>
            {/* Empty State — centered greeting with refined design */}
            {!hasMessages && (
              <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-5">
                {/* Greeting */}
                <motion.div 
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="text-center mb-8"
                >
                  {/* Animated emoji */}
                  <motion.div 
                    className="flex items-center justify-center mb-6"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1, type: 'spring', stiffness: 200 }}
                  >
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500/20 to-purple-500/20 blur-2xl scale-[2]" />
                      <span className="relative text-5xl sm:text-6xl leading-none drop-shadow-lg">{greeting.emoji}</span>
                    </div>
                  </motion.div>
                  <h1 className="text-2xl sm:text-[32px] font-bold tracking-tight text-white/90 leading-tight">
                    {greeting.text},{' '}
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-orange-400 to-purple-400">{firstName}</span>
                  </h1>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-[14px] text-white/40 mt-2.5 font-medium"
                  >
                    Your AI meeting assistant is ready to help.
                  </motion.p>
                </motion.div>

                {/* Central Input */}
                <motion.div 
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  className="w-full max-w-2xl"
                >
                  <form onSubmit={handleSubmit}>
                    <div className="chat-input-hero group">
                      <textarea
                        ref={textareaRef}
                        rows={1}
                        value={message}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask me to schedule, reschedule, or check your calendar..."
                        className="w-full bg-transparent border-none text-white/90 placeholder-white/25 focus:ring-0 resize-none py-3.5 px-5 min-h-[52px] max-h-[150px] overflow-y-auto text-[15px] leading-relaxed outline-none"
                        style={{ scrollbarWidth: 'none' }}
                      />

                      <div className="flex items-center justify-between px-3 pb-2">
                        <div className="flex items-center gap-2">
                          {/* Reminder toggle */}
                          <button
                            type="button"
                            onClick={() => setShowReminders((v) => !v)}
                            title="Set reminders"
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                              showReminders || reminderMinutes.length > 0
                                ? 'bg-orange-500/15 text-orange-400'
                                : 'text-white/20 hover:text-white/40 hover:bg-white/[0.03]'
                            }`}
                          >
                            <Bell className="h-3 w-3" />
                            {reminderMinutes.length > 0 ? `${reminderMinutes.length} reminder${reminderMinutes.length > 1 ? 's' : ''}` : 'Remind'}
                          </button>
                          {/* Status */}
                          <div className="flex items-center gap-1.5 px-2 py-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              isLlmOnline === true ? 'bg-emerald-400' : isLlmOnline === false ? 'bg-rose-400' : 'bg-white/20 animate-pulse'
                            }`} />
                            <span className="text-[11px] text-white/20 font-medium">
                              {isLlmOnline === true ? 'Online' : isLlmOnline === false ? 'Offline' : '...'}
                            </span>
                          </div>
                        </div>

                        {/* Send */}
                        <button
                          type="submit"
                          disabled={!message.trim() || isLoading}
                          className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                            message.trim()
                              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95'
                              : 'text-white/15 cursor-not-allowed'
                          }`}
                        >
                          <SendHorizontal className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Reminder picker */}
                      {showReminders && (
                        <div className="px-4 pb-3 pt-1 border-t border-white/[0.04]">
                          <ReminderPicker
                            minutes={reminderMinutes}
                            methods={reminderMethods}
                            onChange={handleReminderChange}
                            compact
                          />
                        </div>
                      )}
                    </div>
                  </form>

                  {/* Quick prompts — grid layout */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35, duration: 0.5 }}
                    className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2.5"
                  >
                    {QUICK_PROMPTS.slice(0, 3).map((prompt, index) => {
                      const Icon = prompt.icon;
                      return (
                        <motion.button
                          key={index}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleQuickPrompt(prompt.text)}
                          className={`group relative text-left p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] ${prompt.hoverBorder} hover:bg-white/[0.04] transition-all duration-300`}
                        >
                          <div className="flex items-center gap-2.5 mb-1.5">
                            <div className={`w-6 h-6 rounded-md ${prompt.iconBg} border flex items-center justify-center`}>
                              <Icon className="h-3 w-3 text-white/60" />
                            </div>
                            <span className={`text-[13px] font-semibold bg-clip-text text-transparent bg-gradient-to-r ${prompt.color}`}>
                              {prompt.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-white/30 leading-relaxed line-clamp-1 pl-[34px]">
                            {prompt.text}
                          </p>
                        </motion.button>
                      );
                    })}
                  </motion.div>

                  {/* Second row */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45, duration: 0.5 }}
                    className="mt-2.5 grid grid-cols-2 gap-2.5"
                  >
                    {QUICK_PROMPTS.slice(3, 5).map((prompt, index) => {
                      const Icon = prompt.icon;
                      return (
                        <motion.button
                          key={index}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleQuickPrompt(prompt.text)}
                          className={`group relative text-left p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] ${prompt.hoverBorder} hover:bg-white/[0.04] transition-all duration-300`}
                        >
                          <div className="flex items-center gap-2.5 mb-1.5">
                            <div className={`w-6 h-6 rounded-md ${prompt.iconBg} border flex items-center justify-center`}>
                              <Icon className="h-3 w-3 text-white/60" />
                            </div>
                            <span className={`text-[13px] font-semibold bg-clip-text text-transparent bg-gradient-to-r ${prompt.color}`}>
                              {prompt.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-white/30 leading-relaxed line-clamp-1 pl-[34px]">
                            {prompt.text}
                          </p>
                        </motion.button>
                      );
                    })}
                  </motion.div>
                </motion.div>
              </div>
            )}

            {/* Conversation Messages */}
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

      {/* Persistent Input Area — shown when there are messages */}
      {hasMessages && (
        <div className="shrink-0 px-4 sm:px-6 py-3 w-full border-t border-white/[0.04] bg-[rgba(9,9,11,0.6)] backdrop-blur-xl" style={{ zIndex: 'var(--z-backdrop, 30)' }}>
          <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
            <div className="chat-input-hero rounded-xl p-1">
              <textarea
                ref={!hasMessages ? undefined : textareaRef}
                rows={1}
                value={message}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Message ChronosAI..."
                className="w-full bg-transparent border-none text-white/90 placeholder-white/25 focus:ring-0 resize-none py-3 px-4 min-h-[48px] max-h-[150px] overflow-y-auto text-[15px] leading-relaxed outline-none"
                style={{ scrollbarWidth: 'none' }}
              />

              <div className="flex items-center justify-between px-2.5 pb-1.5">
                <div className="flex items-center gap-2">
                  {/* Reminder toggle */}
                  <button
                    type="button"
                    onClick={() => setShowReminders((v) => !v)}
                    title="Set reminders"
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                      showReminders || reminderMinutes.length > 0
                        ? 'bg-orange-500/15 text-orange-400'
                        : 'text-white/20 hover:text-white/35'
                    }`}
                  >
                    <Bell className="h-3 w-3" />
                    {reminderMinutes.length > 0 ? `${reminderMinutes.length}` : ''}
                  </button>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      isLlmOnline === true ? 'bg-emerald-400' : isLlmOnline === false ? 'bg-rose-400' : 'bg-white/15 animate-pulse'
                    }`} />
                    <span className="text-[10px] text-white/20 font-medium">ChronosAI</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/15 hidden sm:inline">
                    <kbd className="px-1 py-0.5 rounded text-white/20 font-mono text-[9px]">Enter</kbd> to send
                  </span>
                  {isLoading ? (
                    <div className="h-8 w-8 flex items-center justify-center">
                      <OptimizedSpinner size="sm" variant="dots" className="text-white/30" />
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={!message.trim()}
                      className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                        message.trim()
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 active:scale-95'
                          : 'text-white/15 cursor-not-allowed'
                      }`}
                    >
                      <SendHorizontal className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Reminder picker */}
              {showReminders && (
                <div className="px-4 pb-3 pt-1 border-t border-white/[0.04]">
                  <ReminderPicker
                    minutes={reminderMinutes}
                    methods={reminderMethods}
                    onChange={handleReminderChange}
                    compact
                  />
                </div>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
