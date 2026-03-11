import { useState, useRef, useEffect, useLayoutEffect, memo, useCallback } from 'react';
import { SendHorizontal, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSendMessage } from '../hooks/useSendMessage';
import { useChatStore } from '../store/chatStore';
import { useUserSession, useLlmStatus } from '../hooks/useUserSession';
import ChatMessage from './ChatMessage';
import OptimizedSpinner from './OptimizedSpinner';

const QUICK_PROMPTS = [
  { emoji: "📅", label: "Schedule", text: "Schedule a meeting tomorrow at 2pm" },
  { emoji: "🕐", label: "Availability", text: "Check my availability this week" },
  { emoji: "✏️", label: "Modify", text: "Reschedule my 3pm meeting to 4pm" },
  { emoji: "📋", label: "View", text: "Show all my meetings for today" },
  { emoji: "❌", label: "Cancel", text: "Cancel my next meeting" },
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
                {/* Greeting */}
                {/* Greeting Tile */}
                <div className="text-center mb-10 claude-greeting bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl">
                  <h1 className="text-3xl sm:text-4xl font-bold text-white/90 tracking-tight flex items-center justify-center gap-3">
                    <span className="text-4xl sm:text-5xl">{greeting.emoji}</span>
                    {greeting.text}, {firstName}
                  </h1>
                  <p className="text-[16px] text-slate-400 mt-4 claude-greeting-delay-1 font-medium">
                    How can I help you today?
                  </p>
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
                              className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200 touch-target ${
                                message.trim()
                                  ? 'bg-white/10 text-white hover:bg-white/15 active:scale-95'
                                  : 'text-slate-700 cursor-not-allowed'
                              }`}
                            >
                              <SendHorizontal className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </form>

                  {/* Quick Prompt Grid - Refined 2x2 layout with touch targets */}
                  <div className="grid grid-cols-2 gap-3 mt-8 max-w-lg mx-auto claude-greeting-delay-2">
                    {QUICK_PROMPTS.slice(0, 4).map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => handleQuickPrompt(prompt.text)}
                        className="claude-pill flex flex-col items-start text-left p-4 h-auto touch-target"
                        disabled={isLoading}
                      >
                        <span className="text-lg mb-2">{prompt.emoji}</span>
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
                          ? 'bg-white/10 text-white hover:bg-white/15 active:scale-95'
                          : 'text-slate-700 cursor-not-allowed'
                      }`}
                    >
                      <SendHorizontal className="h-5 w-5" />
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
