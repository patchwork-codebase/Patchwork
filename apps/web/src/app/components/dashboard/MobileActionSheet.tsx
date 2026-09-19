import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { useAuth } from "../auth/AuthContext";

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

interface MobileActionSheetProps {
  fabActionSheetOpen: boolean;
  setFabActionSheetOpen: (open: boolean) => void;
  setComposerSheetOpen: (open: boolean) => void;
}

export function MobileActionSheet({ fabActionSheetOpen, setFabActionSheetOpen, setComposerSheetOpen }: MobileActionSheetProps) {
  const { profile } = useAuth();
  const isObserver = profile?.role === 'observer';

  if (isObserver) return null;

  return (
    <>
      <div className="fixed bottom-[110px] right-4 z-[40] sm:hidden">
        <button
          onClick={() => {
            if (!profile?.emailVerified && !(profile as any)?.email_verified) {
              toast.error("Please verify your email to post.");
              return;
            }
            setFabActionSheetOpen(true);
          }}
          className="w-14 h-14 bg-primary-500 hover:bg-[#5b4ed6] text-white rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(108,92,231,0.4)] active:scale-95 transition-transform"
        >
          <IconPlus />
        </button>
      </div>

      <AnimatePresence>
        {fabActionSheetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm sm:hidden flex flex-col justify-end"
            onClick={() => setFabActionSheetOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white dark:bg-[#111111] border-t border-slate-100 dark:border-white/10 rounded-t-3xl p-5 sm:p-6 pb-[env(safe-area-inset-bottom)] max-h-[85vh] overflow-y-auto shadow-sm dark:shadow-none"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6" />
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setFabActionSheetOpen(false);
                    setComposerSheetOpen(true);
                  }}
                  className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-left border border-slate-100 dark:border-white/5 active:scale-95 transition-all shadow-sm dark:shadow-none"
                >
                  <div className="w-10 h-10 rounded-full bg-primary-400/20 flex items-center justify-center text-primary-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-slate-900 dark:text-white">Post an update</div>
                    <div className="text-[12px] font-medium text-slate-500 dark:text-slate-400">Share what you're working on</div>
                  </div>
                </button>
                <Link
                  to="/dashboard/create"
                  className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-left border border-slate-100 dark:border-white/5 active:scale-95 transition-all shadow-sm dark:shadow-none"
                >
                  <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-500">
                    <IconPlus />
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-slate-900 dark:text-white">Create new room</div>
                    <div className="text-[12px] font-medium text-slate-500 dark:text-slate-400">Initialize a new project space</div>
                  </div>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
