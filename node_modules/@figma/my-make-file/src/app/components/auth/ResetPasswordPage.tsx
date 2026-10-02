import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Zap, Lock, ArrowRight, Loader2, AlertCircle, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "./AuthContext";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score; // 0 to 5
  };

  const strength = calculatePasswordStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (strength < 2) {
      setError('Password is too weak. Please use a stronger password.');
      return;
    }
    
    setError('');
    setLoading(true);
    try {
      await updatePassword(password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || 'Failed to update password.');
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
          <h1 className="text-[28px] font-extrabold text-slate-900 tracking-tight text-center">Set New Password</h1>
          <p className="text-[15px] text-slate-600 mt-2 font-medium text-center">Please enter your new password below</p>
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
              <h3 className="text-[20px] font-bold text-slate-900">Password Updated</h3>
              <p className="text-[14px] text-slate-600 font-medium">
                Your password has been successfully changed. Redirecting you to the dashboard...
              </p>
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
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="New password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-[14px] text-slate-900 placeholder-slate-500 focus:outline-none focus:border-primary-400 focus:bg-white transition-all shadow-sm"
                />
                <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength indicator */}
              {password && (
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        strength >= level 
                          ? strength <= 2 ? 'bg-rose-400' : strength <= 3 ? 'bg-amber-400' : 'bg-emerald-400'
                          : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
              )}

              <motion.button
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                type="submit"
                disabled={loading || !password || strength < 2}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-[14px] font-extrabold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg transition-all mt-2"
              >
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : <>Update password <ArrowRight className="w-4 h-4" /></>}
              </motion.button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
