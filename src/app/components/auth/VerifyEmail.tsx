import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { supabase } from "./AuthContext";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [errorMsg, setErrorMsg] = useState("");

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

        // Refresh the local Supabase session to update email_confirmed_at in the user object instantly
        const { data: { session } } = await supabase.auth.refreshSession();

        if (session?.user) {
          // Fetch user profile from the 'users' table
          const { data: profile } = await supabase
            .from('users')
            .select('name, role')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            // Trigger the welcome email non-blockingly
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
      }
    }

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-[#08070D] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#6C5CE7]/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="w-full max-w-[460px] bg-white/[0.02] border border-white/[0.06] rounded-[32px] p-8 md:p-10 backdrop-blur-md shadow-2xl relative overflow-hidden text-center">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#6C5CE7]/50 to-transparent opacity-50" />

        <div className="font-extrabold text-[24px] text-white font-display tracking-tight mb-8">
          patchwork
        </div>

        {status === "verifying" && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <Loader2 className="w-16 h-16 text-[#8B7CF8] animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-white font-display">Verifying your email</h2>
              <p className="text-sm text-slate-400">
                Please wait a moment while we verify your address and secure your account.
              </p>
            </div>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <CheckCircle className="w-16 h-16 text-emerald-400 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-white font-display">Email Verified!</h2>
              <p className="text-sm text-slate-400">
                Your email has been verified successfully. You can now build rooms and update your timeline.
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

        {status === "error" && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <XCircle className="w-16 h-16 text-rose-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-white font-display">Verification Failed</h2>
              <p className="text-sm text-rose-300/80 bg-rose-500/10 border border-rose-500/10 py-2.5 px-4 rounded-xl leading-relaxed">
                {errorMsg}
              </p>
            </div>
            <div className="pt-4 space-y-3">
              <button
                onClick={() => navigate("/dashboard", { replace: true })}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#6C5CE7] hover:bg-[#5B4ED6] text-white rounded-full text-[14px] font-bold transition-all"
              >
                Go to Dashboard
              </button>
              <Link
                to="/login"
                className="block text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
