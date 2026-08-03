import { useSummarizeArtifact } from "../../hooks/useSummarizeArtifact";
import { Github, FileText, Sparkles } from "lucide-react";

export function SmartArtifactCard({ url }: { url: string }) {
  const { data: summary, isLoading, error } = useSummarizeArtifact(url);

  const isGithub = url.includes('github.com');
  const isLinear = url.includes('linear.app');
  const isClickUp = url.includes('clickup.com');
  const isJira = url.includes('atlassian.net');
  
  let Icon = FileText;
  let providerName = 'Link';
  if (isGithub) { Icon = Github; providerName = 'GitHub'; }
  else if (isLinear) { Icon = FileText; providerName = 'Linear'; }
  else if (isClickUp) { Icon = FileText; providerName = 'ClickUp'; }
  else if (isJira) { Icon = FileText; providerName = 'Jira'; }

  return (
    <div className="mt-4 border border-slate-100 bg-slate-50 rounded-2xl overflow-hidden relative group shadow-sm dark:shadow-none">
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-primary-400/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border-b border-slate-100 bg-white hover:bg-slate-50 transition shadow-sm dark:shadow-none">
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-slate-700" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{providerName} Artifact</div>
          <div className="text-sm font-bold text-slate-900 truncate">{url}</div>
        </div>
      </a>
      <div className="p-4 bg-slate-50 border-t border-slate-100 text-[13px] leading-relaxed text-slate-600 relative shadow-sm dark:shadow-none">
        <Sparkles className="w-4 h-4 absolute top-4 left-4 text-primary-400 opacity-50" />
        <div className="pl-6">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <span className="ml-2 text-slate-500 dark:text-slate-400 italic font-medium tracking-wide text-[12px]">Generating AI summary...</span>
            </div>
          ) : error ? (
            <p className="text-rose-500 italic">{(error as Error).message || "Failed to generate AI summary for this artifact."}</p>
          ) : (
            <p className="italic">{summary}</p>
          )}
        </div>
      </div>
    </div>
  );
}
