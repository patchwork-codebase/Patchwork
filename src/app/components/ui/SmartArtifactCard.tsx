import { useEffect, useState } from "react";
import { supabase } from "../auth/AuthContext";
import { Github, FileText, Sparkles } from "lucide-react";

export function SmartArtifactCard({ url }: { url: string }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // Call the edge function
    supabase.functions.invoke('summarize-artifact', {
      body: { url }
    }).then(({ data, error }) => {
      if (!mounted) return;
      if (!error && data?.success && data?.summary) {
        setSummary(data.summary);
      } else {
        setSummary("Failed to generate AI summary for this artifact.");
      }
      setLoading(false);
    });

    return () => { mounted = false; };
  }, [url]);

  const isGithub = url.includes('github.com');
  const isLinear = url.includes('linear.app');
  
  const Icon = isGithub ? Github : (isLinear ? FileText : FileText);
  const providerName = isGithub ? 'GitHub' : (isLinear ? 'Linear' : 'Link');

  return (
    <div className="mt-4 border border-slate-200 bg-slate-50 rounded-2xl overflow-hidden relative group">
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border-b border-slate-200 bg-white hover:bg-slate-50 transition">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-slate-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{providerName} Artifact</div>
          <div className="text-sm font-bold text-slate-900 truncate">{url}</div>
        </div>
      </a>
      <div className="p-4 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="text-[10px] font-bold text-primary-400 uppercase tracking-widest mb-1">AI Summary</div>
          {loading ? (
            <div className="flex flex-col gap-2 animate-pulse">
              <div className="h-3 bg-slate-200 rounded w-full"></div>
              <div className="h-3 bg-slate-200 rounded w-4/5"></div>
            </div>
          ) : (
            <p className="text-sm text-slate-700 leading-relaxed font-medium">
              {summary}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
