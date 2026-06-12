import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Country, State, City } from "country-state-city";
import { useAuth } from "./AuthContext";
import { AuthRedirectGuard } from "./AuthRedirectGuard";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, ArrowRight, Loader2, Check } from "lucide-react";
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
        className="w-full flex items-center justify-between px-3 py-3.5 bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] rounded-xl text-[14px] text-white focus:outline-none focus:border-[#8B7CF8]/50 focus:ring-1 focus:ring-[#8B7CF8]/30 transition-all disabled:opacity-50 text-left cursor-pointer"
      >
        <span className={selectedOption ? "text-white font-medium truncate" : "text-slate-500 font-medium truncate"}>
          {displayLabel}
        </span>
        <svg
          className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
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
              className="absolute left-0 right-0 bottom-full mb-2 bg-[#1C1A24] border border-white/[0.08] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] p-2 z-50 overflow-hidden max-h-[260px] flex flex-col"
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
                      className={`w-full text-left px-3 py-2 rounded-lg text-[13px] font-semibold transition-all truncate block ${
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

const BUILDER_TYPES = [
  { value: 'product-manager', label: '📋 Product Manager' },
  { value: 'engineer', label: '⚙️ Engineer (Coming Soon)' },
  { value: 'product-designer', label: '🎨 Product Designer (Coming Soon)' },
];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, loading: authLoading } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [builderType, setBuilderType] = useState('');
  const [interestsText, setInterestsText] = useState('');
  const [countryIso, setCountryIso] = useState('');
  const [stateIso, setStateIso] = useState('');
  const [city, setCity] = useState('');
  const [gender, setGender] = useState('');

  // Guard: if unauthenticated, go to login. If profile exists and has domain/interests, maybe they don't need onboarding?
  // But wait, the user might just have signed up. Let's allow them to complete it.
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const role = profile?.role || 'builder';

  const handleNext = () => setStep(s => s + 1);

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Import the apiCall function or use supabase directly
      const { supabase } = await import('./AuthContext');
      
      const updates: any = {
        gender,
        city: city ? `${city}, ${countryIso}` : '',
      };

      if (role === 'builder') {
        updates.domain = builderType;
      } else {
        const interestsArr = interestsText.split(',').map(s => s.trim()).filter(Boolean);
        updates.interests = interestsArr;
      }

      // Fetch current user data to do an upsert (POST) instead of update (PATCH)
      // This bypasses strict antivirus/adblock network rules that close PATCH connections
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();
        
      if (fetchError) throw fetchError;

      const payload = {
        ...currentUser,
        ...updates
      };

      const { error } = await supabase.from('users').upsert(payload, { onConflict: 'id' });
      
      if (error) throw error;

      await refreshProfile();
      toast.success("Profile setup complete!");
      
      // Navigate to dashboard
      navigate(role === 'observer' ? '/dashboard/observer' : '/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate(role === 'observer' ? '/dashboard/observer' : '/dashboard');
  };

  if (authLoading) return <div className="min-h-screen bg-[#0E0C16] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#8B7CF8]" /></div>;

  return (
    <div className="min-h-screen bg-[#0E0C16] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient backgrounds */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#6C5CE7]/10 rounded-full blur-[150px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-[#15131C]/80 backdrop-blur-xl border border-white/[0.08] rounded-[24px] p-8 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative z-10"
      >
        {/* Progress Dots */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {[1, 2].map(i => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${step >= i ? 'w-8 bg-[#8B7CF8]' : 'w-4 bg-white/[0.1]'}`} 
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Professional Identity */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col h-full"
            >
              <div className="text-center mb-8">
                <h2 className="text-[28px] font-extrabold text-white tracking-tight mb-2">
                  {role === 'builder' ? 'What do you build?' : 'What are you tracking?'}
                </h2>
                <p className="text-[15px] text-slate-400 leading-relaxed">
                  {role === 'builder' 
                    ? "Set your primary domain so we can match you with the right observers." 
                    : "Tell us what domains you are interested in observing."}
                </p>
              </div>

              {role === 'builder' ? (
                <div className="mb-8">
                  <SearchableSelect
                    label="Select your builder type"
                    value={builderType}
                    onChange={setBuilderType}
                    searchable={false}
                    options={BUILDER_TYPES}
                  />
                </div>
              ) : (
                <div className="mb-8">
                  <textarea
                    rows={3}
                    value={interestsText}
                    onChange={e => setInterestsText(e.target.value)}
                    placeholder="e.g. Product Design, Fintech, Growth Strategies..."
                    className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-[#8B7CF8]/50 focus:ring-1 focus:ring-[#8B7CF8]/30 transition-all resize-none"
                  />
                  <p className="text-[12px] text-slate-500 mt-2">Comma separated values work best.</p>
                </div>
              )}

              <div className="mt-auto pt-4 flex gap-3">
                <button
                  onClick={handleNext}
                  disabled={role === 'builder' ? !builderType || builderType !== 'product-manager' : !interestsText}
                  className="flex-1 py-3.5 bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF8] hover:opacity-90 text-white text-[14px] font-extrabold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-[0_4px_20px_rgba(108,92,231,0.3)]"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Demographics & Location */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col h-full"
            >
              <div className="text-center mb-8">
                <h2 className="text-[28px] font-extrabold text-white tracking-tight mb-2">
                  Where are you based?
                </h2>
                <p className="text-[15px] text-slate-400 leading-relaxed">
                  Add your location to connect with local builders and observers. (Optional)
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <SearchableSelect
                  label="Country"
                  value={countryIso}
                  onChange={val => {
                    setCountryIso(val);
                    setStateIso('');
                    setCity('');
                  }}
                  options={Country.getAllCountries().map(c => ({ value: c.isoCode, label: c.name }))}
                />

                <div className="grid grid-cols-2 gap-4">
                  <SearchableSelect
                    label="State"
                    value={stateIso}
                    onChange={val => {
                      setStateIso(val);
                      setCity('');
                    }}
                    disabled={!countryIso}
                    options={countryIso ? State.getStatesOfCountry(countryIso).map(s => ({ value: s.isoCode, label: s.name })) : []}
                  />

                  <SearchableSelect
                    label="City"
                    value={city}
                    onChange={setCity}
                    disabled={!stateIso}
                    options={stateIso ? City.getCitiesOfState(countryIso, stateIso).map(c => ({ value: c.name, label: c.name })) : []}
                  />
                </div>

                <div className="pt-2">
                  <SearchableSelect
                    label="Gender (Optional)"
                    value={gender}
                    onChange={setGender}
                    searchable={false}
                    options={[
                      { value: "male", label: "Male" },
                      { value: "female", label: "Female" },
                      { value: "non-binary", label: "Non-binary" },
                      { value: "prefer-not-to-say", label: "Prefer not to say" }
                    ]}
                  />
                </div>
              </div>

              <div className="mt-auto pt-4 flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3.5 bg-white/[0.05] hover:bg-white/[0.08] text-white text-[14px] font-bold rounded-xl transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex-1 py-3.5 bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF8] hover:opacity-90 text-white text-[14px] font-extrabold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-[0_4px_20px_rgba(108,92,231,0.3)]"
                >
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Completing setup...</> : <>Complete Setup <Check className="w-4 h-4" /></>}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
