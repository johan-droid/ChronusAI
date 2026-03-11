import { useState, useRef, useEffect, useLayoutEffect, memo, useCallback } from 'react';
import { SendHorizontal, ArrowRight, Calendar, Clock, Edit2, Eye, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSendMessage } from '../hooks/useSendMessage';
import { useChatStore } from '../store/chatStore';
import { useUserSession, useLlmStatus } from '../hooks/useUserSession';
import ChatMessage from './ChatMessage';
import OptimizedSpinner from './OptimizedSpinner';

const QUICK_PROMPTS = [
  { icon: Calendar, label: "Schedule", text: "Schedule a meeting tomorrow at 2pm", color: "text-blue-400", iconBg: "bg-blue-500/15 border-blue-500/20" },
  { icon: Clock, label: "Availability", text: "Check my availability this week", color: "text-emerald-400", iconBg: "bg-emerald-500/15 border-emerald-500/20" },
  { icon: Edit2, label: "Modify", text: "Reschedule my 3pm meeting to 4pm", color: "text-amber-400", iconBg: "bg-amber-500/15 border-amber-500/20" },
  { icon: Eye, label: "View", text: "Show all my meetings for today", color: "text-purple-400", iconBg: "bg-purple-500/15 border-purple-500/20" },
  { icon: X, label: "Cancel", text: "Cancel my next meeting", color: "text-rose-400", iconBg: "bg-rose-500/15 border-rose-500/20" },
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="shrink-0 px-4 sm:px-6 py-3"
    >
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5 max-w-3xl mx-auto">
        {suggestions.map((suggestion, i) => (
          <button
            key={i}
            onClick={() => onSuggestionClick(suggestion)}
            className="claude-suggestion shrink-0 flex items-center gap-1.5 group touch-target"
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

/* ───── Typing Indicator ───── */
const TypingIndicator = memo(() => (
  <div className="flex justify-start px-4 sm:px-6 py-3 max-w-3xl mx-auto w-full">
    <div className="chat-shimmer rounded-2xl px-5 py-3.5">
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-[13px] text-slate-500 ml-1">Thinking…</span>
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
      sendMessage.mutate({ message: message.trim() });
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = '52px';
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
            {/* Empty State — Claude-style centered greeting */}
            {!hasMessages && (
              <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-5">
                {/* Greeting Tile */}
                <div className="text-center mb-10 claude-greeting relative">
                  {/* Ambient glow — matches galaxy-bg orange/purple theme */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-orange-500/25 via-purple-500/15 to-indigo-500/20 blur-2xl pointer-events-none" />
                  <div className="relative glass-card rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/50">
                    {/* Emoji with glow ring */}
                    <div className="flex items-center justify-center mb-5">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-orange-500/30 blur-xl scale-150" />
                        <span className="relative text-5xl sm:text-6xl leading-none drop-shadow-lg">{greeting.emoji}</span>
                      </div>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white/95">
                      {greeting.text},{' '}
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-400 to-purple-400">{firstName}</span>
                    </h1>
                    <p className="text-[15px] text-white/55 mt-3 claude-greeting-delay-1 font-medium">
                      Ready to schedule your meetings with AI assistance.
                    </p>
                  </div>
                </div>

                {/* Central Input — shown in empty state */}
                <div className="w-full max-w-2xl claude-greeting-delay-1">
                  <form onSubmit={handleSubmit}>
                    <div className="claude-chat-input rounded-2xl p-1.5">
                      <textarea
                        ref={textareaRef}
                        rows={1}
                        value={message}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder="How can I help you today?"
                        className="w-full bg-transparent border-none text-white/90 placeholder-slate-600 focus:ring-0 resize-none py-3 px-4 min-h-[52px] max-h-[150px] overflow-y-auto text-[15px] leading-relaxed outline-none"
                        style={{ scrollbarWidth: 'none' }}
                      />

                      <div className="flex items-center justify-end px-2 pb-1.5">
                        <div className="flex items-center gap-3">
                          {/* Status indicator */}
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              isLlmOnline === true ? 'bg-emerald-400/70' : isLlmOnline === false ? 'bg-rose-400/70' : 'bg-slate-500/70'
                            }`} />
                            <span className="text-[12px] text-slate-500 font-medium">
                              {isLlmOnline === true ? 'Online' : isLlmOnline === false ? 'Offline' : 'Checking...'}
                            </span>
                          </div>

                          {/* Send button */}
                          <button
                            type="submit"
                            disabled={!message.trim() || isLoading}
                            className="p-2 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:bg-slate-600 disabled:opacity-50 text-white transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>

                  {/* Quick prompts */}
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {QUICK_PROMPTS.slice(0, 4).map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setMessage(prompt.text);
                          handleSubmit({ preventDefault: () => {} } as React.FormEvent);
                        }}
                        className="text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 hover:scale-105 group"
                      >
                        <span className="font-semibold text-[14px] text-white/80">{prompt.label}</span>
                        <span className="text-[12px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                          {prompt.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
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
        <div className="shrink-0 px-4 sm:px-6 py-4 w-full" style={{ zIndex: 'var(--z-backdrop, 30)' }}>
          <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
            <div className="claude-chat-input rounded-2xl p-1.5">
              <textarea
                ref={!hasMessages ? undefined : textareaRef}
                rows={1}
                value={message}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Message ChronosAI..."
                className="w-full bg-transparent border-none text-white/90 placeholder-slate-600 focus:ring-0 resize-none py-3 px-4 min-h-[52px] max-h-[150px] overflow-y-auto text-[15px] leading-relaxed outline-none"
                style={{ scrollbarWidth: 'none' }}
              />

              <div className="flex items-end justify-end px-2 pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      isLlmOnline === true ? 'bg-emerald-400/70' : isLlmOnline === false ? 'bg-rose-400/70' : 'bg-slate-500/70'
                    }`} />
                    <span className="text-[11px] text-slate-600 font-medium">ChronosAI</span>
                  </div>

                  {isLoading ? (
                    <div className="h-8 w-8 flex items-center justify-center">
                      <OptimizedSpinner size="sm" variant="dots" className="text-slate-400" />
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={!message.trim()}
                      className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200 mb-0.5 touch-target ${
                        message.trim()
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white hover:from-indigo-400 hover:to-purple-500 shadow-lg shadow-indigo-500/25 active:scale-95'
                          : 'text-slate-700 cursor-not-allowed bg-white/[0.03]'
                      }`}
                    >
                      <SendHorizontal className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-2 px-1">
              <span className="text-[10px] text-slate-600">
                Press <kbd className="px-1 py-0.5 bg-white/[0.04] rounded text-slate-500 font-mono">Enter</kbd> to send · <kbd className="px-1 py-0.5 bg-white/[0.04] rounded text-slate-500 font-mono">Shift+Enter</kbd> for new line
              </span>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
