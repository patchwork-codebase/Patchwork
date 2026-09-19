import React, { useState } from "react";
import { Link } from "react-router";
import { Zap, Mail, ArrowRight, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "./AuthContext";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-sm sm:max-w-md relative z-10 flex flex-col items-center">
        <div className="mb-8 flex flex-col items-center">
          <Link to="/" className="inline-block hover:scale-105 transition-transform">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-primary-500" />
            </div>
          </Link>
          <h1 className="text-[28px] font-extrabold text-slate-900 tracking-tight text-center">Reset Password</h1>
          <p className="text-[15px] text-slate-600 mt-2 font-medium text-center">Enter your email and we'll send you a link</p>
        </div>

        <div className="w-full bg-white border border-slate-100 p-8 sm:p-10 rounded-[32px] shadow-xl">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center gap-4 py-4"
            >
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-[20px] font-bold text-slate-900">Check your inbox</h3>
              <p className="text-[14px] text-slate-600 font-medium">
                We've sent a password reset link to <strong>{email}</strong>. Please check your email to continue.
              </p>
              <Link to="/login" className="mt-4 w-full py-3.5 bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-[14px] font-extrabold rounded-xl transition-all shadow-lg text-center inline-block">
                Return to Login
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: [0, -10, 10, -5, 5, 0] }}
                  transition={{ duration: 0.4 }}
                  className="flex items-center gap-3 bg-rose-950/40 border border-rose-500/30 text-rose-200 text-[13.5px] font-semibold px-4 py-3.5 rounded-xl shadow-lg shadow-rose-950/20"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-[14px] text-slate-900 placeholder-slate-500 focus:outline-none focus:border-primary-400 focus:bg-white transition-all shadow-sm"
                />
              </div>

              <motion.button
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                type="submit"
                disabled={loading || !email}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-[14px] font-extrabold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg transition-all mt-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending link...</> : <>Send reset link <ArrowRight className="w-4 h-4" /></>}
              </motion.button>
              
              <Link to="/login" className="flex items-center justify-center gap-2 text-[13px] font-bold text-slate-500 hover:text-slate-900 transition-colors mt-4">
                <ArrowLeft className="w-4 h-4" /> Back to login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
