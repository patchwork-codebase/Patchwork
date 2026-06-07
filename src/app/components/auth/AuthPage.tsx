import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Country, State, City } from "country-state-city";
import { useAuth, DEV_AUTH_BYPASS } from "./AuthContext";
import { Hammer, ArrowRight, Mail, Lock, User, MapPin, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";


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
        className="w-full flex items-center justify-between px-3 py-3 bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] rounded-xl text-[13.5px] text-white focus:outline-none focus:border-[#8B7CF8]/50 focus:ring-1 focus:ring-[#8B7CF8]/30 transition-all disabled:opacity-50 text-left cursor-pointer"
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
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[13px] text-white placeholder-slate-600 focus:outline-none focus:border-[#8B7CF8]/50 transition-all mb-2"
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
                          ? 'bg-[#8B7CF8]/20 text-[#8B7CF8]'
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 backdrop-blur-sm shadow-xl"
        >
          <p className="text-[14px] text-slate-300 italic leading-relaxed min-h-[48px]">{t.quote}</p>
          <p className="text-[12px] text-[#8B7CF8] font-mono font-bold mt-3">{t.handle}</p>
        </motion.div>
      </AnimatePresence>
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
  const { signIn, signUp, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      navigate(profile.role === 'observer' ? '/dashboard/observer' : '/dashboard');
    } else if (DEV_AUTH_BYPASS) {
      navigate('/dashboard');
    }
  }, [navigate, profile]);

  // Login form
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  // Signup form — minimal, just what's needed to create the account
  const [signup, setSignup] = useState({
    fname: '',
    lname: '',
    email: '',
    password: '',
    countryIso: '',
    stateIso: '',
    city: '',
    gender: '',
    phoneCountryCode: '+1',
    phoneNumber: '',
    role: 'builder' as 'builder' | 'observer',
  });

  function redirectForRole(role?: string) {
    navigate(role === 'observer' ? '/dashboard/observer' : '/dashboard');
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { profile } = await signIn(loginForm.email, loginForm.password);
      redirectForRole(profile?.role);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
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
      const { profile } = await signUp(signup.email, signup.password, name, signup.role, signup.city, '', signup.gender, signup.phoneCountryCode, signup.phoneNumber);
      redirectForRole(profile?.role || signup.role);
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const canSubmitSignup = signup.fname && signup.email && signup.password.length >= 8 && signup.countryIso && signup.stateIso && signup.city && signup.gender;

  return (
    <div className="min-h-screen bg-[#0E0C16] flex flex-col lg:flex-row relative overflow-hidden">
      {/* Background ambient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-[#6C5CE7]/8 rounded-full blur-[180px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#8B7CF8]/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] p-14 relative overflow-hidden z-10">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-16 -left-24 w-[420px] h-[420px] bg-[#8B7CF8]/20 rounded-full blur-[100px] pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute bottom-16 -right-24 w-[520px] h-[520px] bg-[#6C5CE7]/20 rounded-full blur-[120px] pointer-events-none"
        />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 relative z-10"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-[#6C5CE7] to-[#8B7CF8] rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(108,92,231,0.5)]">
            <motion.div
              animate={{ rotate: [0, -45, 15, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", repeatDelay: 1 }}
            >
              <Hammer className="w-4 h-4 text-white" />
            </motion.div>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">patch·work</span>
        </motion.div>

        {/* Hero copy */}
        <div className="relative z-10 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <p className="text-[12px] font-mono font-bold text-[#8B7CF8] uppercase tracking-[0.2em] mb-6">
              Build in public. For real.
            </p>
            <h1 className="text-[44px] font-extrabold text-white leading-[1.1] tracking-tight mb-6">
              Where builders<br />
              <span className="bg-gradient-to-r from-[#8B7CF8] to-[#a78bfa] bg-clip-text text-transparent">
                share the messy truth
              </span>
            </h1>
            <p className="text-[16px] text-slate-400 leading-relaxed font-medium">
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
          <div className="w-8 h-8 bg-gradient-to-br from-[#6C5CE7] to-[#8B7CF8] rounded-lg flex items-center justify-center">
            <motion.div
              animate={{ rotate: [0, -45, 15, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", repeatDelay: 1 }}
            >
              <Hammer className="w-4 h-4 text-white" />
            </motion.div>
          </div>
          <span className="text-lg font-bold text-white">patch·work</span>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-white/[0.04] border border-white/[0.06] rounded-full p-1 mb-8 w-full max-w-sm">
          {(['login', 'signup'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              className={`flex-1 py-2.5 rounded-full text-[13px] font-bold transition-all ${
                tab === t
                  ? 'bg-white text-[#0A0910] shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t === 'login' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">
            {/* ── LOGIN FORM ── */}
            {tab === 'login' && (
              <motion.form
                key="login"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleLogin}
                className="flex flex-col gap-4"
              >
                <div>
                  <h2 className="text-[28px] font-extrabold text-white tracking-tight">Welcome back</h2>
                  <p className="text-[14px] text-slate-400 mt-1">Sign in to your Patchwork account</p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-medium px-4 py-3 rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={loginForm.email}
                    onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                    required
                    className="w-full pl-10 pr-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-[#8B7CF8]/50 focus:ring-1 focus:ring-[#8B7CF8]/30 transition-all"
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
                    className="w-full pl-10 pr-10 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-[#8B7CF8]/50 focus:ring-1 focus:ring-[#8B7CF8]/30 transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <motion.button
                  whileHover={{ scale: loading ? 1 : 1.02 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF8] text-white text-[14px] font-extrabold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_4px_20px_rgba(108,92,231,0.3)] transition-all"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : <>Sign in <ArrowRight className="w-4 h-4" /></>}
                </motion.button>

                <p className="text-center text-[13px] text-slate-500">
                  No account?{' '}
                  <button type="button" onClick={() => setTab('signup')} className="text-[#8B7CF8] font-bold hover:underline">
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
                <div>
                  <h2 className="text-[28px] font-extrabold text-white tracking-tight">Create your account</h2>
                  <p className="text-[14px] text-slate-400 mt-1">Join the founding cohort. Takes 30 seconds.</p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-medium px-4 py-3 rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                {/* Role selector */}
                <div className="flex bg-white/[0.04] border border-white/[0.06] rounded-xl p-1 gap-1">
                  {(['builder', 'observer'] as const).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSignup(s => ({ ...s, role: r }))}
                      className={`flex-1 py-2 rounded-lg text-[13px] font-bold transition-all capitalize ${
                        signup.role === r
                          ? r === 'builder'
                            ? 'bg-[#6C5CE7] text-white shadow-[0_0_12px_rgba(108,92,231,0.4)]'
                            : 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {r === 'builder' ? '🔨 Builder' : '👀 Observer'}
                    </button>
                  ))}
                </div>

                {/* Name row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="First name"
                      value={signup.fname}
                      onChange={e => setSignup(s => ({ ...s, fname: e.target.value }))}
                      required
                      className="w-full pl-9 pr-3 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-[#8B7CF8]/50 focus:ring-1 focus:ring-[#8B7CF8]/30 transition-all"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Last name"
                    value={signup.lname}
                    onChange={e => setSignup(s => ({ ...s, lname: e.target.value }))}
                    className="w-full px-3 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-[#8B7CF8]/50 focus:ring-1 focus:ring-[#8B7CF8]/30 transition-all"
                  />
                </div>

                {/* Gender */}
                <div className="relative z-20">
                  <SearchableSelect
                    label="Gender"
                    value={signup.gender}
                    onChange={val => setSignup(s => ({ ...s, gender: val }))}
                    searchable={false}
                    options={[
                      { value: "male", label: "Male" },
                      { value: "female", label: "Female" },
                      { value: "non-binary", label: "Non-binary" },
                      { value: "prefer-not-to-say", label: "Prefer not to say" }
                    ]}
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
                    className="w-full pl-10 pr-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-[#8B7CF8]/50 focus:ring-1 focus:ring-[#8B7CF8]/30 transition-all"
                  />
                </div>

                {/* Password */}
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password (min 8 characters)"
                    value={signup.password}
                    onChange={e => setSignup(s => ({ ...s, password: e.target.value }))}
                    required
                    className="w-full pl-10 pr-10 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-[#8B7CF8]/50 focus:ring-1 focus:ring-[#8B7CF8]/30 transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Phone (optional) */}
                <div className="flex gap-2">
                  <div className="w-[140px] shrink-0 relative z-20">
                    <SearchableSelect
                      label="Code"
                      value={signup.phoneCountryCode}
                      onChange={val => setSignup(s => ({ ...s, phoneCountryCode: val }))}
                      options={Country.getAllCountries().map(c => ({ value: `+${c.phonecode}`, label: `${c.isoCode} (+${c.phonecode})` }))}
                    />
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="tel"
                      placeholder="Phone (optional)"
                      value={signup.phoneNumber}
                      onChange={e => setSignup(s => ({ ...s, phoneNumber: e.target.value }))}
                      className="w-full px-4 py-[13px] bg-white/[0.04] border border-white/[0.08] rounded-xl text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-[#8B7CF8]/50 focus:ring-1 focus:ring-[#8B7CF8]/30 transition-all"
                    />
                  </div>
                </div>

                {/* Location (mandatory) */}
                <div className="grid grid-cols-3 gap-2">
                  <SearchableSelect
                    label="Country"
                    value={signup.countryIso}
                    onChange={val => setSignup(s => ({ ...s, countryIso: val, stateIso: '', city: '' }))}
                    options={Country.getAllCountries().map(c => ({ value: c.isoCode, label: c.name }))}
                  />

                  <SearchableSelect
                    label="State"
                    value={signup.stateIso}
                    onChange={val => setSignup(s => ({ ...s, stateIso: val, city: '' }))}
                    disabled={!signup.countryIso}
                    options={signup.countryIso ? State.getStatesOfCountry(signup.countryIso).map(s => ({ value: s.isoCode, label: s.name })) : []}
                  />

                  <SearchableSelect
                    label="City"
                    value={signup.city}
                    onChange={val => setSignup(s => ({ ...s, city: val }))}
                    disabled={!signup.stateIso}
                    options={signup.stateIso ? City.getCitiesOfState(signup.countryIso, signup.stateIso).map(c => ({ value: c.name, label: c.name })) : []}
                  />
                </div>

                <motion.button
                  whileHover={{ scale: (loading || !canSubmitSignup) ? 1 : 1.02 }}
                  whileTap={{ scale: (loading || !canSubmitSignup) ? 1 : 0.98 }}
                  type="submit"
                  disabled={loading || !canSubmitSignup}
                  className="w-full py-3.5 bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF8] text-white text-[14px] font-extrabold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_4px_20px_rgba(108,92,231,0.3)] transition-all"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                    : <>Create account — free <ArrowRight className="w-4 h-4" /></>
                  }
                </motion.button>

                <p className="text-center text-[12px] text-slate-600 leading-relaxed">
                  You'll set up your domain, room and preferences<br />inside the dashboard after signing up.
                </p>

                <p className="text-center text-[13px] text-slate-500">
                  Already have an account?{' '}
                  <button type="button" onClick={() => setTab('login')} className="text-[#8B7CF8] font-bold hover:underline">
                    Sign in
                  </button>
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
