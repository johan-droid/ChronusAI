import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { useMeetings } from '../hooks/useMeetings';
import Button from '../components/Button';
import Layout from '../components/Layout';

export default function MeetingHistory() {
  const navigate = useNavigate();
  const { data: meetings, isLoading } = useMeetings();

  const pastMeetings = useMemo(() => {
    const now = Date.now();
    return (meetings || [])
      .filter((m) => new Date(m.start_time).getTime() < now)
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
  }, [meetings]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Calendar className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">Meeting History</h1>
              <p className="text-sm text-muted-foreground">Past scheduled, canceled, and rescheduled meetings</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        <div className="space-y-4">
          <div className="bg-card border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Past meetings</h2>
              <span className="text-sm text-muted-foreground">
                {isLoading ? 'Loading…' : `${pastMeetings.length} meeting(s)`}
              </span>
            </div>

            {isLoading ? (
              <div className="p-6 text-muted-foreground">Loading…</div>
            ) : pastMeetings.length === 0 ? (
              <div className="p-6 text-muted-foreground">No past meetings yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-background/50">
                    <tr className="text-left">
                      <th className="px-4 py-3 font-medium text-muted-foreground">Title</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">When</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Attendees</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastMeetings.map((m) => (
                      <tr key={m.id} className="border-t">
                        <td className="px-4 py-3 text-foreground">{m.title}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(m.start_time).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{m.attendees.length}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            m.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                            m.status === 'canceled' ? 'bg-red-100 text-red-800' :
                            m.status === 'rescheduled' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

