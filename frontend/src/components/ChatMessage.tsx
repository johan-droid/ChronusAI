import { User, Bot, CheckCircle } from 'lucide-react';
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

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-3 sm:gap-4 animate-fade-in w-full group`}>
      {!isUser && (
        <div className="flex-shrink-0 mt-1 self-end mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-white/10 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden group-hover:border-blue-500/30 transition-colors">
            <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
            <Bot className="h-5 w-5 text-blue-400 relative z-10" />
          </div>
        </div>
      )}

      <div className="max-w-[85%] sm:max-w-[70%] min-w-0">
        <div className={`relative px-5 py-4 rounded-3xl transition-all duration-300 border ${isUser
          ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-white/10 rounded-br-sm shadow-[0_8px_30px_rgb(59,130,246,0.1)]'
          : 'bg-white/5 backdrop-blur-xl border-white/10 text-slate-100 rounded-bl-sm shadow-[0_8px_30px_rgb(0,0,0,0.2)]'
          } ${isTyping ? 'animate-pulse' : ''} group-hover:shadow-2xl transition-shadow`}>

          <div className="text-[15px] sm:text-[16px] leading-[1.6] font-medium whitespace-pre-wrap break-words min-w-0">
            {cleanContent}
            {isTyping && (
              <div className="inline-flex gap-1 ml-2">
                <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            )}
          </div>

          {!isUser && message.meeting?.meeting_url && (
            <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-slide-up hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                  <span className="text-blue-400 font-bold text-sm">Z</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">Zoom Meeting</p>
                  <p className="text-xs text-slate-400 truncate opacity-60 font-medium">{message.meeting.meeting_url}</p>
                </div>
              </div>
              <a
                href={message.meeting.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 flex items-center justify-center bg-blue-500 hover:bg-blue-400 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 whitespace-nowrap"
              >
                Join Now
              </a>
            </div>
          )}

          {!isUser && isSuccess && (
            <div className={`mt-3 pt-3 border-t border-white/5 flex items-center gap-2 ${message.meeting?.meeting_url ? 'text-blue-400' : 'text-emerald-400'}`}>
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider">{message.meeting?.meeting_url ? 'Meeting Synced' : 'Action Complete'}</span>
            </div>
          )}

          <div className={`text-[10px] mt-2.5 opacity-40 font-bold uppercase tracking-widest ${isUser ? 'text-white' : 'text-slate-400'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 mt-1 self-end mb-6 font-bold text-slate-500">
          <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shadow-lg group-hover:border-white/20 transition-colors">
            <User className="h-5 w-5 text-slate-300" />
          </div>
        </div>
      )}
    </div>
  );
}
