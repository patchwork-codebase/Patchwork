import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router";
import { CheckCircle, XCircle, Loader2, ArrowRight, Mail, RefreshCw } from "lucide-react";
import { supabase, sendVerificationEmailDirect } from "./AuthContext";
import { toast } from "sonner";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMsg, setErrorMsg] = useState("");

  // Resend state
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSent, setResendSent] = useState(false);

  // Restore cooldown from localStorage
  useEffect(() => {
    const lastSent = localStorage.getItem("lastVerificationSent");
    if (lastSent) {
      const elapsed = Math.floor((Date.now() - parseInt(lastSent)) / 1000);
      if (elapsed < 60) setResendCooldown(60 - elapsed);
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown(prev => prev - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMsg("No verification token was found in the URL.");
      return;
    }

    async function verify() {
      try {
        const { data, error } = await supabase.rpc('verify_email_token', {
          token_val: token
        });

        if (error || !data || !data.success) {
          throw new Error(error?.message || data?.error || "Email verification failed.");
        }

        // Refresh the local Supabase session
        const { data: { session } } = await supabase.auth.refreshSession();

        if (session?.user) {
          setResendEmail(session.user.email || "");

          // ✅ Mark email as verified in our custom users table column
          // (Supabase's email_confirmed_at is unreliable when email confirmation is disabled)
          await supabase
            .from('users')
            .update({ email_verified: true })
            .eq('id', session.user.id);

          const { data: profile } = await supabase
            .from('users')
            .select('name, role')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            supabase.functions.invoke('send-welcome-email', {
              body: {
                userId: session.user.id,
                email: session.user.email,
                name: profile.name,
                role: profile.role
              }
            }).catch(console.error);
          }
        }

        setStatus("success");
      } catch (err: any) {
        setStatus("error");
        setErrorMsg(err.message || "Something went wrong during verification.");

        // Try to pre-fill email from the current session for the resend form
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email) setResendEmail(session.user.email);
        } catch (_) {}
      }
    }

    verify();
  }, [token]);

  async function handleResend() {
    if (resendCooldown > 0 || resending || !resendEmail.trim()) return;
    setResending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      const name = session?.user?.user_metadata?.name || resendEmail.split("@")[0];

      if (!userId) throw new Error("Please log in first, then resend from your dashboard.");

      await sendVerificationEmailDirect(userId, resendEmail.trim(), name);
      setResendSent(true);
      setResendCooldown(60);
      localStorage.setItem("lastVerificationSent", Date.now().toString());
      toast.success("Verification email sent! Check your inbox.");
    } catch (err: any) {
      toast.error(err.message || "Failed to send. Please try from your dashboard.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#08070D] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#6C5CE7]/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="w-full max-w-[460px] bg-white/[0.02] border border-white/[0.06] rounded-[32px] p-8 md:p-10 backdrop-blur-md shadow-2xl relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#6C5CE7]/50 to-transparent opacity-50" />

        <div className="font-extrabold text-[24px] text-white font-display tracking-tight mb-8">
          patchwork
        </div>

        {/* VERIFYING */}
        {status === "verifying" && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <Loader2 className="w-16 h-16 text-[#8B7CF8] animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-white font-display">Verifying your email</h2>
              <p className="text-sm text-slate-400">Please wait while we confirm your address.</p>
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {status === "success" && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-emerald-400 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-white font-display">Email Verified! 🎉</h2>
              <p className="text-sm text-slate-400">
                You can now post updates, create rooms, and engage with builders on Patchwork.
              </p>
            </div>
            <button
              onClick={() => navigate("/dashboard?verified=true", { replace: true })}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white text-[#0A0910] hover:bg-slate-200 rounded-full text-[14px] font-bold transition-all shadow-lg hover:shadow-xl mt-4"
            >
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ERROR */}
        {status === "error" && (
          <div className="space-y-5">
            <div className="flex justify-center">
              <XCircle className="w-16 h-16 text-rose-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-white font-display">Verification Failed</h2>
              <p className="text-sm text-rose-300/80 bg-rose-500/10 border border-rose-500/10 py-2.5 px-4 rounded-xl leading-relaxed">
                {errorMsg}
              </p>
            </div>

            {/* Resend section */}
            {!resendSent ? (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 text-left space-y-3">
                <p className="text-[13px] font-bold text-white">Request a new verification link</p>
                <p className="text-[12px] text-slate-400">Your link may have expired. Get a fresh one below.</p>
                <input
                  type="email"
                  value={resendEmail}
                  onChange={e => setResendEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[13px] text-white placeholder-slate-500 focus:outline-none focus:border-[#8B7CF8]/50 focus:ring-1 focus:ring-[#8B7CF8]/30 transition-all"
                />
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || resending || !resendEmail.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/40 disabled:cursor-not-allowed text-black disabled:text-black/50 rounded-xl text-[13px] font-bold transition-all active:scale-95"
                >
                  {resending
                    ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending...</>
                    : resendCooldown > 0
                      ? <><Mail className="w-3.5 h-3.5" /> Resend in {resendCooldown}s</>
                      : <><Mail className="w-3.5 h-3.5" /> Send new verification email</>
                  }
                </button>
              </div>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-sm text-emerald-300">
                ✅ Sent to <strong>{resendEmail}</strong>. Check your inbox and spam folder.
              </div>
            )}

            <div className="pt-1 space-y-3">
              <button
                onClick={() => navigate("/dashboard", { replace: true })}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#6C5CE7] hover:bg-[#5B4ED6] text-white rounded-full text-[14px] font-bold transition-all"
              >
                Go to Dashboard
              </button>
              <Link to="/login" className="block text-xs font-bold text-slate-400 hover:text-white transition-colors">
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
