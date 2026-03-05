import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { apiClient } from '../lib/api';

export default function HealthStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [latency, setLatency] = useState(0);

  useEffect(() => {
    const checkHealth = async () => {
      const start = Date.now();
      try {
        await apiClient.checkStatus();
        const end = Date.now();
        setLatency(end - start);
        setIsOnline(true);
      } catch {
        setIsOnline(false);
        setLatency(0);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000); // Check every 10s

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full glass border transition-all ${
      isOnline ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'
    }`}>
      {isOnline ? (
        <>
          <Wifi className="h-3 w-3 text-green-400" />
          <span className="text-xs text-green-400 font-medium">Online</span>
          {latency > 0 && (
            <span className="text-xs text-green-400/60">{latency}ms</span>
          )}
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3 text-red-400" />
          <span className="text-xs text-red-400 font-medium">Offline</span>
        </>
      )}
    </div>
  );
}
