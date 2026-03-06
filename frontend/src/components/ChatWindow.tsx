import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, Calendar, Clock, Activity } from 'lucide-react';
import { useSendMessage } from '../hooks/useSendMessage';
import { useChatStore } from '../store/chatStore';
import ChatMessage from './ChatMessage';

const QUICK_PROMPTS = [
  { icon: Calendar, text: "Schedule a meeting tomorrow at 2pm" },
  { icon: Clock, text: "Check my availability this week" },
  { icon: Sparkles, text: "Reschedule my 3pm meeting to 4pm" },
];

export default function ChatWindow() {
  const [message, setMessage] = useState('');
  const { messages, isLoading, currentResponse } = useChatStore();
  const sendMessage = useSendMessage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentResponse]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      sendMessage.mutate({ message: message.trim() });
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleQuickPrompt = (text: string) => {
    if (!isLoading) {
      sendMessage.mutate({ message: text });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  return (
    <div className="flex flex-col h-full">
      {/* ChronusAI Status Bar */}
      <div className="px-4 py-3 bg-slate-900/50 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-2.5 h-2.5 bg-green-400 rounded-full animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-400" />
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

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full space-y-6 animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 blur-3xl opacity-20 animate-pulse" />
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl relative z-10">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">AI Meeting Assistant</h3>
              <p className="text-sm text-slate-400 max-w-md">Schedule, reschedule, or check availability using natural language</p>
            </div>
            <div className="grid grid-cols-1 gap-2 w-full max-w-lg">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickPrompt(prompt.text)}
                  className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-left hover:bg-slate-700/50 hover:border-blue-500/30 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <prompt.icon className="h-5 w-5 text-blue-400" />
                    </div>
                    <span className="text-sm text-slate-200 group-hover:text-white transition-colors">{prompt.text}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
        
        {isLoading && currentResponse && (
          <ChatMessage 
            message={{
              role: 'assistant',
              content: currentResponse,
              timestamp: new Date().toISOString()
            }}
            isTyping={true}
          />
        )}
        
        {isLoading && !currentResponse && (
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Loader2 className="h-5 w-5 text-white animate-spin" />
            </div>
            <div className="bg-slate-800/80 backdrop-blur-xl border border-white/10 rounded-3xl px-4 py-3 shadow-lg">
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
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="border-t border-white/5 p-3 bg-slate-900/30 backdrop-blur-xl">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI to schedule, reschedule, or check availability..."
            className="flex-1 min-h-[48px] max-h-[120px] px-4 py-3 bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!message.trim() || isLoading}
            className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-2xl hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center flex-shrink-0"
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
