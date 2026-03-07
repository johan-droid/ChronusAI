import { User, Bot, CheckCircle, AlertCircle } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
  isTyping?: boolean;
}

export default function ChatMessage({ message, isTyping = false }: ChatMessageProps) {
  const isUser = message.role === 'user';
  
  // Remove markdown and clean text
  const cleanContent = message.content
    .replace(/\*\*/g, '') // Remove bold
    .replace(/\*/g, '')   // Remove italic
    .replace(/#{1,6}\s/g, '') // Remove headers
    .replace(/`{1,3}[^`]*`{1,3}/g, (match) => match.replace(/`/g, '')) // Remove code blocks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Remove links, keep text
  
  const isSuccess = cleanContent.toLowerCase().includes('scheduled') || 
                    cleanContent.toLowerCase().includes('created') ||
                    cleanContent.toLowerCase().includes('confirmed');
  
  const isError = cleanContent.toLowerCase().includes('error') || 
                  cleanContent.toLowerCase().includes('failed') ||
                  cleanContent.toLowerCase().includes('conflict');
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2 animate-fade-in`}>
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Bot className="h-5 w-5 text-white" />
          </div>
        </div>
      )}
      
      <div className={`max-w-[80%] sm:max-w-[70%]`}>
        <div className={`px-4 py-3 rounded-3xl shadow-lg transition-all duration-200 ${
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
            : 'bg-slate-800/80 backdrop-blur-xl border border-white/10 text-slate-100'
        } ${isTyping ? 'animate-pulse' : ''}`}>
          
          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {cleanContent}
            {isTyping && (
              <span className="inline-block w-1 h-4 bg-current animate-pulse ml-1 align-middle" />
            )}
          </div>
          
          {!isUser && isSuccess && (
            <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2 text-green-400">
              <CheckCircle className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Success</span>
            </div>
          )}
          
          {!isUser && isError && (
            <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2 text-red-400">
              <AlertCircle className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Action Required</span>
            </div>
          )}
          
          <div className={`text-[10px] mt-1.5 opacity-60`}>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>
      
      {isUser && (
        <div className="flex-shrink-0">
          <div className="w-9 h-9 bg-gradient-to-br from-slate-700 to-slate-600 rounded-2xl flex items-center justify-center shadow-lg">
            <User className="h-5 w-5 text-white" />
          </div>
        </div>
      )}
    </div>
  );
}
