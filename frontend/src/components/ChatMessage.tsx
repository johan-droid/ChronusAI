import { User, Bot, Check, CheckCheck, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
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

  // Format timestamp
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2 sm:gap-3 w-full group px-2 sm:px-0`}
    >
      {/* Avatar - AI only */}
      {!isUser && (
        <div className="flex-shrink-0 self-end mb-1">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-white/10 rounded-full flex items-center justify-center shadow-lg">
            <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
          </div>
        </div>
      )}

      {/* Message Bubble */}
      <div className={`max-w-[85%] sm:max-w-[75%] min-w-0 ${isUser ? 'order-1' : 'order-2'}`}>
        <div 
          className={`relative px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl transition-all duration-200 ${
            isUser
              ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-br-md shadow-md'
              : 'bg-[#1a1a2e] border border-white/10 text-slate-100 rounded-bl-md shadow-md'
          } ${isTyping ? 'animate-pulse' : ''}`}
        >
          {/* Message Content */}
          <div className="text-[14px] sm:text-[15px] leading-[1.5] font-normal whitespace-pre-wrap break-words">
            {cleanContent}
            {isTyping && (
              <span className="inline-flex gap-1 ml-1">
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            )}
          </div>

          {/* Meeting Card - if present */}
          {!isUser && message.meeting?.meeting_url && (
            <div className="mt-3 p-3 bg-black/30 border border-white/10 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 min-w-0 flex-1">
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
                className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold rounded-lg transition-all text-center whitespace-nowrap"
              >
                Join
              </a>
            </div>
          )}

          {/* Success Indicator */}
          {!isUser && isSuccess && (
            <div className={`mt-2 pt-2 border-t border-white/10 flex items-center gap-1.5 text-[10px] sm:text-xs ${message.meeting?.meeting_url ? 'text-blue-400' : 'text-emerald-400'}`}>
              <Check className="h-3 w-3" />
              <span className="font-medium">{message.meeting?.meeting_url ? 'Meeting created' : 'Done'}</span>
            </div>
          )}

          {/* Timestamp & Status */}
          <div className={`flex items-center gap-1 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
            <span className={`text-[10px] ${isUser ? 'text-white/70' : 'text-slate-500'}`}>
              {formattedTime}
            </span>
            {isUser && (
              <span className="text-white/70">
                <CheckCheck className="h-3 w-3" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Avatar - User only */}
      {isUser && (
        <div className="flex-shrink-0 self-end mb-1 order-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 border border-white/10 rounded-full flex items-center justify-center shadow-lg">
            <User className="h-4 w-4 sm:h-5 sm:w-5 text-slate-300" />
          </div>
        </div>
      )}
    </motion.div>
  );
}
