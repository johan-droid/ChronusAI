import { Calendar, Clock, Users, Trash2 } from 'lucide-react';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'canceled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'rescheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="bg-card border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">{meeting.title}</h3>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDateTime(meeting.start_time)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{Math.round((new Date(meeting.end_time).getTime() - new Date(meeting.start_time).getTime()) / 60000)} min</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(meeting.status)}`}>
            {meeting.status}
          </span>
          {meeting.status === 'scheduled' && (
            <button
              onClick={handleDelete}
              disabled={deleteMeeting.isPending}
              aria-label="Cancel meeting"
              className="p-1 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
              title="Cancel meeting"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      
      {meeting.attendees.length > 0 && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{meeting.attendees.length} attendee{meeting.attendees.length !== 1 ? 's' : ''}</span>
          {meeting.attendees.slice(0, 3).map((attendee, index) => (
            <span key={index} className="text-xs bg-muted px-2 py-1 rounded">
              {attendee.email}
            </span>
          ))}
          {meeting.attendees.length > 3 && (
            <span className="text-xs">+{meeting.attendees.length - 3} more</span>
          )}
        </div>
      )}
      
      {meeting.description && (
        <p className="text-sm text-muted-foreground line-clamp-2">
          {meeting.description}
        </p>
      )}
    </div>
  );
}
