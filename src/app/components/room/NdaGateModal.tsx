import { motion, AnimatePresence } from 'motion/react';
import { FileText, Loader2, ShieldAlert, X, CheckCircle } from 'lucide-react';
import { useNdaTemplate, useAcceptNda } from '../../hooks/useNda';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

interface NdaGateModalProps {
  roomId: string;
  roomTitle: string;
  builderName: string;
  /** Custom NDA text from the room. If null/undefined, uses the global template. */
  customNdaText?: string | null;
  onAccepted: () => void;
}

/**
 * Full-screen modal displayed before a user can enter an NDA-protected room.
 * Requires explicit acceptance of the confidentiality agreement.
 */
export function NdaGateModal({
  roomId,
  roomTitle,
  builderName,
  customNdaText,
  onAccepted,
}: NdaGateModalProps) {
  const navigate = useNavigate();
  const { data: template, isLoading: templateLoading } = useNdaTemplate();
  const acceptMutation = useAcceptNda(roomId);

  const ndaBody = customNdaText || template?.body || '';
  const ndaTitle = template?.title || 'Confidentiality Agreement';

  const handleAccept = async () => {
    try {
      await acceptMutation.mutateAsync();
      toast.success('NDA accepted. Welcome to the room.');
      onAccepted();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to accept NDA');
    }
  };

  const handleDecline = () => {
    toast('You declined the NDA. Access denied.', { icon: '🚫' });
    navigate('/dashboard');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 16 }}
          transition={{ type: 'spring', damping: 28, stiffness: 340 }}
          className="bg-white rounded-[28px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-br from-slate-900 to-slate-800 p-8 pb-6 shrink-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-400/10 rounded-full blur-[80px] pointer-events-none" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-primary-400/20 border border-primary-400/30 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6 text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary-400 bg-primary-400/10 border border-primary-400/20 px-2.5 py-1 rounded-full mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
                  NDA Protected
                </div>
                <h2 className="text-[20px] font-extrabold text-slate-900 dark:text-white font-display leading-tight mb-1">
                  {ndaTitle}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-[13px] font-medium">
                  <span className="text-slate-900 dark:text-white font-bold">{builderName}</span> requires you to accept this agreement before accessing <span className="text-slate-900 dark:text-white font-bold">"{roomTitle}"</span>.
                </p>
              </div>
            </div>
          </div>

          {/* NDA Body */}
          <div className="flex-1 overflow-y-auto px-8 py-6 min-h-0">
            {templateLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Agreement Terms
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 max-h-[340px] overflow-y-auto shadow-sm dark:shadow-none">
                  <pre className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
                    {ndaBody}
                  </pre>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-4 leading-relaxed">
                  Your acceptance is recorded with a timestamp and associated with your Patchwork account. This record is available to the builder and may be used as evidence of agreement.
                </p>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="px-8 pb-8 pt-4 border-t border-slate-100 shrink-0">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleDecline}
                className="w-full sm:w-auto px-6 py-3 text-[14px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all focus-ring"
              >
                <span className="flex items-center justify-center gap-2">
                  <X className="w-4 h-4" />
                  Decline & Leave
                </span>
              </button>
              <button
                onClick={handleAccept}
                disabled={acceptMutation.isPending || templateLoading}
                className="flex-1 sm:flex-none px-8 py-3 text-[14px] font-bold text-white bg-primary-400 hover:bg-[#7b6ce8] rounded-xl transition-all shadow-lg shadow-primary-400/20 focus-ring disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {acceptMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Recording acceptance...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Accept & Enter
                  </span>
                )}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center mt-3">
              By clicking "Accept & Enter", you digitally sign this agreement. Your acceptance is timestamped and cannot be undone.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
