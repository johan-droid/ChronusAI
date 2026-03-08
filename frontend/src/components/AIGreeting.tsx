import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { apiClient } from '../lib/api';

export default function AIGreeting({ userName }: { userName?: string }) {
  const [greeting, setGreeting] = useState('');
  const [localTime, setLocalTime] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGreeting = async () => {
      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const response = await apiClient.get(`/greetings/personalized?timezone=${timezone}`) as any;
        setGreeting(response.data.greeting);
        setLocalTime(response.data.local_time);
      } catch (error) {
        const hour = new Date().getHours();
        const name = userName || 'there';
        const period = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
        setGreeting(`Good ${period}, ${name}! Let's make today productive.`);
        setLocalTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
      } finally {
        setLoading(false);
      }
    };

    fetchGreeting();
    const interval = setInterval(fetchGreeting, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [userName]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
        <Sparkles className="h-4 w-4" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-accent animate-pulse" />
        <h2 className="text-xl sm:text-2xl font-bold gradient-text">{greeting}</h2>
      </div>
      <p className="text-xs text-muted-foreground ml-6">{localTime} • Your local time</p>
    </div>
  );
}
