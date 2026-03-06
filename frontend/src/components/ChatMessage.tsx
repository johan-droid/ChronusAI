import { User, Bot, Sparkles, Calendar, CheckCircle } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
  isTyping?: boolean;
}

export default function ChatMessage({ message, isTyping = false }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-3 animate-fade-in`}>
      {!isUser && (
        <div className="flex-shrink-0 relative">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-background animate-pulse" />
        </div>
      )}
      
      <div className={`max-w-[75%] relative group ${
        isUser ? 'order-first' : ''
      }`}>
        {/* Message bubble */}
        <div className={`px-4 py-3 rounded-2xl relative overflow-hidden transition-all duration-200 ${
          isUser
            ? 'bg-gradient-to-br from-primary to-primary/80 text-white ml-auto shadow-lg shadow-primary/20'
            : 'glass-card border border-white/10 text-foreground shadow-lg'
        } ${isTyping ? 'animate-pulse' : ''}`}>
          
          {/* Background effects for AI messages */}
          {!isUser && (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-green-500/5" />
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            </>
          )}
          
          <div className="relative z-10">
            {/* AI thinking indicator */}
            {!isUser && isTyping && (
              <div className="flex items-center gap-2 mb-2 text-primary">
                <Sparkles className="h-3 w-3 animate-spin" />
                <span className="text-xs font-medium">AI is thinking...</span>
              </div>
            )}
            
            {/* Message content */}
            <div className={`text-sm leading-relaxed ${
              isUser ? 'font-medium' : 'font-normal'
            }`}>
              {message.content.split('\n').map((line, i) => (
                <p key={i} className={i > 0 ? 'mt-2' : ''}>
                  {line}
                  {isTyping && i === message.content.split('\n').length - 1 && (
                    <span className="inline-block w-0.5 h-4 bg-current animate-pulse ml-1" />
                  )}
                </p>
              ))}
            </div>
            
            {/* Meeting confirmation card */}
            {!isUser && message.content.includes('Meeting scheduled') && (
              <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-xs font-semibold">Meeting Created Successfully</span>
                </div>
              </div>
            )}
            
            {/* Timestamp */}
            <div className={`text-xs mt-2 flex items-center gap-1 ${
              isUser ? 'text-white/70 justify-end' : 'text-muted-foreground'
            }`}>
              {!isUser && <Calendar className="h-3 w-3" />}
              <span>
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        </div>
        
        {/* Message tail */}
        <div className={`absolute top-4 w-3 h-3 transform rotate-45 ${
          isUser 
            ? 'right-0 translate-x-1 bg-primary' 
            : 'left-0 -translate-x-1 glass border-l border-t border-white/10'
        }`} />
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 relative">
          <div className="w-8 h-8 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center shadow-lg">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full border-2 border-background" />
        </div>
      )}
    </div>
  );
}
