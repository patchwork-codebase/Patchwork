import { useState, useEffect } from "react";
import { ShieldAlert, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth, sendVerificationEmailDirect } from "../auth/AuthContext";
import { STORAGE_KEYS } from "../../utils/helpers";

export function EmailVerificationBanner() {
  const { user, profile } = useAuth();
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const lastSent = localStorage.getItem(STORAGE_KEYS.lastVerificationSent);
    if (lastSent) {
      const elapsed = Math.floor((Date.now() - parseInt(lastSent)) / 1000);
      if (elapsed < 60) setResendCooldown(60 - elapsed);
    }
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function handleResendVerification() {
    if (resendCooldown > 0 || resending || !user) return;
    setResending(true);
    try {
      await sendVerificationEmailDirect(
        user.id,
        profile?.email || user.email || '',
        profile?.name || ''
      );
      toast.success('Verification email sent! Check your inbox.');
      setResendCooldown(60);
      localStorage.setItem(STORAGE_KEYS.lastVerificationSent, Date.now().toString());
    } catch (err: unknown) {
      toast.error('Failed to send email. Please try again.');
    } finally {
      setResending(false);
    }
  }

  if (!profile || profile.emailVerified) {
    return null;
  }

  return (
    <div className="mb-6 rounded-[20px] border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5 overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-extrabold text-slate-900 dark:text-white mb-1">Verify your email to unlock Patchwork</h3>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              You won't be able to <strong className="text-slate-900 dark:text-white">post updates</strong>, <strong className="text-slate-900 dark:text-white">create rooms</strong>, or <strong className="text-slate-900 dark:text-white">react to builds</strong> until your email is confirmed.
              We sent a link to <span className="text-amber-500 font-semibold">{profile?.email || user?.email}</span>.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleResendVerification}
                disabled={resendCooldown > 0 || resending}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/40 disabled:cursor-not-allowed text-black disabled:text-black/50 rounded-xl text-[13px] font-bold transition-all active:scale-95"
              >
                {resending
                  ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending...</>
                  : resendCooldown > 0
                    ? <><Mail className="w-3.5 h-3.5" /> Resend in {resendCooldown}s</>
                    : <><Mail className="w-3.5 h-3.5" /> Resend verification email</>
                }
              </button>
              <p className="text-[12px] text-slate-500 dark:text-slate-400">Check your spam folder if you don't see it.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-amber-500/50 via-orange-400/50 to-amber-500/50" />
    </div>
  );
}
