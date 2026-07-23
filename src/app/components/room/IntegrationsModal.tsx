import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, Play, RefreshCw, Layers, CheckCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useRoomIntegrations } from '../../hooks/useRoomIntegrations';

interface IntegrationsModalProps {
  open: boolean;
  onClose: () => void;
  roomId: string;
  roomTitle: string;
}

export function IntegrationsModal({ open, onClose, roomId, roomTitle }: IntegrationsModalProps) {
  const { data: integrations = [], setupIntegration, triggerTestEvent, isLoading } = useRoomIntegrations(roomId);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!open) return null;

  const githubIntegration = integrations.find(i => i.provider === 'github');
  const linearIntegration = integrations.find(i => i.provider === 'linear');

  const getWebhookUrl = (provider: 'github' | 'linear', token?: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/v1/webhooks/${provider}?roomId=${roomId}&secret=${token || 'GENERATE_KEY'}`;
  };

  const copyUrl = (provider: 'github' | 'linear', token?: string) => {
    const url = getWebhookUrl(provider, token);
    navigator.clipboard.writeText(url);
    setCopiedKey(provider);
    toast.success(`${provider === 'github' ? 'GitHub' : 'Linear'} Webhook URL copied!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-500/10 border border-primary-500/20 text-primary-600 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 font-display">Automated Webhook Sync</h3>
                <p className="text-xs text-slate-500 font-medium">Auto-stream GitHub commits & Linear issues into <strong className="text-slate-800">{roomTitle}</strong></p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
            {/* GitHub Integration Card */}
            <div className="p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                    GH
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      GitHub Repo Commits & PRs
                      {githubIntegration && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-200">
                          Active
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-500">Auto-post git commits, branch pushes, and merged PRs to feed.</p>
                  </div>
                </div>
              </div>

              {!githubIntegration ? (
                <button
                  onClick={() => setupIntegration.mutate({ provider: 'github' })}
                  disabled={setupIntegration.isPending}
                  className="w-full mt-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Connect GitHub Webhook
                </button>
              ) : (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Webhook Payload URL (Add to GitHub Repo Settings)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={getWebhookUrl('github', githubIntegration.secret_token)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 truncate select-all"
                      />
                      <button
                        onClick={() => copyUrl('github', githubIntegration.secret_token)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        {copiedKey === 'github' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedKey === 'github' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => triggerTestEvent.mutate({ provider: 'github' })}
                      disabled={triggerTestEvent.isPending}
                      className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Stream Test Commit Event
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Linear Integration Card */}
            <div className="p-5 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                    LN
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      Linear Issues & Roadmaps
                      {linearIntegration && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-200">
                          Active
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-500">Auto-post completed Linear issues and status updates to feed.</p>
                  </div>
                </div>
              </div>

              {!linearIntegration ? (
                <button
                  onClick={() => setupIntegration.mutate({ provider: 'linear' })}
                  disabled={setupIntegration.isPending}
                  className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Connect Linear Webhook
                </button>
              ) : (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Webhook Payload URL (Add to Linear Team Settings)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={getWebhookUrl('linear', linearIntegration.secret_token)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 truncate select-all"
                      />
                      <button
                        onClick={() => copyUrl('linear', linearIntegration.secret_token)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        {copiedKey === 'linear' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedKey === 'linear' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => triggerTestEvent.mutate({ provider: 'linear' })}
                      disabled={triggerTestEvent.isPending}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Stream Test Issue Event
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
