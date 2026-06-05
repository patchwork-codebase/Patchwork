import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth, DEV_AUTH_BYPASS } from "./AuthContext";
import { Hammer, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, profile } = useAuth();
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  useEffect(() => {
    if (profile) {
      navigate(profile.role === 'observer' ? '/dashboard/observer' : '/dashboard');
    }
  }, [navigate, profile]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { profile } = await signIn(loginForm.email, loginForm.password);
      navigate(profile?.role === 'observer' ? '/dashboard/observer' : '/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen h-screen w-full bg-[#0E0C16] flex flex-col lg:flex-row relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#6C5CE7]/10 rounded-full blur-[150px] pointer-events-none z-0" />

      <div className="flex-1 flex flex-col lg:flex-row min-h-screen h-full relative z-10">
        {/* Left panel */}
        <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-8 h-8 bg-gradient-to-br from-[#6C5CE7] to-[#8B7CF8] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(108,92,231,0.5)]">
              <Hammer className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white font-display">patch·work</span>
          </div>
          <div className="relative z-10 max-w-lg">
            <h1 className="text-[48px] font-extrabold leading-[1.1] mb-6 font-display text-white">
              Build in the open.<br /><span className="text-[#8B7CF8]">Ship with proof.</span>
            </h1>
            <p className="text-slate-400 text-[18px] leading-relaxed mb-12">
              Share your work-in-progress with focused observers who give structured, actionable feedback — not noise.
            </p>
            <div className="grid grid-cols-3 gap-6">
              {[
                { icon: '⚡', label: 'Sharp', desc: 'Incisive critique' },
                { icon: '🔄', label: 'Push back', desc: 'Challenge assumptions' },
                { icon: '💬', label: 'Tell me more', desc: 'Deep exploration' },
              ].map(r => (
                <div key={r.label} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 backdrop-blur-sm">
                  <div className="text-[32px] mb-3">{r.icon}</div>
                  <div className="text-[15px] font-bold text-white mb-1">{r.label}</div>
                  <div className="text-[13px] text-slate-500 font-medium">{r.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-slate-600 text-sm font-mono relative z-10">© 2026 Patchwork</p>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex items-center justify-center p-8 bg-[#0A0910] border-l border-white/[0.05]">
          <div className="w-full max-w-md relative">
            <div className="flex items-center gap-3 mb-10 lg:hidden">
              <div className="w-8 h-8 bg-[#6C5CE7] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(108,92,231,0.5)]">
                <Hammer className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white font-display">patch·work</span>
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl mb-6 text-[13px] font-bold text-rose-400">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5 bg-white/[0.02] border border-white/[0.06] rounded-[24px] p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#6C5CE7]/50 to-transparent opacity-50" />
              <div>
                <h2 className="text-[28px] font-extrabold text-white mb-2 font-display">Welcome back</h2>
                <p className="text-[14px] text-slate-400">Sign in to your Patchwork account</p>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-300 mb-2 uppercase tracking-widest">Email</label>
                <input
                  type="email" required
                  value={loginForm.email}
                  onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[14px] focus:outline-none focus:border-[#6C5CE7]/50 focus:ring-1 focus:ring-[#6C5CE7]/50 text-white placeholder-slate-600 font-medium transition-all"
                />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-slate-300 mb-2 uppercase tracking-widest">Password</label>
                <input
                  type="password" required
                  value={loginForm.password}
                  onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[14px] focus:outline-none focus:border-[#6C5CE7]/50 focus:ring-1 focus:ring-[#6C5CE7]/50 text-white placeholder-slate-600 font-medium transition-all"
                />
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full py-3.5 bg-white text-[#0A0910] rounded-xl text-[14px] font-extrabold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] mt-8 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>

              <div className="text-center text-[13px] text-slate-400 pt-4">
                Don't have an account? <a href="/onboarding" className="text-[#8B7CF8] font-semibold hover:text-white transition">Create one</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
