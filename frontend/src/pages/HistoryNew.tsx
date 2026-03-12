import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MessageSquare, Users, MapPin, Search, ArrowUpDown, Bell, X, Check } from 'lucide-react';
import { useMeetings, useUpdateMeeting } from '../hooks/useMeetings';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../lib/api';
import ReminderPicker from '../components/ReminderPicker';
import type { Meeting } from '../types';

export default function History() {
  const navigate = useNavigate();
  const { data: meetings, isLoading } = useMeetings();
  const updateMeeting = useUpdateMeeting();
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  // reminder editing state
  const [reminderMeeting, setReminderMeeting] = useState<Meeting | null>(null);
  const [pendingMinutes, setPendingMinutes] = useState<number[]>([]);
  const [pendingMethods, setPendingMethods] = useState<string[]>(['email']);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const openReminderModal = (meeting: Meeting) => {
    setReminderMeeting(meeting);
    setPendingMinutes(meeting.reminder_schedule_minutes ?? []);
    setPendingMethods(meeting.reminder_methods ?? ['email']);
    setSaveSuccess(false);
  };

  const closeReminderModal = () => {
    setReminderMeeting(null);
    setSaveSuccess(false);
  };

  const saveReminders = () => {
    if (!reminderMeeting) return;
    updateMeeting.mutate(
      {
        id: reminderMeeting.id,
        updates: {
          reminder_schedule_minutes: pendingMinutes,
          reminder_methods: pendingMethods,
        },
      },
      {
        onSuccess: () => {
          setSaveSuccess(true);
          setTimeout(closeReminderModal, 900);
        },
      },
    );
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { accessToken, isAuthenticated } = useAuthStore.getState();
      if (!accessToken || !isAuthenticated) {
        navigate('/login');
        return;
      }
      try {
        await apiClient.getCurrentUser();
      } catch {
        navigate('/login');
      }
    };
    checkAuth();
  }, [navigate]);

  const filteredMeetings = meetings?.filter(m => {
    const matchesFilter = filter === 'all' || m.status === filter;
    const matchesSearch = !searchTerm ||
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.attendees.some((a: { email?: string }) => a.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  }).sort((a, b) => {
    const diff = new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    return sortOrder === 'desc' ? -diff : diff;
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'scheduled': return { class: 'history-status--scheduled', label: 'Scheduled' };
      case 'canceled': return { class: 'history-status--canceled', label: 'Canceled' };
      case 'rescheduled': return { class: 'history-status--rescheduled', label: 'Rescheduled' };
      default: return { class: 'history-status--default', label: status };
    }
  };

  const statusCounts = {
    all: meetings?.length || 0,
    scheduled: meetings?.filter(m => m.status === 'scheduled').length || 0,
    canceled: meetings?.filter(m => m.status === 'canceled').length || 0,
    rescheduled: meetings?.filter(m => m.status === 'rescheduled').length || 0,
  };

  return (
    <div className="min-h-screen bg-[#09090B] relative overflow-x-hidden">
      <div className="page-bg" />
      <div className="page-grid-overlay" />

      {/* Reminder edit modal */}
      {reminderMeeting && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) closeReminderModal(); }}
        >
          <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-white">Edit Reminders</h3>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{reminderMeeting.title}</p>
              </div>
              <button
                onClick={closeReminderModal}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ReminderPicker
              minutes={pendingMinutes}
              methods={pendingMethods}
              onChange={(m, mt) => { setPendingMinutes(m); setPendingMethods(mt); }}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeReminderModal}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveReminders}
                disabled={updateMeeting.isPending || saveSuccess}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2
                  bg-orange-500 hover:bg-orange-600 disabled:opacity-70 text-white"
              >
                {saveSuccess ? (
                  <><Check className="h-4 w-4" /> Saved!</>
                ) : updateMeeting.isPending ? (
                  'Saving…'
                ) : (
                  'Save reminders'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="saas-main px-3 sm:px-4 lg:px-6 overflow-y-auto pb-12">
        {/* Page Header */}
        <div className="mb-4 sm:mb-6 fade-in-up">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">Meeting History</h1>
              <p className="text-xs sm:text-sm text-slate-400">View and manage all your meetings</p>
            </div>
          </div>
        </div>

        {/* Toolbar - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 fade-in-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search meetings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <button
            onClick={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-slate-300 hover:bg-white/[0.05] active:scale-[0.98] transition-all"
            title={sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}
          >
            <ArrowUpDown className="h-4 w-4" />
            <span className="sm:hidden">{sortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
          </button>
        </div>

        {/* Filter Tabs - Horizontal scroll on mobile */}
        <div className="mb-4 fade-in-up overflow-x-auto scrollbar-hide" style={{ animationDelay: '0.1s' }}>
          <div className="flex gap-2 min-w-max pb-1">
            {(['all', 'scheduled', 'canceled', 'rescheduled'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${filter === status 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white/[0.03] text-slate-400 border border-white/10 hover:bg-white/[0.05]'
                }`}
              >
                <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-white/10 rounded-full">{statusCounts[status]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Meetings List */}
        {isLoading ? (
          <div className="saas-loader">
            <div className="saas-loader-spinner" />
            <p>Loading meetings...</p>
          </div>
        ) : filteredMeetings && filteredMeetings.length > 0 ? (
          <div className="history-list fade-in-up space-y-3" style={{ animationDelay: '0.15s' }}>
            {filteredMeetings.map((meeting, index) => {
              const statusConfig = getStatusConfig(meeting.status);
              const startDate = new Date(meeting.start_time);
              const isToday = new Date().toDateString() === startDate.toDateString();
              
              return (
                <div 
                  key={meeting.id} 
                  className="bg-white/[0.03] backdrop-blur-md hover:bg-white/[0.06] border border-white/10 rounded-2xl p-5 transition-all active:scale-[0.99] touch-manipulation shadow-lg group"
                  style={{ animationDelay: `${0.05 * index}s` }}
                >
                  {/* Modern Mobile Card Layout */}
                  <div className="flex gap-3">
                    {/* Left: Date Column - Compact */}
                    <div className="flex flex-col items-center min-w-[52px]">
                      <span className={`text-xs font-bold uppercase tracking-wider ${isToday ? 'text-blue-400' : 'text-slate-500'}`}>
                        {isToday ? 'TODAY' : startDate.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-2xl font-black text-white leading-none mt-0.5">
                        {startDate.getDate()}
                      </span>
                      <span className="text-[10px] text-slate-600 mt-0.5">
                        {startDate.toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                    </div>

                    {/* Right: Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title & Status Row */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="text-sm sm:text-base font-bold text-white leading-tight line-clamp-2">
                          {meeting.title}
                        </h3>
                        <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight border ${statusConfig.class}`}>
                          {statusConfig.label}
                        </span>
                      </div>

                      {/* Description */}
                      {meeting.description && (
                        <p className="text-xs text-slate-400 line-clamp-1 mb-2">{meeting.description}</p>
                      )}

                      {/* Info Pills Row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1 text-[11px] text-slate-300">
                          <Clock className="h-3 w-3 text-blue-400" />
                          <span>{startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                        </div>
                        <span className="text-slate-600">•</span>
                        <div className="flex items-center gap-1 text-[11px] text-slate-300">
                          <Users className="h-3 w-3 text-purple-400" />
                          <span>{meeting.attendees.length}</span>
                        </div>
                        {meeting.provider && (
                          <>
                            <span className="text-slate-600">•</span>
                            <div className="flex items-center gap-1 text-[11px] text-slate-300">
                              <MapPin className="h-3 w-3 text-emerald-400" />
                              <span className="capitalize">{meeting.provider}</span>
                            </div>
                          </>
                        )}
                        {/* Show existing reminders summary */}
                        {(meeting.reminder_schedule_minutes?.length ?? 0) > 0 && (
                          <>
                            <span className="text-slate-600">•</span>
                            <div className="flex items-center gap-1 text-[11px] text-orange-400/80">
                              <Bell className="h-3 w-3" />
                              <span>
                                {[...(meeting.reminder_schedule_minutes ?? [])]
                                  .sort((a, b) => a - b)
                                  .map((m) => (m === 1440 ? '1 day' : m >= 60 ? `${m / 60}h` : `${m}m`))
                                  .join(', ')}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions row */}
                  {meeting.status !== 'canceled' && (
                    <div className="mt-3 pt-3 border-t border-white/5 flex justify-end">
                      <button
                        onClick={() => openReminderModal(meeting)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 bg-white/[0.03] border border-white/10 hover:bg-white/[0.07] hover:text-orange-400 hover:border-orange-500/30 transition-all"
                      >
                        <Bell className="h-3.5 w-3.5" />
                        {(meeting.reminder_schedule_minutes?.length ?? 0) > 0 ? 'Edit reminders' : 'Set reminders'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="history-empty fade-in-up">
            <Calendar className="h-16 w-16" />
            <h3>No meetings found</h3>
            <p>Try adjusting your filters or search term, or schedule a new meeting via AI Chat</p>
            <button onClick={() => navigate('/chat')} className="history-empty-btn">
              <MessageSquare className="h-4 w-4" />
              Go to Chat
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
