import { useMemo } from 'react';
import { Check, Calendar, Clock, ExternalLink, Zap, Bell, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ChatMessage as ChatMessageType } from '../types';

// ── Enhanced markdown renderer ──────────────────────────
function renderMd(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;

  const inlineFormat = (raw: string, key: string | number): React.ReactNode => {
    const parts = raw.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);
    return (
      <span key={key}>
        {parts.map((p, j) => {
          if (p.startsWith('`') && p.endsWith('`'))
            return <code key={j} className="px-1.5 py-0.5 rounded-md bg-white/[0.06] text-indigo-300/90 text-[13px] font-mono">{p.slice(1, -1)}</code>;
          if (p.startsWith('**') && p.endsWith('**'))
            return <strong key={j} className="font-semibold text-white/95">{p.slice(2, -2)}</strong>;
          if (p.startsWith('*') && p.endsWith('*'))
            return <em key={j} className="italic text-white/80">{p.slice(1, -1)}</em>;
          const linkMatch = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
          if (linkMatch)
            return <a key={j} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 decoration-indigo-400/30 transition-colors">{linkMatch[1]}</a>;
          return p;
        })}
      </span>
    );
  };

  while (i < lines.length) {
    const line = lines[i];

    // Headers
    if (/^###\s/.test(line)) {
      nodes.push(<h3 key={`h3-${i}`} className="text-[14px] font-bold text-white/90 mt-3 mb-1.5">{inlineFormat(line.replace(/^###\s+/, ''), i)}</h3>);
      i++; continue;
    }
    if (/^##\s/.test(line)) {
      nodes.push(<h2 key={`h2-${i}`} className="text-[15px] font-bold text-white/90 mt-3 mb-1.5">{inlineFormat(line.replace(/^##\s+/, ''), i)}</h2>);
      i++; continue;
    }
    if (/^#\s/.test(line)) {
      nodes.push(<h1 key={`h1-${i}`} className="text-base font-bold text-white/95 mt-3 mb-1.5">{inlineFormat(line.replace(/^#\s+/, ''), i)}</h1>);
      i++; continue;
    }

    // Code block
    if (/^```/.test(line)) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      nodes.push(
        <pre key={`code-${i}`} className="mt-2 mb-2 p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.06] overflow-x-auto">
          <code className="text-[13px] text-indigo-200/80 font-mono leading-relaxed">{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    // Collect a bullet list run
    if (/^[*\-]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[*\-]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[*\-]\s+/, ''));
        i++;
      }
      nodes.push(
        <ul key={`ul-${i}`} className="mt-1.5 mb-1.5 space-y-1.5 pl-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-2.5 items-start">
              <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-indigo-400/40 shrink-0" />
              <span className="leading-relaxed">{inlineFormat(item, idx)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Collect a numbered list run
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      nodes.push(
        <ol key={`ol-${i}`} className="mt-1.5 mb-1.5 space-y-1.5 pl-1 list-none">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-2.5 items-start">
              <span className="shrink-0 text-indigo-400/50 font-semibold text-[13px] w-5 text-right mt-px">{idx + 1}.</span>
              <span className="leading-relaxed">{inlineFormat(item, idx)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Blank line → spacing
    if (line.trim() === '') {
      nodes.push(<div key={`br-${i}`} className="h-1.5" />);
      i++;
      continue;
    }

    // Regular paragraph line
    nodes.push(<p key={`p-${i}`} className="leading-relaxed">{inlineFormat(line, i)}</p>);
    i++;
  }

  return nodes;
}

interface ChatMessageProps {
  message: ChatMessageType;
  isTyping?: boolean;
}

export default function ChatMessage({ message, isTyping = false }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const contentLower = useMemo(() => message.content.toLowerCase(), [message.content]);

  // Only flag success/cancel when a meeting object is present to avoid false positives
  const isSuccess = useMemo(() =>
    (contentLower.includes('scheduled') || contentLower.includes('created') ||
     contentLower.includes('confirmed') || contentLower.includes('✅')) &&
    !!message.meeting,
    [contentLower, message.meeting]
  );

  const isCanceled = useMemo(() =>
    (contentLower.includes('canceled') || contentLower.includes('cancelled') ||
     contentLower.includes('❌')) && !!message.meeting,
    [contentLower, message.meeting]
  );

  const formatMeetingTime = (timeString?: string) => {
    if (!timeString) return 'TBD';
    try {
      return new Date(timeString).toLocaleString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(timeString);
    }
  };

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
        endTime: endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: duration >= 60 ? `${Math.floor(duration / 60)}h${duration % 60 ? ` ${duration % 60}m` : ''}` : `${duration}m`
      };
    } catch {
      return { time: start, endTime: '', duration: '' };
    }
  };

  // Typing indicator
  if (isTyping && !message.content) {
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className="flex justify-start px-4 sm:px-6 py-3 max-w-3xl mx-auto w-full">
        <div className="chat-shimmer rounded-2xl px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 bg-indigo-400/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-indigo-400/35 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-indigo-400/20 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-[13px] text-slate-500 ml-0.5">Thinking…</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full py-1.5 sm:py-2 px-4 sm:px-6"
    >
      <div className="max-w-3xl mx-auto w-full">
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>

          {/* User message */}
          {isUser && (
            <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-br-md px-4 py-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/15 border border-indigo-500/20 text-white/95 shadow-lg shadow-indigo-500/5">
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
            </div>
          )}

          {/* AI message */}
          {!isUser && (
            <>
              <div className="flex items-center gap-1.5 mb-1.5 ml-0.5">
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-500/15 to-purple-500/15 border border-indigo-500/15 flex items-center justify-center">
                  <Zap className="h-2.5 w-2.5 text-indigo-400/60" />
                </div>
                <span className="text-[10px] font-semibold text-indigo-300/40 uppercase tracking-widest">ChronosAI</span>
              </div>

              <div className={`max-w-[90%] sm:max-w-[80%] rounded-2xl rounded-bl-md px-4 py-3.5 ${
                isTyping ? 'chat-shimmer' : 'bg-white/[0.025] border border-white/[0.06] text-white/85'
              }`}>
                {isTyping ? (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-indigo-400/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-indigo-400/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-indigo-400/20 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-slate-500 text-sm">Thinking…</span>
                  </div>
                ) : (
                  <div className="text-[15px] space-y-1 break-words leading-relaxed">{renderMd(message.content)}</div>
                )}
              </div>
            </>
          )}

          {/* ===== Rich Data Cards ===== */}

          {/* Meeting Card — created/rescheduled event */}
          {!isUser && message.meeting && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-2.5 max-w-[90%] sm:max-w-[78%] w-full claude-data-card p-4 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isCanceled ? 'bg-rose-500/10 border border-rose-500/15' : isSuccess ? 'bg-emerald-500/10 border border-emerald-500/15' : 'bg-blue-500/10 border border-blue-500/15'
                }`}>
                  <Calendar className={`h-4 w-4 ${isCanceled ? 'text-rose-400' : isSuccess ? 'text-emerald-400' : 'text-blue-400'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-white truncate">
                    {message.meeting.title || 'Meeting'}
                  </p>
                  <p className="text-[12px] text-slate-400">
                    {formatMeetingTime(message.meeting.start_time)}
                  </p>
                </div>
                {/* Status badge */}
                <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full border ${
                  message.meeting.status === 'scheduled'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : message.meeting.status === 'rescheduled'
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    : message.meeting.status === 'canceled'
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                    : 'text-slate-400 bg-white/5 border-white/10'
                }`}>
                  {message.meeting.status || 'scheduled'}
                </span>
              </div>

              {message.meeting.meeting_url && (
                <motion.a
                  href={message.meeting.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/15 hover:border-blue-500/25 text-blue-300 text-[13px] font-medium transition-all"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Join Meeting
                </motion.a>
              )}
            </motion.div>
          )}

          {/* Meetings List — upcoming events */}
          {!isUser && message.meetings && message.meetings.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-2.5 max-w-[90%] sm:max-w-[78%] w-full claude-data-card overflow-hidden"
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <Calendar className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-[12px] font-semibold text-blue-400/80 uppercase tracking-wider">
                  Upcoming Meetings
                </span>
                <span className="ml-auto text-[11px] text-slate-600">{message.meetings.length} events</span>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {message.meetings.slice(0, 5).map((meeting, index) => (
                  <div
                    key={meeting.id || index}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="w-0.5 h-7 rounded-full bg-blue-500/40 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-white/90 truncate">{meeting.title}</p>
                      <p className="text-[11px] text-slate-500">{formatMeetingTime(meeting.start_time)}</p>
                    </div>
                  </div>
                ))}
              </div>
              {message.meetings.length > 5 && (
                <div className="px-4 py-2.5 text-center text-[11px] text-slate-600 border-t border-white/[0.04]">
                  +{message.meetings.length - 5} more meetings
                </div>
              )}
            </motion.div>
          )}

          {/* Availability Slots */}
          {!isUser && message.availability && message.availability.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-2.5 max-w-[90%] sm:max-w-[78%] w-full claude-data-card overflow-hidden"
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <Clock className="h-3.5 w-3.5 text-emerald-400/80" />
                <span className="text-[12px] font-semibold text-emerald-400/70 uppercase tracking-wider">
                  Available Slots
                </span>
              </div>
              <div className="p-3 space-y-2">
                {message.availability.slice(0, 6).map((slot, index) => {
                  const { time, endTime, duration } = formatAvailabilitySlot(slot.start, slot.end);
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/[0.08] hover:bg-emerald-500/[0.07] transition-colors"
                    >
                      <div>
                        <p className="text-[13px] font-medium text-emerald-300/90">{time}</p>
                        {endTime && <p className="text-[11px] text-slate-500">until {endTime}</p>}
                      </div>
                      {duration && (
                        <span className="text-[10px] font-semibold text-emerald-400/70 bg-emerald-500/[0.08] px-2 py-1 rounded-full">
                          {duration}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              {message.availability.length > 6 && (
                <div className="px-4 py-2.5 text-center text-[11px] text-slate-600 border-t border-white/[0.04]">
                  +{message.availability.length - 6} more slots
                </div>
              )}
            </motion.div>
          )}

          {/* AI Suggestions */}
          {!isUser && message.suggestions && message.suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-2.5 max-w-[90%] sm:max-w-[78%] w-full claude-data-card overflow-hidden"
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                <Zap className="h-3.5 w-3.5 text-amber-400/80" />
                <span className="text-[12px] font-semibold text-amber-400/70 uppercase tracking-wider">
                  Suggested Times
                </span>
              </div>
              <div className="p-3 flex flex-wrap gap-2">
                {message.suggestions.slice(0, 4).map((suggestion, index) => (
                  <button
                    key={index}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/[0.05] border border-amber-500/[0.1] hover:bg-amber-500/[0.1] hover:border-amber-500/[0.18] transition-all text-left group"
                    onClick={() => {
                      const input = document.querySelector('textarea[data-chat-input]') as HTMLTextAreaElement;
                      if (input) {
                        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
                        if (nativeInputValueSetter) {
                          nativeInputValueSetter.call(input, suggestion.time);
                          input.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                        input.focus();
                      }
                    }}
                  >
                    <p className="text-[13px] font-medium text-amber-300/80 group-hover:text-amber-200 transition-colors">
                      {formatMeetingTime(suggestion.time)}
                    </p>
                    {suggestion.reason && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{suggestion.reason}</p>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Success / Cancel Indicator */}
          {!isUser && (isSuccess || isCanceled) && !isTyping && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className={`mt-2 flex items-center gap-1.5 text-[11px] font-medium ${
                isSuccess ? 'text-emerald-400/70' : 'text-rose-400/70'
              }`}
            >
              <Check className="h-3 w-3" />
              <span>{isSuccess ? (message.meeting?.meeting_url ? 'Meeting created with link' : 'Action completed') : 'Event canceled'}</span>
            </motion.div>
          )}

          {/* Reminder Confirmation Badge */}
          {!isUser && message.reminder_confirmed && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500/[0.06] border border-orange-500/[0.12]"
            >
              <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-orange-500/10">
                <Bell className="h-3.5 w-3.5 text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-orange-300/90">Reminder confirmed</p>
                <p className="text-[10px] text-slate-500 flex items-center gap-1"><Mail className="h-2.5 w-2.5" /> Confirmation sent to your email</p>
              </div>
              <Check className="h-3.5 w-3.5 text-emerald-400/70 shrink-0" />
            </motion.div>
          )}

          {/* Timestamp */}
          {message.timestamp && (
            <span className="text-[10px] text-white/15 mt-1.5 tabular-nums">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}