import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Activity } from 'lucide-react';
import { apiClient } from '../lib/api';

export default function HealthStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [latency, setLatency] = useState(0);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      setChecking(true);
      const start = performance.now();
      try {
        await apiClient.checkStatus();
        const end = performance.now();
        setLatency(Math.round(end - start));
        setIsOnline(true);
      } catch {
        setIsOnline(false);
        setLatency(0);
      } finally {
        setChecking(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 5000);

    return () => clearInterval(interval);
  }, []);

  const getLatencyColor = () => {
    if (latency < 100) return 'text-green-400';
    if (latency < 300) return 'text-yellow-400';
    return 'text-orange-400';
  };

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg glass-card transition-all duration-300 ${
      isOnline ? 'border-green-500/20' : 'border-red-500/20'
    }`}>
      <div className="relative">
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4 text-green-400" />
            {checking && (
              <Activity className="h-2 w-2 text-green-400 absolute -top-1 -right-1 animate-pulse" />
            )}
          </>
        ) : (
          <WifiOff className="h-4 w-4 text-red-400 animate-pulse" />
        )}
      </div>
      <div className="flex flex-col">
        <span className={`text-xs font-semibold ${
          isOnline ? 'text-green-400' : 'text-red-400'
        }`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
        {isOnline && latency > 0 && (
          <span className={`text-[10px] ${getLatencyColor()}`}>
            {latency}ms
          </span>
        )}
      </div>
    </div>
  );
}
