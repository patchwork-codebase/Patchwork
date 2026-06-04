import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth, apiCall, DEV_AUTH_BYPASS } from "./AuthContext";
import { Hammer, Eye, ArrowRight, AlertCircle, ArrowLeft, Check } from "lucide-react";

export default function AuthPage() {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      navigate(profile.role === 'observer' ? '/dashboard/observer' : '/dashboard');
    } else if (DEV_AUTH_BYPASS) {
      navigate('/dashboard');
    }
  }, [navigate, profile]);

  // Wizard signup state
  const [step, setStep] = useState(1);
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [city, setCity] = useState("Lagos, Nigeria");
  const [role, setRole] = useState<'builder' | 'observer'>('builder');
  const [domain, setDomain] = useState("product");
  const [buildingDesc, setBuildingDesc] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomDomain, setRoomDomain] = useState("product");
  const [firstUpdate, setFirstUpdate] = useState("");

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  function redirectForRole(role?: 'builder' | 'observer', useOnboarding = false) {
    if (role === 'observer' && useOnboarding) {
      navigate('/observer-onboarding');
      return;
    }
    navigate(role === 'observer' ? '/dashboard/observer' : '/dashboard');
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const signedInProfile = await signIn(loginForm.email, loginForm.password);
      redirectForRole(signedInProfile?.role || profile?.role);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignupComplete() {
    setError('');
    setLoading(true);
    try {
      const name = `${fname} ${lname}`.trim() || "Anonymous Builder";
      // 1. Create account
      await apiCall('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      });

      // Sign in to get token
      const signedInProfile = await signIn(email, password);

      // 2. Open first room & post update
      // Since it's development/anon we fetch the current token or session
      // Wait a brief moment or call straight.
      const room = await apiCall('/rooms', {
        method: 'POST',
        body: JSON.stringify({
          title: roomName || `${name}'s Room`,
          description: buildingDesc || "Building live",
          tags: [roomDomain],
        }),
      });

      if (firstUpdate) {
        await apiCall(`/rooms/${room.id}/updates`, {
          method: 'POST',
          body: JSON.stringify({
            content: firstUpdate,
          }),
        });
      }

      redirectForRole(signedInProfile?.role || role, true);
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0E0C16] flex flex-col lg:flex-row relative">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#6C5CE7]/10 rounded-full blur-[150px] pointer-events-none z-0" />

      {/* Tab select if we are in login view */}
      {tab === 'login' ? (
        <div className="flex-1 flex flex-col lg:flex-row min-h-screen relative z-10">
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

              {/* Tabs */}
              <div className="flex border border-white/[0.08] rounded-xl p-1 mb-8 bg-[#0A0910]/50 backdrop-blur-md">
                <button
                  onClick={() => { setTab('login'); setError(''); }}
                  className="flex-1 py-2.5 px-4 rounded-lg text-[13px] font-bold transition-all bg-white/[0.06] text-white shadow-sm"
                >
                  Sign in
                </button>
                <button
                  onClick={() => { setTab('signup'); setError(''); setStep(1); }}
                  className="flex-1 py-2.5 px-4 rounded-lg text-[13px] font-bold transition-all text-slate-400 hover:text-white hover:bg-white/[0.02]"
                >
                  Create account
                </button>
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
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* Sign up: interactive 5-step wizard */
        <div className="flex-1 flex flex-col lg:flex-row min-h-screen relative z-10">
          {/* Left wizard sidebar */}
          <div className="w-full lg:w-[400px] bg-[#0A0910] border-r border-white/[0.05] p-12 flex flex-col justify-between shrink-0">
            <div className="mb-12">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[#6C5CE7] to-[#8B7CF8] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(108,92,231,0.5)]">
                  <Hammer className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white font-display">patch·work</span>
              </div>
              <p className="text-[11px] text-[#8B7CF8] mt-3 font-mono uppercase tracking-widest font-bold">founding builder setup</p>
            </div>

            {/* Stepper track */}
            <div className="flex-1 flex flex-col gap-8 my-auto relative before:absolute before:inset-y-2 before:left-[15px] before:w-px before:bg-white/[0.05]">
              {[
                { num: 1, title: 'Create account', desc: 'name · email · password' },
                { num: 2, title: 'Your domain', desc: 'what do you build?' },
                { num: 3, title: 'Open your first room', desc: 'name it · frame the build' },
                { num: 4, title: 'Post first update', desc: 'write · publish · begin' },
                { num: 5, title: 'White-glove call', desc: 'schedule onboarding' },
              ].map(s => {
                const isActive = step === s.num;
                const isDone = step > s.num;
                return (
                  <div key={s.num} className="flex gap-5 relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[12px] border transition-all shrink-0 ${
                      isActive ? 'border-[#8B7CF8] bg-[#8B7CF8]/10 text-[#8B7CF8] shadow-[0_0_15px_rgba(139,124,248,0.2)]' : 
                      isDone ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-white/[0.08] bg-[#0A0910] text-slate-500'
                    }`}>
                      {isDone ? <Check className="w-3.5 h-3.5" /> : s.num}
                    </div>
                    <div className="pt-1.5">
                      <div className={`text-[14px] font-bold ${isActive ? 'text-white' : isDone ? 'text-slate-300' : 'text-slate-500'}`}>
                         {s.title}
                      </div>
                      <div className={`text-[11px] font-mono mt-1 ${isActive ? 'text-[#8B7CF8]' : 'text-slate-600'}`}>{s.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 pt-8 border-t border-white/[0.05] hidden lg:block">
              <p className="font-serif italic text-slate-400 text-[14px] leading-relaxed">
                "The feed rewards in-progress updates and honest pivots — not launch announcements."
              </p>
              <p className="text-[10px] text-slate-600 font-mono mt-3 uppercase tracking-widest">// patchwork design principle #3</p>
            </div>
          </div>

          {/* Right step panel inputs */}
          <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
            <div className="w-full max-w-xl">
              {error && (
                <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl mb-8 text-[13px] font-bold text-rose-400">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              {/* Panel 1: Account details */}
              {step === 1 && (
                <div className="space-y-6 bg-white/[0.02] border border-white/[0.06] rounded-[32px] p-8 md:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#8B7CF8]/50 to-transparent opacity-50" />
                  <div>
                    <span className="text-[11px] font-mono text-[#8B7CF8] font-bold uppercase tracking-widest">Step 1 of 5</span>
                    <h2 className="text-[32px] font-extrabold text-white tracking-tight mt-2 font-display">Create your builder account</h2>
                    <p className="text-[14px] text-slate-400 mt-2 font-medium">You're joining as a founding builder. Authenticate below to start setup.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-5 mt-8">
                    <div>
                      <label className="text-[12px] font-bold text-slate-300 mb-2 block uppercase tracking-widest">First name</label>
                      <input
                        type="text"
                        placeholder="Akin"
                        value={fname}
                        onChange={e => setFname(e.target.value)}
                        className="w-full px-4 py-3 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[14px] focus:outline-none focus:border-[#6C5CE7]/50 focus:ring-1 focus:ring-[#6C5CE7]/50 text-white transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-bold text-slate-300 mb-2 block uppercase tracking-widest">Last name</label>
                      <input
                        type="text"
                        placeholder="Rodolu"
                        value={lname}
                        onChange={e => setLname(e.target.value)}
                        className="w-full px-4 py-3 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[14px] focus:outline-none focus:border-[#6C5CE7]/50 focus:ring-1 focus:ring-[#6C5CE7]/50 text-white transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[12px] font-bold text-slate-300 mb-2 block uppercase tracking-widest">Role</label>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { id: 'builder', label: 'Builder', desc: 'Open rooms and share updates' },
                        { id: 'observer', label: 'Observer', desc: 'Follow rooms and react' },
                      ].map(option => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setRole(option.id as 'builder' | 'observer')}
                          className={`rounded-[18px] border px-4 py-3 text-left transition w-full sm:w-auto ${role === option.id ? 'border-[#8B7CF8] bg-[#8B7CF8]/10 text-white' : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]'}`}
                        >
                          <div className="font-semibold">{option.label}</div>
                          <div className="text-[12px] text-slate-500 mt-1">{option.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[12px] font-bold text-slate-300 mb-2 block uppercase tracking-widest">Email</label>
                    <input
                      type="email"
                      placeholder="you@builder.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[14px] focus:outline-none focus:border-[#6C5CE7]/50 focus:ring-1 focus:ring-[#6C5CE7]/50 text-white transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-bold text-slate-300 mb-2 block uppercase tracking-widest">Password</label>
                    <input
                      type="password"
                      placeholder="••••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[14px] focus:outline-none focus:border-[#6C5CE7]/50 focus:ring-1 focus:ring-[#6C5CE7]/50 text-white transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-bold text-slate-300 mb-2 block uppercase tracking-widest">City</label>
                    <input
                      type="text"
                      placeholder="Lagos, Nigeria"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[14px] focus:outline-none focus:border-[#6C5CE7]/50 focus:ring-1 focus:ring-[#6C5CE7]/50 text-white transition-all font-medium"
                    />
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button
                      onClick={() => setStep(2)}
                      disabled={!fname || !lname || !email || !password}
                      className="px-8 py-3.5 bg-white text-[#0A0910] text-[14px] font-extrabold rounded-full hover:bg-slate-200 transition-all flex items-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                      Continue <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setTab('login')}
                      className="px-8 py-3.5 border border-white/[0.08] rounded-full text-[14px] font-bold hover:bg-white/[0.05] text-white transition-all"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              )}

              {/* Panel 2: Domain selector */}
              {step === 2 && (
                <div className="space-y-6 bg-white/[0.02] border border-white/[0.06] rounded-[32px] p-8 md:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#8B7CF8]/50 to-transparent opacity-50" />
                  <div>
                    <span className="text-[11px] font-mono text-[#8B7CF8] font-bold uppercase tracking-widest">Step 2 of 5</span>
                    <h2 className="text-[32px] font-extrabold text-white tracking-tight mt-2 font-display">What do you build?</h2>
                    <p className="text-[14px] text-slate-400 mt-2 font-medium">Pick your primary domain. Your reputation lives here. You can post across domains, but this is your home base.</p>
                  </div>

                  <div className="mt-8">
                    <label className="text-[12px] font-bold text-slate-300 mb-3 block uppercase tracking-widest">Primary domain</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'product', icon: '🧩', label: 'Product' },
                        { id: 'design', icon: '🎨', label: 'Design' },
                        { id: 'engineering', icon: '⚙️', label: 'Engineering' },
                        { id: 'writing', icon: '✍️', label: 'Writing' },
                        { id: 'growth', icon: '📈', label: 'Growth' },
                        { id: 'research', icon: '🔬', label: 'Research' },
                      ].map(d => (
                        <button
                          key={d.id}
                          onClick={() => { setDomain(d.id); setRoomDomain(d.id); }}
                          className={`p-4 border rounded-[20px] text-center transition-all ${
                            domain === d.id ? 'border-[#8B7CF8] bg-[#8B7CF8]/10 text-white shadow-[0_0_20px_rgba(139,124,248,0.15)]' : 'border-white/[0.05] bg-white/[0.02] text-slate-400 hover:bg-white/[0.05]'
                          }`}
                        >
                          <div className="text-[28px] mb-2">{d.icon}</div>
                          <div className="text-[13px] font-bold">{d.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4">
                    <label className="text-[12px] font-bold text-slate-300 mb-1 block uppercase tracking-widest">What are you currently building?</label>
                    <p className="text-[11px] text-[#8B7CF8] font-mono mb-3 uppercase tracking-widest">one sentence — this helps us seed your first room</p>
                    <textarea
                      rows={3}
                      placeholder="e.g. A BNPL product for informal market merchants in Lagos using PalmPay's distribution network"
                      value={buildingDesc}
                      onChange={e => setBuildingDesc(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[14px] focus:outline-none focus:border-[#6C5CE7]/50 focus:ring-1 focus:ring-[#6C5CE7]/50 text-white transition-all font-medium resize-none"
                    />
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button
                      onClick={() => setStep(3)}
                      className="px-8 py-3.5 bg-white text-[#0A0910] text-[14px] font-extrabold rounded-full hover:bg-slate-200 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                      Continue <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setStep(1)}
                      className="px-8 py-3.5 border border-white/[0.08] rounded-full text-[14px] font-bold hover:bg-white/[0.05] text-white transition-all flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                  </div>
                </div>
              )}

              {/* Panel 3: Create Room */}
              {step === 3 && (
                <div className="space-y-6 bg-white/[0.02] border border-white/[0.06] rounded-[32px] p-8 md:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#8B7CF8]/50 to-transparent opacity-50" />
                  <div>
                    <span className="text-[11px] font-mono text-[#8B7CF8] font-bold uppercase tracking-widest">Step 3 of 5</span>
                    <h2 className="text-[32px] font-extrabold text-white tracking-tight mt-2 font-display">Open your first build room</h2>
                    <p className="text-[14px] text-slate-400 mt-2 font-medium">Name the thing you're building. Think of this as the headline someone would see while watching you work.</p>
                  </div>

                  <div className="mt-8">
                    <label className="text-[12px] font-bold text-slate-300 mb-2 block uppercase tracking-widest">Room name</label>
                    <input
                      type="text"
                      placeholder="e.g. MoniFlow BNPL merchant dashboard"
                      value={roomName}
                      onChange={e => setRoomName(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[14px] focus:outline-none focus:border-[#6C5CE7]/50 focus:ring-1 focus:ring-[#6C5CE7]/50 text-white transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-bold text-slate-300 mb-2 block uppercase tracking-widest">Domain tag</label>
                    <select
                      value={roomDomain}
                      onChange={e => setRoomDomain(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[14px] focus:outline-none focus:border-[#6C5CE7]/50 focus:ring-1 focus:ring-[#6C5CE7]/50 text-white transition-all font-medium appearance-none"
                    >
                      <option value="product">🧩 Product</option>
                      <option value="design">🎨 Design</option>
                      <option value="engineering">⚙️ Engineering</option>
                      <option value="writing">✍️ Writing</option>
                      <option value="growth">📈 Growth</option>
                      <option value="research">🔬 Research</option>
                    </select>
                  </div>

                  <div className="bg-[#0A0910] border border-white/[0.08] rounded-2xl p-6 shadow-inner relative overflow-hidden mt-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#6C5CE7]/10 to-transparent pointer-events-none" />
                    <div className="relative z-10">
                      <div className="inline-block text-[10px] font-mono font-bold bg-[#8B7CF8]/20 text-[#8B7CF8] border border-[#8B7CF8]/30 px-2.5 py-1 rounded-md mb-3 uppercase tracking-widest">
                        {roomDomain}
                      </div>
                      <div className="text-[20px] font-extrabold text-white mb-2 font-display">
                        {roomName || "Your room name will appear here"}
                      </div>
                      <p className="text-[12px] text-slate-500 font-mono font-medium">Day 1 · 0 updates · 0 observers</p>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button
                      onClick={() => setStep(4)}
                      disabled={!roomName}
                      className="px-8 py-3.5 bg-white text-[#0A0910] text-[14px] font-extrabold rounded-full hover:bg-slate-200 transition-all flex items-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                      Open this room <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setStep(2)}
                      className="px-8 py-3.5 border border-white/[0.08] rounded-full text-[14px] font-bold hover:bg-white/[0.05] text-white transition-all flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                  </div>
                </div>
              )}

              {/* Panel 4: First update */}
              {step === 4 && (
                <div className="space-y-6 bg-white/[0.02] border border-white/[0.06] rounded-[32px] p-8 md:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#8B7CF8]/50 to-transparent opacity-50" />
                  <div>
                    <span className="text-[11px] font-mono text-[#8B7CF8] font-bold uppercase tracking-widest">Step 4 of 5 — the most important step</span>
                    <h2 className="text-[32px] font-extrabold text-white tracking-tight mt-2 font-display">Post your first update</h2>
                    <p className="text-[14px] text-slate-400 mt-2 font-medium">Write what's actually happening with your build right now — a decision you just made, something you scrapped, a question you're stuck on.</p>
                  </div>

                  <div className="bg-[#6C5CE7]/10 border border-[#6C5CE7]/20 rounded-2xl p-5 mt-6">
                    <p className="text-[13px] text-[#8B7CF8] leading-relaxed font-medium">
                      💡 <strong>Good first updates:</strong> a decision you just made and why · something you thought would work but didn't · the hardest open question in your build right now
                    </p>
                  </div>

                  <div className="pt-2">
                    <label className="text-[12px] font-bold text-slate-300 mb-2 block uppercase tracking-widest">Your first update</label>
                    <textarea
                      rows={5}
                      placeholder="e.g. Just scrapped the full merchant onboarding flow — it was 9 steps and promoters were dropping off at step 4. Moving KYC check to step 1 and cutting everything else down to 4 steps."
                      value={firstUpdate}
                      onChange={e => setFirstUpdate(e.target.value)}
                      className="w-full px-5 py-4 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[14px] focus:outline-none focus:border-[#6C5CE7]/50 focus:ring-1 focus:ring-[#6C5CE7]/50 text-white font-medium resize-none transition-all placeholder-slate-600"
                    />
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button
                      onClick={() => setStep(5)}
                      disabled={!firstUpdate}
                      className="px-8 py-3.5 bg-white text-[#0A0910] text-[14px] font-extrabold rounded-full hover:bg-slate-200 transition-all flex items-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    >
                      Continue <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="px-8 py-3.5 border border-white/[0.08] rounded-full text-[14px] font-bold hover:bg-white/[0.05] text-white transition-all flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                  </div>
                </div>
              )}

              {/* Panel 5: Schedule Onboarding Call */}
              {step === 5 && (
                <div className="space-y-6 bg-white/[0.02] border border-white/[0.06] rounded-[32px] p-8 md:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#8B7CF8]/50 to-transparent opacity-50" />
                  <div>
                    <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-widest">Final Step</span>
                    <h2 className="text-[32px] font-extrabold text-white tracking-tight mt-2 font-display">White-glove onboarding</h2>
                    <p className="text-[14px] text-slate-400 mt-2 font-medium">As part of the founding cohort, we want to personally welcome you to Patchwork and help frame your first build room.</p>
                  </div>

                  <div className="bg-[#0A0910] border border-white/[0.08] rounded-2xl p-8 text-center mt-6 shadow-inner relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(16,185,129,0.05)_0%,transparent_70%)] pointer-events-none" />
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 relative z-10">
                       <Check className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-[18px] font-extrabold text-white font-display mb-2 relative z-10">Schedule your 20-min intro call</h3>
                    <p className="text-[13px] text-slate-500 font-medium max-w-sm mx-auto mb-6 relative z-10">Choose a time that works for you. We'll chat about what you're building and how to get the best feedback.</p>
                    
                    <button
                      type="button"
                      className="px-6 py-3 bg-white/[0.05] border border-white/[0.1] rounded-full text-[13px] font-bold text-white hover:bg-white/[0.1] transition-all relative z-10"
                    >
                      Open Scheduling Calendar ↗
                    </button>
                  </div>

                  <div className="flex gap-4 pt-6">
                    <button
                      onClick={handleSignupComplete}
                      disabled={loading}
                      className="flex-1 py-4 bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF8] text-white text-[15px] font-extrabold rounded-full hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(108,92,231,0.3)]"
                    >
                      {loading ? 'Publishing room...' : 'Publish & Enter Patchwork 🚀'}
                    </button>
                  </div>
                  <div className="text-center">
                    <button
                      onClick={() => setStep(4)}
                      className="text-[12px] font-bold text-slate-500 hover:text-white transition-colors"
                    >
                      Wait, go back
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
