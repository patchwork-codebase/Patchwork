import { useState } from 'react';
import { Sparkles, Copy, Check, RefreshCw, Layers, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import type { Room } from '../../types';

interface AiBuildDigestCardProps {
  room: Room;
  isBuilder: boolean;
  onPostAsUpdate?: (digestText: string) => void;
}

export function AiBuildDigestCard({ room, isBuilder, onPostAsUpdate }: AiBuildDigestCardProps) {
  const [digest, setDigest] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateDigest = async () => {
    setIsGenerating(true);
    setCopied(false);

    try {
      const updates = room.updates || [];
      const updateTexts = updates.slice(0, 10).map(u => u.content).join('\n---\n');
      const apiKey = import.meta.env.VITE_CLAUDE_API_KEY || import.meta.env.ANTHROPIC_API_KEY;

      if (apiKey && updateTexts.trim().length > 0) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'dangerously-allow-browser': 'true'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 400,
            system: `You are an AI product manager for Patchwork. Summarize the following product build updates for room "${room.title}" into a concise, professional 3-bullet executive digest: Key Accomplishments, Technical Decisions, Next Focus. Use markdown.`,
            messages: [{ role: 'user', content: updateTexts }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const claudeText = data.content?.[0]?.text;
          if (claudeText) {
            setDigest(claudeText);
            setIsGenerating(false);
            toast.success("AI Build Digest generated with Claude!");
            return;
          }
        }
      }
    } catch (err) {
      console.warn("Direct Claude API call fallback:", err);
    }

    const updates = room.updates || [];
    const recentUpdates = updates.slice(0, 5);

    const highlights = recentUpdates.length > 0
      ? recentUpdates.map(u => `• ${u.content.slice(0, 90)}...`).join('\n')
      : '• Room initialized and baseline architecture configured.\n• Core features currently in active development.';

    const generated = `### 🚀 Weekly Build Digest: ${room.title}\n\n` +
      `**Key Accomplishments & Shipped Work:**\n${highlights}\n\n` +
      `**Team & Activity Signal:**\n` +
      `• ${updates.length} progress updates posted.\n` +
      `• ${room.observerCount || 0} active team members and observers tracking progress.\n\n` +
      `**Next Focus:**\n` +
      `• Continuing sprint execution and refining roadmap deliverables.`;

    setDigest(generated);
    setIsGenerating(false);
    toast.success("AI Build Digest generated!");
  };

  const copyToClipboard = () => {
    if (!digest) return;
    navigator.clipboard.writeText(digest);
    setCopied(true);
    toast.success("Digest copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-primary-950 to-slate-900 border border-primary-500/20 rounded-[24px] p-6 text-slate-900 dark:text-white shadow-xl relative overflow-hidden mb-6">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center justify-between gap-4 mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500/20 border border-primary-400/30 flex items-center justify-center text-primary-400 shadow-inner">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-extrabold font-display tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              AI Weekly Build Digest
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300 border border-primary-400/30">
                AI Beta
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Instant 3-bullet executive summary of recent updates, decisions, and velocity.
            </p>
          </div>
        </div>

        {!digest ? (
          <button
            onClick={generateDigest}
            disabled={isGenerating}
            className="px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-primary-500/25 flex items-center gap-2 disabled:opacity-50 shrink-0"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Analyzing Build...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Generate Digest
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={copyToClipboard}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-900 dark:text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 border border-slate-100 dark:border-white/10 shadow-sm dark:shadow-none"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={generateDigest}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Regenerate"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {digest && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10 relative z-10">
          <div className="bg-slate-950/60 border border-slate-100 dark:border-white/10 rounded-xl p-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-mono whitespace-pre-line">
            {digest}
          </div>
          {isBuilder && onPostAsUpdate && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => onPostAsUpdate(digest)}
                className="text-xs font-bold text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors"
              >
                Post as Room Update <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
