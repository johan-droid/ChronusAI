import { Calendar, Clock, Users, Trash2, MapPin, Video } from 'lucide-react';
import type { Meeting } from '../types';
import { useDeleteMeeting } from '../hooks/useMeetings';

interface MeetingCardProps {
  meeting: Meeting;
}

export default function MeetingCard({ meeting }: MeetingCardProps) {
  const deleteMeeting = useDeleteMeeting();
  
  const handleDelete = () => {
    if (confirm('Are you sure you want to cancel this meeting?')) {
      deleteMeeting.mutate(meeting.id);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString([], {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDuration = () => {
    const start = new Date(meeting.start_time);
    const end = new Date(meeting.end_time);
    const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
    return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'canceled':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'rescheduled':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '●';
      case 'canceled':
        return '✕';
      case 'rescheduled':
        return '⟳';
      default:
        return '○';
    }
  };

  return (
    <div className="glass rounded-xl p-4 space-y-3 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] hover:scale-[1.02] group relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground font-['Orbitron'] text-lg truncate group-hover:text-primary transition-colors">
              {meeting.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 text-xs rounded-full border font-['Space_Mono'] ${getStatusColor(meeting.status)}`}>
                {getStatusIcon(meeting.status)} {meeting.status}
              </span>
              <span className="text-xs text-muted-foreground font-['Space_Mono']">
                {getDuration()}
              </span>
            </div>
          </div>
          
          {meeting.status === 'scheduled' && (
            <button
              onClick={handleDelete}
              disabled={deleteMeeting.isPending}
              className="p-2 rounded-lg hover:bg-destructive/20 hover:text-destructive transition-all disabled:opacity-50 hover:scale-110 hover:rotate-12"
              title="Cancel meeting"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Time and Date */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <span className="font-['Space_Mono']">{formatDateTime(meeting.start_time)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="p-1.5 rounded-md bg-secondary/10">
              <Clock className="h-4 w-4 text-secondary" />
            </div>
            <span className="font-['Space_Mono']">
              {formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}
            </span>
          </div>
        </div>

        {/* Attendees */}
        {meeting.attendees && meeting.attendees.length > 0 && (
          <div className="flex items-start gap-2 text-sm mb-3">
            <div className="p-1.5 rounded-md bg-accent/10 mt-0.5">
              <Users className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-1">
                {meeting.attendees.slice(0, 2).map((attendee, index) => (
                  <span 
                    key={index} 
                    className="px-2 py-1 rounded-md bg-muted/50 text-xs truncate font-['Space_Mono']"
                  >
                    {attendee.email}
                  </span>
                ))}
                {meeting.attendees.length > 2 && (
                  <span className="px-2 py-1 rounded-md bg-primary/20 text-primary text-xs font-['Space_Mono']">
                    +{meeting.attendees.length - 2} more
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        {meeting.description && (
          <div className="text-sm text-muted-foreground line-clamp-2 border-t border-primary/10 pt-3 font-['Space_Mono']">
            {meeting.description}
          </div>
        )}

        {/* Provider badge */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-primary/10">
          <div className="flex items-center gap-2">
            {meeting.provider === 'google' ? (
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-xs">
                <Video className="h-3 w-3" />
                <span>Google Meet</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-1 rounded bg-purple-500/10 text-purple-400 text-xs">
                <Video className="h-3 w-3" />
                <span>Teams</span>
              </div>
            )}
          </div>
          
          {meeting.external_event_id && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate max-w-[100px]">Synced</span>
            </div>
          )}
        </div>
      </div>

      {/* Hover indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
    </div>
  );
}
