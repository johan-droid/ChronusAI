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
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2 sm:gap-3 animate-fade-in w-full`}>
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#d0dcea]/20 to-[#8899aa]/20 border border-[#8899aa]/30 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
            <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-[#a0b0c0]" />
          </div>
        </div>
      )}

      <div className="max-w-[85%] sm:max-w-[75%] min-w-0">
        <div className={`px-4 sm:px-5 py-3 sm:py-4 rounded-2xl sm:rounded-[28px] shadow-lg transition-all duration-200 overflow-hidden ${isUser
          ? 'bg-gradient-to-br from-[#d0dcea] to-[#8899aa] text-slate-900 rounded-tr-sm'
          : 'bg-slate-800/80 backdrop-blur-xl border border-white/10 text-slate-100 rounded-tl-sm'
          } ${isTyping ? 'animate-pulse' : ''}`}>

          <div className="text-[14px] sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words min-w-0">
            {cleanContent}
            {isTyping && (
              <span className="inline-block w-1 h-4 bg-current animate-pulse ml-1 align-middle" />
            )}
          </div>

          {!isUser && message.meeting?.meeting_url && (
            <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-slide-up overflow-hidden">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-400 font-bold text-xs">Z</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">Zoom Meeting</p>
                  <p className="text-[10px] text-slate-400 truncate">{message.meeting.meeting_url}</p>
                </div>
              </div>
              <a
                href={message.meeting.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0 touch-manipulation whitespace-nowrap"
              >
                Join Meeting
              </a>
            </div>
          )}

          {!isUser && isSuccess && (
            <div className={`mt-2 pt-2 border-t border-white/10 flex items-center gap-2 ${message.meeting?.meeting_url ? 'text-blue-400' : 'text-green-400'}`}>
              <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-xs font-medium truncate">{message.meeting?.meeting_url ? 'Zoom Meeting Added' : 'Success'}</span>
            </div>
          )}

          {!isUser && isError && (
            <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2 text-red-400">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="text-xs font-medium truncate">Action Required</span>
            </div>
          )}

          <div className={`text-[10px] mt-2 opacity-60 font-medium ${isUser ? 'text-slate-800' : 'text-slate-400'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-slate-700 to-slate-800 border border-white/10 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
            <User className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
        </div>
      )}
    </div>
  );
}
