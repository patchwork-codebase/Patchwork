import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, RefreshCw, LogOut } from 'lucide-react';
import { useAuth, sendVerificationEmailDirect } from '../auth/AuthContext';
import { toast } from 'sonner';

export default function VerificationRequiredModal() {
  const { user, profile, signOut } = useAuth();
  const [resending, setResending] = useState(false);

  // If verified in DB or failsafe is present in localStorage, don't show the modal
  const localVerified = localStorage.getItem(`email_verified_failsafe_${user?.id}`) === 'true';
  if (!profile || profile.emailVerified || localVerified) return null;

  const handleResend = async () => {
    if (!user) return;
    setResending(true);
    try {
      await sendVerificationEmailDirect(user.id, user.email || '', profile.name);
      toast.success("Verification email resent! Check your inbox.");
    } catch (error: unknown) {
      toast.error((error instanceof Error ? error.message : String(error)) || "Failed to resend. Please try again later.");
    } finally {
      setResending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#08070D]/95 backdrop-blur-xl"
        />
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-[#15131C] border border-white/[0.08] rounded-2xl p-8 shadow-[0_0_80px_rgba(108,92,231,0.2)] overflow-hidden text-center"
        >
          {/* Ambient glow */}
          <div className="absolute -top-32 -left-32 w-64 h-64 bg-primary-500/20 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-primary-400/20 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-400 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(108,92,231,0.3)] mb-6">
              <Mail className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-[24px] font-extrabold text-white tracking-tight mb-3">
              Verify your email
            </h2>
            
            <p className="text-[15px] text-slate-400 leading-relaxed mb-8">
              We've sent a verification link to <strong className="text-white font-medium">{user?.email}</strong>. 
              Please verify your email address to access the platform.
            </p>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={handleResend}
                disabled={resending}
                className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-primary-400 hover:opacity-90 text-white text-[14px] font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_rgba(108,92,231,0.3)] disabled:opacity-50"
              >
                {resending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {resending ? 'Sending...' : 'Resend Verification Email'}
              </button>

              <button
                onClick={handleSignOut}
                className="w-full py-3.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white text-[14px] font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
            
            <p className="text-[12px] text-slate-500 mt-6">
              After verifying, you can refresh this page to continue.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
