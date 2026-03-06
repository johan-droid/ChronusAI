import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, TrendingUp, Users, Activity, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Layout from '../components/Layout';
import StatsCard from '../components/StatsCard';
import { useMeetings } from '../hooks/useMeetings';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../lib/api';

export default function StatsOverview() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: meetings, isLoading } = useMeetings();

  useEffect(() => {
    const checkAuth = async () => {
      const { accessToken, isAuthenticated } = useAuthStore.getState();
      if (!accessToken || !isAuthenticated) {
        navigate('/login');
        return;
      }
      try {
        await apiClient.getCurrentUser();
      } catch (error) {
        navigate('/login');
      }
    };
    checkAuth();
  }, [navigate]);

  const stats = {
    total: meetings?.length || 0,
    scheduled: meetings?.filter(m => m.status === 'scheduled').length || 0,
    canceled: meetings?.filter(m => m.status === 'canceled').length || 0,
    today: meetings?.filter(m => {
      const today = new Date().toDateString();
      return new Date(m.start_time).toDateString() === today;
    }).length || 0,
    thisWeek: meetings?.filter(m => {
      const now = new Date();
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const meetingDate = new Date(m.start_time);
      return meetingDate >= weekStart && meetingDate <= weekEnd;
    }).length || 0,
    thisMonth: meetings?.filter(m => {
      const now = new Date();
      const meetingDate = new Date(m.start_time);
      return meetingDate.getMonth() === now.getMonth() && meetingDate.getFullYear() === now.getFullYear();
    }).length || 0,
    upcoming: meetings?.filter(m => m.status === 'scheduled' && new Date(m.start_time) > new Date()).length || 0,
    totalAttendees: meetings?.reduce((sum, m) => sum + m.attendees.length, 0) || 0,
  };

  return (
    <Layout>
      <div className="min-h-screen relative overflow-hidden">
        <div className="stars" />
        <div className="space-particles" />
        
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-40 h-40 bg-gradient-to-r from-orange-500/15 to-red-500/10 rounded-full blur-2xl animate-float" style={{ top: '8%', left: '3%' }} />
          <div className="absolute w-32 h-32 bg-gradient-to-r from-purple-500/12 to-pink-500/8 rounded-full blur-2xl animate-float" style={{ top: '65%', right: '8%', animationDelay: '4s' }} />
        </div>

        <div className="relative z-10 p-6 max-w-7xl mx-auto">
          <header className="mb-8">
            <h1 className="text-4xl font-bold gradient-text mb-2">
              Welcome back, {user?.full_name || 'User'}
            </h1>
            <p className="text-muted-foreground">Here's your meeting overview</p>
          </header>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Overview Statistics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatsCard title="Total Meetings" value={stats.total} icon={<Calendar className="h-4 w-4" />} />
                  <StatsCard title="Scheduled" value={stats.scheduled} icon={<CheckCircle className="h-4 w-4" />} />
                  <StatsCard title="Upcoming" value={stats.upcoming} icon={<Clock className="h-4 w-4" />} />
                  <StatsCard title="Canceled" value={stats.canceled} icon={<XCircle className="h-4 w-4" />} />
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Time-based Analytics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatsCard title="Today" value={stats.today} icon={<AlertCircle className="h-4 w-4" />} description="Meetings scheduled for today" />
                  <StatsCard title="This Week" value={stats.thisWeek} icon={<Calendar className="h-4 w-4" />} description="Meetings this week" />
                  <StatsCard title="This Month" value={stats.thisMonth} icon={<TrendingUp className="h-4 w-4" />} description="Meetings this month" />
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Engagement Metrics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <StatsCard title="Total Attendees" value={stats.totalAttendees} icon={<Users className="h-4 w-4" />} description="Across all meetings" />
                  <StatsCard title="Avg. Attendees" value={stats.total > 0 ? (stats.totalAttendees / stats.total).toFixed(1) : 0} icon={<Users className="h-4 w-4" />} description="Per meeting" />
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
