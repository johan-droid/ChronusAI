import { useState } from 'react';
import { Trash2, CheckCircle } from 'lucide-react';
import { clearAllCache } from '../lib/cache';

export default function CacheCleaner() {
  const [cleared, setCleared] = useState(false);

  const handleClearCache = () => {
    clearAllCache();
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  };

  return (
    <button
      onClick={handleClearCache}
      className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-md transition-colors"
      title="Clear all cached data"
    >
      {cleared ? (
        <>
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="hidden md:inline">Cleared</span>
        </>
      ) : (
        <>
          <Trash2 className="h-4 w-4" />
          <span className="hidden md:inline">Clear Cache</span>
        </>
      )}
    </button>
  );
}
