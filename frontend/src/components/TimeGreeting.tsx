import { useEffect, useState } from 'react';
import { Sun, Moon, Sunrise, Sunset } from 'lucide-react';

export default function TimeGreeting({ userName }: { userName?: string }) {
  const [greeting, setGreeting] = useState('');
  const [icon, setIcon] = useState<React.ReactNode>(null);

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      const name = userName || 'there';

      if (hour >= 5 && hour < 12) {
        setGreeting(`Good morning, ${name}`);
        setIcon(<Sunrise className="h-5 w-5 text-orange-400" />);
      } else if (hour >= 12 && hour < 17) {
        setGreeting(`Good afternoon, ${name}`);
        setIcon(<Sun className="h-5 w-5 text-yellow-400" />);
      } else if (hour >= 17 && hour < 21) {
        setGreeting(`Good evening, ${name}`);
        setIcon(<Sunset className="h-5 w-5 text-orange-500" />);
      } else {
        setGreeting(`Good night, ${name}`);
        setIcon(<Moon className="h-5 w-5 text-blue-300" />);
      }
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [userName]);

  return (
    <div className="flex items-center gap-2 text-foreground/80 animate-fade-in">
      {icon}
      <span className="text-sm font-medium">{greeting}</span>
    </div>
  );
}
