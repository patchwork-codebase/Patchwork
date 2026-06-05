import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth, apiCall, DEV_AUTH_BYPASS } from "./AuthContext";
import { Hammer, ArrowRight, AlertCircle, ArrowLeft, Check } from "lucide-react";
import { Step1Account } from "./steps/Step1Account";
import { toast } from "sonner";
import { Step2Domain } from "./steps/Step2Domain";

const observerTopics = [
  'Product',
  'Design',
  'Engineering',
  'Growth',
  'Writing',
  'Research',
];

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stepLoading, setStepLoading] = useState<number | null>(null); // which step is loading
  const { signIn, profile, signUp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      navigate(profile.role === 'observer' ? '/dashboard/observer' : '/dashboard');
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
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['Product', 'Design']);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [followedRooms, setFollowedRooms] = useState<string[]>([]);

  useEffect(() => {
    if (role === 'observer') {
      apiCall('/rooms')
        .then((rooms: any) => setAvailableRooms((rooms || []).slice(0, 6)))
        .catch(() => setAvailableRooms([]));
    }
  }, [role]);

  function toggleTopic(topic: string) {
    setSelectedTopics(current =>
      current.includes(topic)
        ? current.filter(item => item !== topic)
        : [...current, topic],
    );
  }

  function toggleFollow(roomId: string) {
    setFollowedRooms(current =>
      current.includes(roomId)
        ? current.filter(id => id !== roomId)
        : [...current, roomId],
    );
  }

  async function handleSignupComplete() {
    setError('');
    setLoading(true);
    try {
      const name = `${fname} ${lname}`.trim() || "Anonymous Builder";
      
      // 1. Create account
      const { profile: signedInProfile, token: authToken } = await signUp(email, password, name, role, city, domain);
      
      // If we have a profile and token, try to create room/join rooms (but don't fail the whole flow if this fails)
      if (signedInProfile && authToken) {
        try {
          if (role === 'builder') {
            const room = await apiCall('/rooms', {
              method: 'POST',
              body: JSON.stringify({
                title: roomName || `${name}'s Room`,
                description: buildingDesc || "Building live",
                tags: [roomDomain],
              }),
            }, authToken);

            if (firstUpdate) {
              await apiCall(`/rooms/${room.id}/updates`, {
                method: 'POST',
                body: JSON.stringify({
                  content: firstUpdate,
                }),
              }, authToken);
            }
          } else {
            if (selectedTopics.length || followedRooms.length) {
              await apiCall(`/users/${signedInProfile.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                  interests: selectedTopics,
                }),
              }, authToken);

              await Promise.all(followedRooms.map(roomId =>
                apiCall(`/rooms/${roomId}/join`, { method: 'POST' }, authToken),
              ));
            }
          }
        } catch (roomError) {
          console.error('Failed to setup initial room/topics:', roomError);
          // Still continue to dashboard even if this fails
        }
      } else {
        // Even if no profile/token (confirmation required), show success toast
        toast.success("Account created! Check your email to verify your address.");
      }

      // Navigate to dashboard regardless of confirmation status!
      navigate(role === 'observer' ? '/dashboard/observer' : '/dashboard');
    } catch (err: any) {
      // Check for duplicate email
      const errMsg = err.message || '';
      if (errMsg.toLowerCase().includes('already exists') || errMsg.toLowerCase().includes('duplicate')) {
        setError('An account with this email already exists');
      } else {
        setError(errMsg || 'Signup failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full max-w-screen bg-[#0E0C16] flex flex-col relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] sm:w-[800px] sm:h-[800px] bg-[#6C5CE7]/10 rounded-full blur-[100px] sm:blur-[150px] pointer-events-none z-0" />

      {/* Mobile header with simplified stepper */}
      <div className="lg:hidden bg-[#0A0910] border-b border-white/[0.05] p-4 sticky top-0 z-20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-[#6C5CE7] to-[#8B7CF8] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(108,92,231,0.5)]">
            <Hammer className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white font-display">patch·work</span>
        </div>
        {/* Progress dots */}
        <div className="flex justify-between items-center">
          {[1,2,3,4,5].map(num => {
            const isActive = step === num;
            const isDone = step > num;
            return (
              <div key={num} className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                  isActive ? 'border-[#8B7CF8] bg-[#8B7CF8]/20 text-[#8B7CF8]' :
                  isDone ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' :
                  'border-white/[0.1] bg-white/[0.02] text-slate-500'
                }`}>
                  {isDone ? <Check className="w-3 h-3" /> : num}
                </div>
                {num < 5 && (
                  <div className={`flex-1 h-0.5 mx-1 ${step > num ? 'bg-emerald-500/50' : 'bg-white/[0.08]'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Sign up: interactive 5-step wizard */}
      <div className="flex flex-1 flex-col lg:flex-row relative z-10 min-w-0">
        {/* Left wizard sidebar - only visible on desktop */}
        <div className="hidden lg:flex lg:w-[400px] bg-[#0A0910] border-r border-white/[0.05] p-8 lg:p-12 flex-col justify-between shrink-0">
          <div className="mb-12">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#6C5CE7] to-[#8B7CF8] rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(108,92,231,0.5)]">
                <Hammer className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white font-display">patch·work</span>
            </div>
            <p className="text-[11px] text-[#8B7CF8] mt-3 font-mono uppercase tracking-widest font-bold">
              {role === 'observer' ? 'observer onboarding' : 'founding builder setup'}
            </p>
          </div>

          {/* Stepper track */}
          <div className="flex-1 flex flex-col gap-6 my-auto relative before:absolute before:inset-y-2 before:left-[15px] before:w-px before:bg-white/[0.05]">
            {[
              { num: 1, title: 'Create account', desc: 'name · email · password' },
              { num: 2, title: role === 'observer' ? 'Pick your interests' : 'Your domain', desc: role === 'observer' ? 'what do you care about?' : 'what do you build?' },
              { num: 3, title: role === 'observer' ? 'Follow live rooms' : 'Open your first room', desc: role === 'observer' ? 'join rooms you want to observe' : 'name it · frame the build' },
              { num: 4, title: role === 'observer' ? 'Confirm feed preferences' : 'Post first update', desc: role === 'observer' ? 'tailor the updates you see first' : 'write · publish · begin' },
              { num: 5, title: 'White-glove call', desc: 'schedule onboarding' },
            ].map(s => {
              const isActive = step === s.num;
              const isDone = step > s.num;
              return (
                <div key={s.num} className="flex gap-4 relative z-10">
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

          <div className="mt-12 pt-8 border-t border-white/[0.05]">
            <p className="font-serif italic text-slate-400 text-[14px] leading-relaxed">
              "The feed rewards in-progress updates and honest pivots — not launch announcements."
            </p>
            <p className="text-[10px] text-slate-600 font-mono mt-3 uppercase tracking-widest">// patchwork design principle #3</p>
          </div>
        </div>

        {/* Right step panel inputs - SCROLLABLE */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-start justify-center p-4 sm:p-6 lg:p-16 min-h-full">
            <div className="w-full max-w-xl">
              {error && (
                <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl mb-8 text-[13px] font-bold text-rose-400">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              {/* Panel 1: Account details */}
              {step === 1 && (
                <Step1Account
                  fname={fname} setFname={setFname}
                  lname={lname} setLname={setLname}
                  email={email} setEmail={setEmail}
                  password={password} setPassword={setPassword}
                  city={city} setCity={setCity}
                  role={role} setRole={setRole}
                  onNext={() => {
                    setStepLoading(1);
                    setTimeout(() => {
                      setStep(2);
                      setStepLoading(null);
                    }, 300);
                  }}
                  onBack={() => navigate('/login')}
                  error={error}
                  loading={stepLoading === 1}
                />
              )}

              {/* Panel 2: Domain selector or observer interests */}
              {step === 2 && (
                <div className="space-y-5 bg-white/[0.02] border border-white/[0.06] rounded-[24px] sm:rounded-[32px] p-5 sm:p-6 md:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#8B7CF8]/50 to-transparent opacity-50" />
                  <div>
                    <span className="text-[10px] sm:text-[11px] font-mono text-[#8B7CF8] font-bold uppercase tracking-widest">Step 2 of 5</span>
                    <h2 className="text-2xl sm:text-[32px] font-extrabold text-white tracking-tight mt-2 font-display">
                      {role === 'observer' ? 'Pick the domains you care about' : 'What do you build?'}
                    </h2>
                    <p className="text-[13px] sm:text-[14px] text-slate-400 mt-2 font-medium">
                      {role === 'observer'
                        ? 'Choose the areas you want to observe. This helps us personalize your feed and room recommendations.'
                        : 'Pick your primary domain. Your reputation lives here. You can post across domains, but this is your home base.'}
                    </p>
                  </div>

                  {role === 'observer' ? (
                    <div className="mt-6">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {observerTopics.map(topic => (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => toggleTopic(topic)}
                            className={`p-3 sm:p-4 border rounded-[18px] sm:rounded-[20px] text-center transition-all ${
                              selectedTopics.includes(topic)
                                ? 'border-[#8B7CF8] bg-[#8B7CF8]/10 text-white shadow-[0_0_20px_rgba(139,124,248,0.15)]'
                                : 'border-white/[0.05] bg-white/[0.02] text-slate-400 hover:bg-white/[0.05]'
                            }`}
                          >
                            <div className="text-[14px] sm:text-[15px] font-bold">{topic}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mt-6">
                        <label className="text-[11px] sm:text-[12px] font-bold text-slate-300 mb-3 block uppercase tracking-widest">Primary domain</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                              className={`p-3 sm:p-4 border rounded-[18px] sm:rounded-[20px] text-center transition-all ${
                                domain === d.id ? 'border-[#8B7CF8] bg-[#8B7CF8]/10 text-white shadow-[0_0_20px_rgba(139,124,248,0.15)]' : 'border-white/[0.05] bg-white/[0.02] text-slate-400 hover:bg-white/[0.05]'
                                }`}
                              >
                              <div className="text-2xl sm:text-[28px] mb-2">{d.icon}</div>
                              <div className="text-[12px] sm:text-[13px] font-bold">{d.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4">
                        <label className="text-[11px] sm:text-[12px] font-bold text-slate-300 mb-1 block uppercase tracking-widest">What are you currently building?</label>
                        <p className="text-[10px] sm:text-[11px] text-[#8B7CF8] font-mono mb-3 uppercase tracking-widest">one sentence — this helps us seed your first room</p>
                        <textarea
                          rows={3}
                          placeholder="e.g. A BNPL product for informal market merchants in Lagos using PalmPay's distribution network"
                          value={buildingDesc}
                          onChange={e => setBuildingDesc(e.target.value)}
                          className="w-full px-4 py-3 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[14px] focus:outline-none focus:border-[#6C5CE7]/50 focus:ring-1 focus:ring-[#6C5CE7]/50 text-white transition-all font-medium resize-none"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-6">
                    <button
                      onClick={() => {
                        setStepLoading(2);
                        setTimeout(() => {
                          setStep(3);
                          setStepLoading(null);
                        }, 300);
                      }}
                      disabled={stepLoading === 2}
                      className="px-6 py-3.5 bg-white text-[#0A0910] text-[14px] font-extrabold rounded-full hover:bg-slate-200 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] flex-1 sm:flex-none disabled:opacity-50"
                    >
                      {stepLoading === 2 ? (
                        <div className="w-4 h-4 border-2 border-[#0A0910] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>Continue <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                    <button
                      onClick={() => setStep(1)}
                      disabled={stepLoading === 2}
                      className="px-6 py-3.5 border border-white/[0.08] rounded-full text-[14px] font-bold hover:bg-white/[0.05] text-white transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none disabled:opacity-50"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                  </div>
                </div>
              )}

              {/* Panel 3: Create Room or follow live rooms */}
              {step === 3 && (
                <div className="space-y-5 bg-white/[0.02] border border-white/[0.06] rounded-[24px] sm:rounded-[32px] p-5 sm:p-6 md:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#8B7CF8]/50 to-transparent opacity-50" />
                  <div>
                    <span className="text-[10px] sm:text-[11px] font-mono text-[#8B7CF8] font-bold uppercase tracking-widest">Step 3 of 5</span>
                    <h2 className="text-2xl sm:text-[32px] font-extrabold text-white tracking-tight mt-2 font-display">
                      {role === 'observer' ? 'Follow rooms you want to observe' : 'Open your first build room'}
                    </h2>
                    <p className="text-[13px] sm:text-[14px] text-slate-400 mt-2 font-medium">
                      {role === 'observer'
                        ? 'Choose a few live rooms to follow and shape your first observer feed.'
                        : 'Name the thing you are building. Think of this as the headline someone would see while watching you work.'}
                    </p>
                  </div>

                  {role === 'observer' ? (
                    <div className="space-y-3 mt-6">
                      {availableRooms.length ? (
                        availableRooms.map(room => {
                          const isFollowed = followedRooms.includes(room.id);
                          return (
                            <button
                              key={room.id}
                              type="button"
                              onClick={() => toggleFollow(room.id)}
                              className={`w-full rounded-2xl sm:rounded-3xl border px-4 sm:px-5 py-4 text-left transition ${isFollowed ? 'border-[#8B7CF8] bg-[#8B7CF8]/10 text-white' : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]'}`}
                            >
                              <div className="flex items-center justify-between gap-3 sm:gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="text-[12px] uppercase tracking-[0.2em] text-slate-500">{room.tags?.[0] || 'Product'}</div>
                                  <h3 className="mt-2 text-base sm:text-lg font-semibold text-white truncate">{room.title}</h3>
                                  <p className="text-xs sm:text-sm text-slate-400 mt-1">{room.observerCount} observers · {room.updateCount} updates</p>
                                </div>
                                <div className={`rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold shrink-0 ${isFollowed ? 'bg-white text-[#0A0910]' : 'bg-[#6C5CE7] text-white'}`}>
                                  {isFollowed ? 'Following' : 'Follow'}
                                </div>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="rounded-2xl sm:rounded-3xl border border-white/[0.08] bg-[#0F0C17] p-5 sm:p-6 text-slate-400">Loading rooms...</div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="mt-6">
                        <label className="text-[11px] sm:text-[12px] font-bold text-slate-300 mb-2 block uppercase tracking-widest">Room name</label>
                        <input
                          type="text"
                          placeholder="e.g. MoniFlow BNPL merchant dashboard"
                          value={roomName}
                          onChange={e => setRoomName(e.target.value)}
                          className="w-full px-4 py-3 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[14px] focus:outline-none focus:border-[#6C5CE7]/50 focus:ring-1 focus:ring-[#6C5CE7]/50 text-white transition-all font-medium"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] sm:text-[12px] font-bold text-slate-300 mb-2 block uppercase tracking-widest">Domain tag</label>
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

                      <div className="bg-[#0A0910] border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-inner relative overflow-hidden mt-6">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#6C5CE7]/10 to-transparent pointer-events-none" />
                        <div className="relative z-10">
                          <div className="inline-block text-[10px] font-mono font-bold bg-[#8B7CF8]/20 text-[#8B7CF8] border border-[#8B7CF8]/30 px-2.5 py-1 rounded-md mb-3 uppercase tracking-widest">
                            {roomDomain}
                          </div>
                          <div className="text-lg sm:text-[20px] font-extrabold text-white mb-2 font-display">
                            {roomName || "Your room name will appear here"}
                          </div>
                          <p className="text-[12px] text-slate-500 font-mono font-medium">Day 1 · 0 updates · 0 observers</p>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-6">
                    <button
                      onClick={() => {
                        setStepLoading(3);
                        setTimeout(() => {
                          setStep(4);
                          setStepLoading(null);
                        }, 300);
                      }}
                      disabled={(role === 'builder' ? !roomName : false) || stepLoading === 3}
                      className="px-6 py-3.5 bg-white text-[#0A0910] text-[14px] font-extrabold rounded-full hover:bg-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.1)] flex-1 sm:flex-none"
                    >
                      {stepLoading === 3 ? (
                        <div className="w-4 h-4 border-2 border-[#0A0910] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>{role === 'observer' ? 'Continue' : 'Open this room'} <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                    <button
                      onClick={() => setStep(2)}
                      disabled={stepLoading === 3}
                      className="px-6 py-3.5 border border-white/[0.08] rounded-full text-[14px] font-bold hover:bg-white/[0.05] text-white transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none disabled:opacity-50"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                  </div>
                </div>
              )}

              {/* Panel 4: First update or observer feed lens */}
              {step === 4 && (
                <div className="space-y-5 bg-white/[0.02] border border-white/[0.06] rounded-[24px] sm:rounded-[32px] p-5 sm:p-6 md:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#8B7CF8]/50 to-transparent opacity-50" />
                  <div>
                    <span className="text-[10px] sm:text-[11px] font-mono text-[#8B7CF8] font-bold uppercase tracking-widest">Step 4 of 5</span>
                    <h2 className="text-2xl sm:text-[32px] font-extrabold text-white tracking-tight mt-2 font-display">
                      {role === 'observer' ? 'What updates matter most to you?' : 'Post your first update'}
                    </h2>
                    <p className="text-[13px] sm:text-[14px] text-slate-400 mt-2 font-medium">
                      {role === 'observer'
                        ? 'Tell us the kinds of signals you want to see in your feed so we can make your observer experience more relevant.'
                        : "Write what's actually happening with your build right now — a decision you just made, something you scrapped, a question you're stuck on."}
                    </p>
                  </div>

                  <div className="bg-[#6C5CE7]/10 border border-[#6C5CE7]/20 rounded-2xl p-4 sm:p-5 mt-6">
                    <p className="text-[12px] sm:text-[13px] text-[#8B7CF8] leading-relaxed font-medium">
                      {role === 'observer'
                        ? '💡 Good observer notes: the decisions you care about · the updates you want to react to · the types of builders you want to follow.'
                        : '💡 Good first updates: a decision you just made and why · something you thought would work but did not · the hardest open question in your build right now.'}
                    </p>
                  </div>

                  <div className="pt-2">
                    <label className="text-[11px] sm:text-[12px] font-bold text-slate-300 mb-2 block uppercase tracking-widest">
                      {role === 'observer' ? 'Observer feed focus' : 'Your first update'}
                    </label>
                    <textarea
                      rows={4}
                      sm:rows={5}
                      placeholder={role === 'observer'
                        ? 'e.g. I want updates about product decisions, launch cadence, and user research learnings.'
                        : 'e.g. Just scrapped the full merchant onboarding flow — it was 9 steps and promoters were dropping off at step 4. Moving KYC check to step 1 and cutting everything else down to 4 steps.'}
                      value={firstUpdate}
                      onChange={e => setFirstUpdate(e.target.value)}
                      className="w-full px-4 sm:px-5 py-3 sm:py-4 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[14px] focus:outline-none focus:border-[#6C5CE7]/50 focus:ring-1 focus:ring-[#6C5CE7]/50 text-white font-medium resize-none transition-all placeholder-slate-600"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-6">
                    <button
                      onClick={() => {
                        setStepLoading(4);
                        setTimeout(() => {
                          setStep(5);
                          setStepLoading(null);
                        }, 300);
                      }}
                      disabled={!firstUpdate || stepLoading === 4}
                      className="px-6 py-3.5 bg-white text-[#0A0910] text-[14px] font-extrabold rounded-full hover:bg-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.1)] flex-1 sm:flex-none"
                    >
                      {stepLoading === 4 ? (
                        <div className="w-4 h-4 border-2 border-[#0A0910] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>Continue <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      disabled={stepLoading === 4}
                      className="px-6 py-3.5 border border-white/[0.08] rounded-full text-[14px] font-bold hover:bg-white/[0.05] text-white transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none disabled:opacity-50"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                  </div>
                </div>
              )}

              {/* Panel 5: Schedule Onboarding Call */}
              {step === 5 && (
                <div className="space-y-5 bg-white/[0.02] border border-white/[0.06] rounded-[24px] sm:rounded-[32px] p-5 sm:p-6 md:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#8B7CF8]/50 to-transparent opacity-50" />
                  <div>
                    <span className="text-[10px] sm:text-[11px] font-mono text-emerald-400 font-bold uppercase tracking-widest">Final Step</span>
                    <h2 className="text-2xl sm:text-[32px] font-extrabold text-white tracking-tight mt-2 font-display">White-glove onboarding</h2>
                    <p className="text-[13px] sm:text-[14px] text-slate-400 mt-2 font-medium">As part of the founding cohort, we want to personally welcome you to Patchwork and help frame your first build room.</p>
                    <p className="text-[12px] text-amber-400 mt-3 font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      You'll need to verify your email before accessing all features.
                    </p>
                  </div>

                  <div className="bg-[#0A0910] border border-white/[0.08] rounded-2xl p-6 sm:p-8 text-center mt-6 shadow-inner relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(16,185,129,0.05)_0%,transparent_70%)] pointer-events-none" />
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-center mx-auto mb-4 relative z-10">
                       <Check className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-base sm:text-lg sm:text-[18px] font-extrabold text-white font-display mb-2 relative z-10">Schedule your 20-min intro call</h3>
                    <p className="text-[12px] sm:text-[13px] text-slate-500 font-medium max-w-sm mx-auto mb-6 relative z-10">Choose a time that works for you. We'll chat about what you're building and how to get the best feedback.</p>
                    
                    <button
                      type="button"
                      className="px-5 sm:px-6 py-2.5 sm:py-3 bg-white/[0.05] border border-white/[0.1] rounded-full text-[12px] sm:text-[13px] font-bold text-white hover:bg-white/[0.1] transition-all relative z-10"
                    >
                      Open Scheduling Calendar ↗
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 pt-6">
                    <button
                      onClick={handleSignupComplete}
                      disabled={loading}
                      className="w-full py-4 bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF8] text-white text-[15px] font-extrabold rounded-full hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(108,92,231,0.3)]"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {role === 'observer' ? 'Creating observer account...' : 'Publishing room...'}
                        </>
                      ) : (
                        <>{role === 'observer' ? 'Finish observer onboarding 🚀' : 'Publish & Enter Patchwork 🚀'}</>
                      )}
                    </button>
                  </div>
                  <div className="text-center">
                    <button
                      onClick={() => setStep(4)}
                      disabled={loading}
                      className="text-[12px] font-bold text-slate-500 hover:text-white transition-colors disabled:opacity-50"
                    >
                      Wait, go back
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
