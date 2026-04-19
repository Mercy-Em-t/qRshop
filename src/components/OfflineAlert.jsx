import { useState, useEffect } from "react";

/**
 * Premium floating indicator that warns users when they are offline,
 * and provides an explicit 'Retry' mechanism.
 */
export default function OfflineAlert({
  message = "Network disconnected. Viewing cached data.",
}) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      // Small ping to check true connectivity, avoiding cors cache
      await fetch(window.location.origin, { method: 'HEAD', cache: 'no-store' });
      if (navigator.onLine) {
         setIsOnline(true);
      }
    } catch (e) {
      // Still offline
    } finally {
      setIsRetrying(false);
    }
  };

  if (isOnline) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-5">
      <div className="bg-slate-900 border border-slate-700 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-4">
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-200 shadow-sm">{message}</p>
        <button 
           onClick={handleRetry} 
           disabled={isRetrying}
           className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ml-2 disabled:opacity-50"
        >
          {isRetrying ? 'Pinging...' : 'Retry'}
        </button>
      </div>
    </div>
  );
}
