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

      <div className={`max-w-[90%] sm:max-w-[70%]`}>
        <div className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl sm:rounded-3xl shadow-lg transition-all duration-200 ${isUser
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
            : 'bg-slate-800/80 backdrop-blur-xl border border-white/10 text-slate-100'
          } ${isTyping ? 'animate-pulse' : ''}`}>

          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {cleanContent}
            {isTyping && (
              <span className="inline-block w-1 h-4 bg-current animate-pulse ml-1 align-middle" />
            )}
          </div>

          {!isUser && message.meeting?.meeting_url && (
            <div className="mt-3 p-2.5 sm:p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 animate-slide-up">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-400 font-bold text-xs">Z</span>
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-white truncate">Zoom Meeting</p>
                  <p className="text-[10px] text-slate-400 truncate">{message.meeting.meeting_url}</p>
                </div>
              </div>
              <a
                href={message.meeting.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 min-h-[44px] flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors flex-shrink-0 touch-manipulation"
              >
                Join
              </a>
            </div>
          )}

          {!isUser && isSuccess && (
            <div className={`mt-2 pt-2 border-t border-white/10 flex items-center gap-2 ${message.meeting?.meeting_url ? 'text-blue-400' : 'text-green-400'}`}>
              <CheckCircle className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{message.meeting?.meeting_url ? 'Zoom Meeting Added' : 'Success'}</span>
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
