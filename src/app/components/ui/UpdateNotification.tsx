import { useState, useEffect } from 'react';
import { Info } from 'lucide-react';

export default function UpdateNotification() {
  const [hasNewVersion, setHasNewVersion] = useState(false);

  useEffect(() => {
    // Only run polling in production, but we can test the UI in dev if we artificially set hasNewVersion
    if (import.meta.env.DEV) return;

    let currentEtag: string | null = null;
    let currentLastModified: string | null = null;

    const checkVersion = async () => {
      try {
        const response = await fetch('/', { 
          method: 'HEAD',
          cache: 'no-store'
        });
        
        const newEtag = response.headers.get('etag');
        const newLastModified = response.headers.get('last-modified');
        
        if (!currentEtag && !currentLastModified) {
          currentEtag = newEtag;
          currentLastModified = newLastModified;
        } else if (
          (currentEtag && newEtag && currentEtag !== newEtag) ||
          (currentLastModified && newLastModified && currentLastModified !== newLastModified)
        ) {
          setHasNewVersion(true);
        }
      } catch (e) {
        // Ignore network errors
      }
    };

    // Check on an interval (e.g., every 1 minute)
    const interval = setInterval(checkVersion, 60000);
    
    // Also check when window regains focus
    const onFocus = () => checkVersion();
    window.addEventListener('focus', onFocus);

    // Listen for Vite's chunk loading errors which indicates a new deployment deleted old chunks
    const onViteError = (e: Event) => {
      if (e.type === 'vite:preloadError') {
        setHasNewVersion(true);
      }
    };
    window.addEventListener('vite:preloadError', onViteError);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('vite:preloadError', onViteError);
    };
  }, []);

  if (!hasNewVersion) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[100] max-w-[400px] w-[calc(100vw-32px)] sm:w-auto animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-[#242424] border border-white/[0.08] rounded-xl p-5 shadow-2xl">
        <div className="flex gap-4 items-start">
          <div className="bg-white/10 rounded-lg p-1.5 shrink-0 mt-0.5">
            <Info className="w-5 h-5 text-slate-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-[15px] mb-1">A new version of this page is available</h3>
            <p className="text-slate-400 text-[14px]">Refresh to see the latest changes.</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-5">
          <button 
            onClick={() => setHasNewVersion(false)}
            className="px-4 py-2 rounded-lg text-[13px] font-bold text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors border border-white/[0.08]"
          >
            Not now
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="px-5 py-2 bg-[#00875A] hover:bg-[#00704A] text-white rounded-lg text-[13px] font-bold transition-colors shadow-sm"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}
