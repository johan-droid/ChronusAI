import { User, Bot, Check, Calendar, Clock, Sparkles, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ChatMessage as ChatMessageType } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
  isTyping?: boolean;
}

export default function ChatMessage({ message, isTyping = false }: ChatMessageProps) {
  const isUser = message.role === 'user';

  // Animation variants
  const messageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.16, 1, 0.3, 1] as const
      }
    }
  };

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

  // Format meeting time
  const formatMeetingTime = (timeString: string) => {
    try {
      return new Date(timeString).toLocaleString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timeString;
    }
  };

  // Format availability slot
  const formatAvailabilitySlot = (start: string, end: string) => {
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
      
      return {
        time: startDate.toLocaleString([], {
          weekday: 'short',
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        duration: `${duration} min`
      };
    } catch {
      return { time: start, duration: 'Unknown' };
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`flex gap-3 w-full group py-4 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center">
            <User className="h-4 w-4 text-gray-600" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-500 border border-blue-600 flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 min-w-0 ${isUser ? 'text-right' : 'text-left'}`}>
        {/* Name Label */}
        <div className="mb-1">
          <span className="text-xs font-medium text-gray-500">
            {isUser ? 'You' : 'ChronosAI'}
          </span>
        </div>

        {/* Message Text */}
        <motion.div 
          variants={messageVariants}
          initial="hidden"
          animate="visible"
          className="text-sm leading-relaxed text-gray-900 whitespace-pre-wrap break-words"
        >
          <div>
            {isTyping ? (
              <div className="flex items-center gap-1">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-gray-500 text-sm">ChronosAI is thinking...</span>
              </div>
            ) : (
              <p className="prose prose-sm max-w-none">{cleanContent}</p>
            )}
          </div>

          {/* Meeting Card - if present */}
          {!isUser && message.meeting?.meeting_url && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-xs">Z</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">Zoom Meeting</p>
                  <p className="text-xs text-gray-600 truncate">{message.meeting.meeting_url}</p>
                </div>
              </div>
              <motion.a
                href={message.meeting.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ExternalLink className="w-4 h-4" />
                <span>Join Meeting</span>
              </motion.a>
            </div>
          )}

          {/* Meetings List - if present */}
          {!isUser && message.meetings && message.meetings.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 mb-2">
                <Calendar className="h-4 w-4" />
                <span>Upcoming Meetings</span>
              </div>
              {message.meetings.slice(0, 5).map((meeting, index) => (
                <div key={meeting.id || index} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-900 truncate">{meeting.title}</p>
                  <p className="text-xs text-gray-600">
                    {formatMeetingTime(meeting.start_time)}
                  </p>
                </div>
              ))}
              {message.meetings.length > 5 && (
                <p className="text-xs text-gray-500 text-center">
                  +{message.meetings.length - 5} more meetings
                </p>
              )}
            </div>
          )}

          {/* Availability Slots - if present */}
          {!isUser && message.availability && message.availability.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-green-600 mb-2">
                <Clock className="h-4 w-4" />
                <span>Available Time Slots</span>
              </div>
              {message.availability.slice(0, 3).map((slot, index) => {
                const { time, duration } = formatAvailabilitySlot(slot.start, slot.end);
                return (
                  <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">{time}</p>
                    <p className="text-xs text-green-600">{duration}</p>
                  </div>
                );
              })}
              {message.availability.length > 3 && (
                <p className="text-xs text-gray-500 text-center">
                  +{message.availability.length - 3} more slots
                </p>
              )}
            </div>
          )}

          {/* AI Suggestions - if present */}
          {!isUser && message.suggestions && message.suggestions.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-purple-600 mb-2">
                <Sparkles className="h-4 w-4" />
                <span>AI Suggestions</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {message.suggestions.slice(0, 4).map((suggestion, index) => (
                  <button
                    key={index}
                    className="px-3 py-2 bg-purple-100 border border-purple-200 rounded-lg text-sm text-purple-700 hover:bg-purple-200 transition-colors touch-manipulation"
                    onClick={() => {
                      // This would trigger a new message with the suggestion
                      const input = document.querySelector('textarea[placeholder*="Message ChronosAI"]') as HTMLTextAreaElement;
                      if (input) {
                        input.value = suggestion.time;
                        input.focus();
                      }
                    }}
                  >
                    {suggestion.time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Success Indicator */}
          {!isUser && isSuccess && (
            <div className={`mt-2 pt-2 border-t border-gray-200 flex items-center gap-2 text-xs ${
              message.meeting?.meeting_url ? 'text-blue-600' : 'text-green-600'
            }`}>
              <Check className="h-3 w-3" />
              <span className="font-medium">
                {message.meeting?.meeting_url ? 'Meeting created' : 'Done'}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
