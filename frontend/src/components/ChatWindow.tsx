import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, Calendar, Clock } from 'lucide-react';
import { useSendMessage } from '../hooks/useSendMessage';
import { useChatStore } from '../store/chatStore';
import ChatMessage from './ChatMessage';

const QUICK_PROMPTS = [
  { icon: Calendar, text: "Schedule a meeting tomorrow at 2pm", color: "text-blue-400" },
  { icon: Clock, text: "Check my availability this week", color: "text-green-400" },
  { icon: Sparkles, text: "Reschedule my 3pm meeting to 4pm", color: "text-purple-400" },
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
    e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-1 h-1 bg-blue-400 rounded-full animate-float" style={{ top: '20%', left: '10%', animationDelay: '0s' }} />
        <div className="absolute w-1 h-1 bg-purple-400 rounded-full animate-float" style={{ top: '60%', right: '15%', animationDelay: '2s' }} />
        <div className="absolute w-1 h-1 bg-green-400 rounded-full animate-float" style={{ top: '40%', left: '80%', animationDelay: '4s' }} />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full space-y-6 animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 blur-3xl opacity-20 animate-pulse" />
              <Sparkles className="h-16 w-16 text-primary relative z-10" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold gradient-text">AI Meeting Assistant</h3>
              <p className="text-sm text-muted-foreground max-w-md">Schedule, reschedule, or check availability using natural language</p>
            </div>
            <div className="grid grid-cols-1 gap-3 w-full max-w-2xl">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickPrompt(prompt.text)}
                  className="glass-card p-4 text-left hover:scale-[1.02] transition-all duration-200 group"
                >
                  <div className="flex items-center gap-3">
                    <prompt.icon className={`h-5 w-5 ${prompt.color}`} />
                    <span className="text-sm text-foreground group-hover:text-primary transition-colors">{prompt.text}</span>
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
          <div className="flex items-center space-x-2 text-muted-foreground glass-card p-3 w-fit">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm">AI is thinking...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="border-t border-white/5 p-4 glass relative z-10">
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask AI to schedule, reschedule, or check availability..."
            className="flex-1 min-h-[44px] max-h-32 px-4 py-3 glass-card text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!message.trim() || isLoading}
            className="px-5 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium text-sm"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
