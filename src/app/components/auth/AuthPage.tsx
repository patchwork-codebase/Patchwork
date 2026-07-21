import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link, useSearchParams } from "react-router";

import { useAuth, DEV_AUTH_BYPASS } from "./AuthContext";
import { AuthRedirectGuard } from "./AuthRedirectGuard";
import { Hammer, ArrowRight, Mail, Lock, User, MapPin, Loader2, AlertCircle, Eye, EyeOff, Linkedin } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";


/* ─── Searchable Custom Select Component ──────────────────────── */
interface SearchableSelectProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  searchable?: boolean;
}

function SearchableSelect({ label, value, onChange, options, disabled, searchable = true }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedOption = options.find(o => o.value === value);
  const displayLabel = selectedOption ? selectedOption.label : label;

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch("");
        }}
        className="w-full flex items-center justify-between px-3 py-3 bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] rounded-xl text-[13.5px] text-white focus:outline-none focus:border-primary-400/50 focus:ring-1 focus:ring-primary-400/30 transition-all disabled:opacity-50 text-left cursor-pointer"
      >
        <span className={selectedOption ? "text-white font-medium truncate" : "text-slate-500 font-medium truncate"}>
          {displayLabel}
        </span>
        <svg
          className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <>
            <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.12 }}
              className="absolute left-0 right-0 bottom-full mb-2 bg-[#0E0C16] border border-white/[0.08] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] p-2 z-50 overflow-hidden max-h-[260px] flex flex-col"
            >
              {searchable && (
                <input
                  type="text"
                  autoFocus
                  placeholder={`Search ${label.toLowerCase()}...`}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[13px] text-white placeholder-slate-600 focus:outline-none focus:border-primary-400/50 transition-all mb-2"
                />
              )}
              <div className="flex-1 overflow-y-auto max-h-[180px] space-y-0.5 pr-1">
                {filtered.length === 0 ? (
                  <div className="px-3 py-2 text-[12px] text-slate-500 font-semibold">No results found</div>
                ) : (
                  filtered.map(o => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => {
                        onChange(o.value);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-[12.5px] font-semibold transition-all truncate block ${
                        value === o.value
                          ? 'bg-primary-400/20 text-primary-400'
                          : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Testimonial Slider Component ───────────────────────────── */
const TESTIMONIALS = [
  { quote: '"Finally a space that rewards honesty over hype."', handle: '@tobi_builds' },
  { quote: '"The feed rewards in-progress updates and honest pivots — not launch announcements."', handle: '@funmi_product' },
  { quote: '"Observing builds on Patchwork feels like peering into the future. High signal, zero noise."', handle: '@lanre_designer' },
];

function TestimonialSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const t = TESTIMONIALS[index];

  return (
    <div className="min-h-[130px] flex items-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
        >
          <p className="text-[14px] text-slate-700 italic leading-relaxed min-h-[48px] font-medium">{t.quote}</p>
          <p className="text-[12px] text-primary-600 font-mono font-bold mt-3">{t.handle}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ─── Social Auth Component ───────────────────────────────────── */
function SocialAuth({ onGoogle, onLinkedin, loading }: { onGoogle: () => void, onLinkedin: () => void, loading: boolean }) {
  return (
    <div className="flex flex-col gap-4 mt-2">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-[1px] bg-slate-200" />
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">or continue with</span>
        <div className="flex-1 h-[1px] bg-slate-200" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={onGoogle}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-[14px] text-slate-700 font-bold transition-all disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
              <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
              <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
              <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
              <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
            </g>
          </svg>
          Google
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={onLinkedin}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-[14px] text-slate-700 font-bold transition-all disabled:opacity-50"
        >
          <Linkedin className="w-5 h-5 text-[#0A66C2] fill-[#0A66C2]" />
          LinkedIn
        </button>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const location = useLocation();
  const defaultTab = location.pathname === '/login' ? 'login' : 'signup';
  const [tab, setTab] = useState<'login' | 'signup'>(defaultTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp, signInWithGoogle, signInWithLinkedin, profile, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const returnUrl = searchParams.get('returnUrl');
    if (returnUrl) {
      localStorage.setItem('authRedirectUrl', returnUrl);
    }
  }, [searchParams]);


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

  useEffect(() => {
    if (!authLoading && !user && DEV_AUTH_BYPASS) {
      navigate('/dashboard');
    }
  }, [navigate, user, authLoading]);

  // Login form
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  // Signup form — minimal, just what's needed to create the account
  const [signup, setSignup] = useState({
    fname: '',
    lname: '',
    email: '',
    password: '',
    role: 'builder' as 'builder' | 'observer',
  });

  function redirectForRole(role?: string) {
    const returnTo = localStorage.getItem('authRedirectUrl');
    if (returnTo) {
      localStorage.removeItem('authRedirectUrl');
      navigate(returnTo);
    } else {
      navigate(role === 'observer' ? '/dashboard/observer' : '/dashboard');
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { profile } = await signIn(loginForm.email, loginForm.password);
      redirectForRole(profile?.role);
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const name = `${signup.fname} ${signup.lname}`.trim() || 'Anonymous Builder';
      await signUp(signup.email, signup.password, name, signup.role, '', '', '', '', '');
      toast.success("Welcome to Patchwork! We've sent a verification link to your email.");
      navigate('/onboarding');
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAuth() {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || 'Google authentication failed.');
      setLoading(false);
    }
  }

  async function handleLinkedinAuth() {
    setError('');
    setLoading(true);
    try {
      await signInWithLinkedin();
    } catch (err: unknown) {
      setError((err instanceof Error ? err.message : String(err)) || 'LinkedIn authentication failed.');
      setLoading(false);
    }
  }

  const canSubmitSignup = signup.fname && signup.email && signup.password.length >= 8;

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col lg:flex-row relative overflow-hidden">
      <AuthRedirectGuard />
      {/* Background ambient */}
      <div className="absolute inset-0 bg-[radial-gradient(slate-200_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.4]" />
      
      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-14 relative overflow-hidden z-10 border-r border-slate-200/50 bg-white">
        
        {/* Animated Platform Teaser */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -right-20 top-1/2 -translate-y-1/2 w-[400px] h-[480px] bg-white border border-slate-200 rounded-[32px] shadow-2xl opacity-60 pointer-events-none rotate-[-5deg] p-6 hidden xl:block"
        >
          <div className="w-full h-10 border-b border-slate-100 flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-rose-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-emerald-400" />
          </div>
          <div className="space-y-4">
            <div className="w-3/4 h-6 bg-slate-100 rounded-lg" />
            <div className="w-full h-24 bg-slate-50 rounded-xl border border-slate-100" />
            <div className="w-5/6 h-24 bg-slate-50 rounded-xl border border-slate-100" />
          </div>
        </motion.div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 relative z-10"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-400 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(108,92,231,0.5)]">
            <motion.div
              animate={{ rotate: [0, -45, 15, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", repeatDelay: 1 }}
            >
              <Hammer className="w-4 h-4 text-white" />
            </motion.div>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">patch·work</span>
        </motion.div>

        {/* Hero copy */}
        <div className="relative z-10 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <p className="text-[12px] font-mono font-bold text-primary-600 uppercase tracking-[0.2em] mb-6">
              Build in public. For real.
            </p>
            <h1 className="text-[44px] font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-6">
              Where builders<br />
              <span className="text-primary-600">
                share the messy truth
              </span>
            </h1>
            <p className="text-[16px] text-slate-600 leading-relaxed font-medium">
              Not the polished launch. The decisions. The pivots. The things you thought would work and didn't.
            </p>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12 w-full"
          >
            <TestimonialSlider />
          </motion.div>
        </div>

        {/* Bottom badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-[11px] font-mono text-slate-600 relative z-10"
        >
          // patchwork · founding cohort · 2026
        </motion.div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 relative z-10 min-h-screen lg:min-h-0">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-400 rounded-lg flex items-center justify-center">
            <motion.div
              animate={{ rotate: [0, -45, 15, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", repeatDelay: 1 }}
            >
              <Hammer className="w-4 h-4 text-white" />
            </motion.div>
          </div>
          <span className="text-lg font-bold text-slate-900">patch·work</span>
        </div>

        {/* Removed Tab Switcher for cleaner UI */}

        <div className="w-full max-w-sm sm:max-w-md bg-white border border-slate-200 p-8 sm:p-10 rounded-[32px] shadow-sm">
          <AnimatePresence mode="wait">
            {/* ── LOGIN FORM ── */}
            {tab === 'login' && (
              <motion.form
                key="login"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleLogin}
                className="flex flex-col gap-4"
              >
                <div className="mb-2">
                  <h2 className="text-[32px] font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
                  <p className="text-[15px] text-slate-600 mt-1 font-medium">Sign in to your Patchwork account</p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: [0, -10, 10, -5, 5, 0] }}
                    transition={{ duration: 0.4 }}
                    className="flex items-center gap-3 bg-rose-950/40 border border-rose-500/30 text-rose-200 text-[13.5px] font-semibold px-4 py-3.5 rounded-xl shadow-sm shadow-rose-950/20"
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
                    value={loginForm.email}
                    onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                    required
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-900 placeholder-slate-500 focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={loginForm.password}
                    onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                    required
                    className="w-full pl-10 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-900 placeholder-slate-500 focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                <div className="flex justify-end">
                  <Link to="/forgot-password" className="text-[13px] font-bold text-primary-500 hover:text-primary-600 transition-colors">
                    Forgot password?
                  </Link>
                </div>

                <motion.button
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-[14px] font-extrabold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : <>Sign in <ArrowRight className="w-4 h-4" /></>}
                </motion.button>

                <SocialAuth 
                  onGoogle={handleGoogleAuth} 
                  onLinkedin={handleLinkedinAuth} 
                  loading={loading} 
                />

                <p className="text-center text-[13px] text-slate-500">
                  No account?{' '}
                  <button type="button" onClick={() => setTab('signup')} className="text-primary-400 font-bold hover:underline">
                    Create one — it's free
                  </button>
                </p>
              </motion.form>
            )}

            {/* ── SIGNUP FORM ── */}
            {tab === 'signup' && (
              <motion.form
                key="signup"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleSignup}
                className="flex flex-col gap-4"
              >
                <div className="mb-2">
                  <h2 className="text-[32px] font-extrabold text-slate-900 tracking-tight">Create account</h2>
                  <p className="text-[15px] text-slate-600 mt-1 font-medium">Join the founding cohort. Takes 30 seconds.</p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: [0, -10, 10, -5, 5, 0] }}
                    transition={{ duration: 0.4 }}
                    className="flex items-center gap-3 bg-rose-950/40 border border-rose-500/30 text-rose-200 text-[13.5px] font-semibold px-4 py-3.5 rounded-xl shadow-sm shadow-rose-950/20"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* Role selector */}
                <div className="grid grid-cols-2 gap-3 mb-2">
                  {(['builder', 'observer'] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSignup(s => ({ ...s, role: r, builderType: '' }))}
                      className={`relative flex flex-col items-center justify-center text-center p-4 rounded-2xl border-2 transition-all ${
                        signup.role === r
                          ? r === 'builder'
                            ? 'border-slate-900 bg-slate-50 shadow-sm'
                            : 'border-emerald-600 bg-emerald-50 shadow-sm'
                          : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`text-2xl mb-1`}>{r === 'builder' ? '🔨' : '👀'}</span>
                      <span className={`text-[14px] font-bold ${signup.role === r ? 'text-slate-900' : 'text-slate-600'}`}>
                        {r === 'builder' ? 'Builder' : 'Observer'}
                      </span>
                      <span className="text-[11px] text-slate-500 mt-1 font-medium leading-tight">
                        {r === 'builder' ? 'Share your journey' : 'Follow top creators'}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Name row */}
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="First name"
                      value={signup.fname}
                      onChange={e => setSignup(s => ({ ...s, fname: e.target.value }))}
                      required
                      className="w-full pl-9 pr-3 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-900 placeholder-slate-500 focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Last name"
                    value={signup.lname}
                    onChange={e => setSignup(s => ({ ...s, lname: e.target.value }))}
                    className="w-full px-3 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-900 placeholder-slate-500 focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
                  />
                </div>

                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={signup.email}
                    onChange={e => setSignup(s => ({ ...s, email: e.target.value }))}
                    required
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-900 placeholder-slate-500 focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
                  />
                </div>

                {/* Password */}
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password (min 8 characters)"
                      value={signup.password}
                      onChange={e => setSignup(s => ({ ...s, password: e.target.value }))}
                      required
                      className="w-full pl-10 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-900 placeholder-slate-500 focus:outline-none focus:border-primary-400 focus:bg-white transition-all"
                    />
                    <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {/* Password Strength */}
                  {signup.password && (() => {
                    const strength = calculatePasswordStrength(signup.password);
                    const getStrengthText = () => {
                      if (strength <= 1) return { text: "Too weak", color: "text-rose-500" };
                      if (strength === 2) return { text: "Could be stronger", color: "text-rose-500" };
                      if (strength === 3) return { text: "Good", color: "text-amber-500" };
                      if (strength >= 4) return { text: "Strong", color: "text-emerald-500" };
                      return { text: "", color: "" };
                    };
                    const status = getStrengthText();
                    return (
                      <div className="mt-2 flex flex-col gap-1.5">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((level) => {
                            let bgColor = "bg-slate-200";
                            if (strength >= level) {
                              if (strength <= 2) bgColor = "bg-rose-500";
                              else if (strength <= 3) bgColor = "bg-amber-400";
                              else bgColor = "bg-emerald-500";
                            }
                            return <div key={level} className={`h-1.5 flex-1 rounded-full transition-colors ${bgColor}`} />;
                          })}
                        </div>
                        <span className={`text-[11px] font-bold tracking-wide ${status.color}`}>
                          {status.text}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                <motion.button
                  whileHover={{ scale: (loading || !canSubmitSignup) ? 1 : 1.02 }}
                  whileTap={{ scale: (loading || !canSubmitSignup) ? 1 : 0.98 }}
                  type="submit"
                  disabled={loading || !canSubmitSignup}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-[14px] font-extrabold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                    : <>Create account — free <ArrowRight className="w-4 h-4" /></>
                  }
                </motion.button>

                <SocialAuth 
                  onGoogle={handleGoogleAuth} 
                  onLinkedin={handleLinkedinAuth} 
                  loading={loading} 
                />

                <p className="text-center text-[12px] text-slate-600 leading-relaxed">
                  You'll set up your domain, room and preferences<br />inside the dashboard after signing up.
                </p>

                <p className="text-center text-[13px] text-slate-500">
                  Already have an account?{' '}
                  <button type="button" onClick={() => setTab('login')} className="text-primary-400 font-bold hover:underline">
                    Sign in
                  </button>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Legal footer */}
        <p className="mt-8 flex items-center gap-2 text-[11.5px] text-slate-500 font-medium">
          <Link to="/privacy" className="hover:text-slate-900 transition-colors duration-200">
            Privacy Policy
          </Link>
          <span className="text-slate-300">·</span>
          <Link to="/terms" className="hover:text-slate-900 transition-colors duration-200">
            Terms of Service
          </Link>
        </p>
      </div>
    </div>
  );
}
