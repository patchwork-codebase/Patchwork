import { useState, useEffect } from 'react';
import { X, Link as LinkIcon, Plus, Loader2, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useAddIntegration } from '../../hooks/useRoomIntegrations';
import {
  INTEGRATION_CONFIG,
  getPlatformFromUrl,
  IntegrationPlatformIcon,
} from './IntegrationIcons';

interface AddIntegrationModalProps {
  open: boolean;
  onClose: () => void;
  roomId: string;
  builderId: string;
}

const SUPPORTED_PLATFORMS = ['github', 'figma', 'notion', 'linear', 'miro'] as const;

export function AddIntegrationModal({
  open,
  onClose,
  roomId,
  builderId,
}: AddIntegrationModalProps) {
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState<string | null>(null);
  const [urlError, setUrlError] = useState('');
  const [show, setShow] = useState(false);

  const addIntegration = useAddIntegration(roomId);

  useEffect(() => {
    if (open) {
      setTimeout(() => setShow(true), 10);
    } else {
      setShow(false);
      setTimeout(() => {
        setUrl('');
        setLabel('');
        setDetectedPlatform(null);
        setUrlError('');
      }, 300);
    }
  }, [open]);

  useEffect(() => {
    if (!url.trim()) {
      setDetectedPlatform(null);
      setUrlError('');
      return;
    }
    const platform = getPlatformFromUrl(url.trim());
    setDetectedPlatform(platform);
    setUrlError(platform ? '' : 'URL not recognised. Try a GitHub repo, Figma file, or Notion page.');
  }, [url]);

  async function handleAdd() {
    if (!detectedPlatform || !url.trim()) return;
    try {
      await addIntegration.mutateAsync({
        platform: detectedPlatform,
        url: url.trim(),
        label: label.trim() || undefined,
        builderId,
      });
      toast.success(`${INTEGRATION_CONFIG[detectedPlatform]?.label} integration added!`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add integration');
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-full max-w-md bg-[#0D0B14] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div>
            <h2 className="text-[16px] font-extrabold text-white">Add Integration</h2>
            <p className="text-[12px] text-slate-400 mt-0.5">Connect a tool to your Build Room</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Supported platforms quick-pick */}
        <div className="px-5 pt-4">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Supported platforms</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {SUPPORTED_PLATFORMS.map(p => {
              const cfg = INTEGRATION_CONFIG[p];
              const isDetected = detectedPlatform === p;
              return (
                <div
                  key={p}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[12px] font-semibold transition-all ${
                    isDetected
                      ? 'bg-[#6C5CE7]/20 border-[#6C5CE7]/40 text-[#8B7CF8]'
                      : 'bg-white/[0.02] border-white/[0.06] text-slate-400'
                  }`}
                >
                  <IntegrationPlatformIcon platform={p} className="w-3.5 h-3.5" />
                  {cfg.label}
                  {isDetected && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* URL Input */}
        <div className="px-5 pb-4 space-y-3">
          <div>
            <label className="block text-[12px] font-bold text-slate-300 mb-2">
              Paste URL <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="github.com/user/repo  •  figma.com/file/…  •  notion.so/…"
                className={`w-full pl-9 pr-4 py-3 bg-white/[0.03] border rounded-xl text-[13px] text-white placeholder-slate-600 focus:outline-none focus:ring-1 transition-all ${
                  urlError
                    ? 'border-rose-500/50 focus:border-rose-500/70 focus:ring-rose-500/30'
                    : detectedPlatform
                    ? 'border-emerald-500/40 focus:border-emerald-500/60 focus:ring-emerald-500/20'
                    : 'border-white/[0.08] focus:border-[#8B7CF8]/50 focus:ring-[#8B7CF8]/20'
                }`}
                autoFocus
              />
            </div>
            <AnimatePresence>
              {urlError && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-[11px] text-rose-400 mt-1.5"
                >
                  {urlError}
                </motion.p>
              )}
              {detectedPlatform && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 mt-1.5"
                >
                  <IntegrationPlatformIcon platform={detectedPlatform} className="w-3.5 h-3.5 text-emerald-400" />
                  <p className="text-[11px] text-emerald-400 font-semibold">
                    {INTEGRATION_CONFIG[detectedPlatform]?.label} detected
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-slate-300 mb-2">
              Label <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              maxLength={40}
              placeholder="e.g. Design System, Main Repo…"
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-[13px] text-white placeholder-slate-600 focus:outline-none focus:border-[#8B7CF8]/50 focus:ring-1 focus:ring-[#8B7CF8]/20 transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] text-slate-300 font-bold text-[13px] rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!detectedPlatform || addIntegration.isPending}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#6C5CE7] hover:bg-[#5B4ED6] disabled:bg-[#6C5CE7]/30 disabled:cursor-not-allowed text-white font-bold text-[13px] rounded-xl transition-all shadow-lg active:scale-95"
          >
            {addIntegration.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Adding…</>
            ) : (
              <><Plus className="w-4 h-4" /> Add Integration</>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
