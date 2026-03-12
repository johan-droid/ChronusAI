import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

export default function AIGreeting({ userName }: { userName?: string }) {
  const [greeting, setGreeting] = useState('');
  const [localTime, setLocalTime] = useState('');

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      const name = userName || 'there';
      const period = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
      setGreeting(`Good ${period}, ${name}! Let's make today productive.`);
      setLocalTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 300000);
    return () => clearInterval(interval);
  }, [userName]);

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
