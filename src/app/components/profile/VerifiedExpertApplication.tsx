import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, ArrowRight, Check, Loader2, ShieldCheck, X, Plus
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../auth/AuthContext";
import { useSaveExpertApplication, useExpertApplication } from "../../../hooks/useExpertApplication";
import { fireConfetti } from "../ui/Confetti";

const DOMAINS = [
  "Product", "Engineering", "Design", "Growth", "AI", "Fintech",
  "Cybersecurity", "Data", "Legal", "Marketing", "Founder", "Research",
  "Investment", "Other"
];

const TIMEZONES = [
  "UTC-8 (PST)", "UTC-7 (MST)", "UTC-6 (CST)", "UTC-5 (EST)",
  "UTC+0 (GMT)", "UTC+1 (WAT)", "UTC+2 (CAT)", "UTC+3 (EAT)",
  "UTC+5:30 (IST)", "UTC+8 (SGT)", "UTC+9 (JST)", "UTC+10 (AEST)"
];

const LANGUAGES = ["English", "French", "Spanish", "Portuguese", "Arabic", "Swahili", "Hindi", "Yoruba", "Igbo", "Hausa"];

const STEPS = [
  { title: "Choose your domains", subtitle: "Select up to 3 areas of expertise" },
  { title: "Your identity", subtitle: "Tell us about your professional background" },
  { title: "Your links", subtitle: "Connect your work and online presence" },
  { title: "Your story", subtitle: "Why should you be a Verified Expert?" },
  { title: "Availability", subtitle: "Set your review preferences" },
  { title: "Review & submit", subtitle: "Double-check everything before submitting" },
];

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
      {children}{required && <span className="text-rose-500 ml-1">*</span>}
    </label>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-primary-400/50 focus:ring-1 focus:ring-primary-400/30 rounded-xl text-[14px] text-slate-900 placeholder-slate-400 outline-none transition-all"
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 4 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-primary-400/50 focus:ring-1 focus:ring-primary-400/30 rounded-xl text-[14px] text-slate-900 placeholder-slate-400 outline-none transition-all resize-none"
    />
  );
}

export default function VerifiedExpertApplication() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: existing } = useExpertApplication(user?.id);
  const { mutateAsync: save } = useSaveExpertApplication(user?.id);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [domains, setDomains] = useState<string[]>(existing?.domains || []);
  const [headline, setHeadline] = useState(existing?.headline || "");
  const [bio, setBio] = useState(existing?.bio || "");
  const [yearsExp, setYearsExp] = useState(existing?.years_experience?.toString() || "");
  const [jobTitle, setJobTitle] = useState(existing?.job_title || "");
  const [company, setCompany] = useState(existing?.company || "");
  const [pastCompanies, setPastCompanies] = useState(existing?.past_companies || "");
  const [linkedinUrl, setLinkedinUrl] = useState(existing?.linkedin_url || "");
  const [portfolioUrl, setPortfolioUrl] = useState(existing?.portfolio_url || "");
  const [website, setWebsite] = useState(existing?.website || "");
  const [publicWork, setPublicWork] = useState(existing?.public_work || "");
  const [reason, setReason] = useState(existing?.reason || "");
  const [monthlyCapacity, setMonthlyCapacity] = useState(existing?.monthly_review_capacity?.toString() || "");
  const [timezone, setTimezone] = useState(existing?.timezone || "");
  const [languages, setLanguages] = useState<string[]>(existing?.languages || []);
  const [langInput, setLangInput] = useState("");

  const toggleDomain = (d: string) => {
    setDomains(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : prev.length < 3 ? [...prev, d] : prev
    );
  };

  const toggleLanguage = (lang: string) => {
    setLanguages(prev => prev.includes(lang) ? prev.filter(x => x !== lang) : [...prev, lang]);
  };

  const addCustomLang = () => {
    const trimmed = langInput.trim();
    if (trimmed && !languages.includes(trimmed)) {
      setLanguages(prev => [...prev, trimmed]);
      setLangInput("");
    }
  };

  const buildPayload = () => ({
    domains,
    headline,
    bio,
    years_experience: yearsExp ? parseInt(yearsExp) : null,
    job_title: jobTitle,
    company,
    past_companies: pastCompanies,
    linkedin_url: linkedinUrl,
    portfolio_url: portfolioUrl,
    website,
    public_work: publicWork,
    reason,
    monthly_review_capacity: monthlyCapacity ? parseInt(monthlyCapacity) : null,
    timezone,
    languages,
    verification_level: "bronze",
  });

  const canProceed = () => {
    if (step === 0) return domains.length > 0;
    if (step === 1) return headline.trim().length > 0 && jobTitle.trim().length > 0;
    if (step === 2) return linkedinUrl.trim().length > 0;
    if (step === 3) return reason.trim().length > 30;
    return true;
  };

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await save({ payload: buildPayload(), submit: true });
      fireConfetti();
      toast.success("Application submitted! We'll review it within 3–5 business days.");
      navigate(`/dashboard/profile/${user?.id}`);
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // If already approved
  if (existing?.status === "approved") {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-10 h-10 text-emerald-500" />
        </div>
        <h1 className="text-[28px] font-extrabold text-slate-900 mb-3">You're already verified!</h1>
        <p className="text-slate-600 mb-8">Your Verified Expert badge is active on your profile.</p>
        <Link to={`/dashboard/profile/${user?.id}`} className="inline-flex items-center gap-2 px-6 py-3 bg-primary-400 hover:bg-[#7a6aeb] text-white font-bold rounded-full transition-all">
          View Profile
        </Link>
      </div>
    );
  }

  // If pending review
  if (existing?.status === "pending") {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        </div>
        <h1 className="text-[28px] font-extrabold text-slate-900 mb-3">Application under review</h1>
        <p className="text-slate-600 mb-2">We received your application and are reviewing it.</p>
        <p className="text-slate-500 text-[13px] mb-8">This usually takes 3–5 business days.</p>
        <Link to={`/dashboard/profile/${user?.id}`} className="inline-flex items-center gap-2 px-6 py-3 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-bold rounded-full transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to profile
        </Link>
      </div>
    );
  }

  const rejected = existing?.status === "rejected";
  const rejectedAt = existing?.rejected_at ? new Date(existing.rejected_at) : null;
  const cooldownEnd = rejectedAt ? new Date(rejectedAt.getTime() + 30 * 24 * 60 * 60 * 1000) : null;
  const canReapply = !cooldownEnd || new Date() >= cooldownEnd;

  if (rejected && !canReapply && cooldownEnd) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-6">
          <X className="w-10 h-10 text-rose-500" />
        </div>
        <h1 className="text-[28px] font-extrabold text-slate-900 mb-3">Application not approved</h1>
        <p className="text-slate-600 mb-2">Your previous application was not approved.</p>
        <p className="text-slate-500 text-[13px] mb-8">
          You can re-apply after {cooldownEnd.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.
        </p>
        <Link to={`/dashboard/profile/${user?.id}`} className="inline-flex items-center gap-2 px-6 py-3 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-bold rounded-full transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to profile
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <Link
        to={`/dashboard/profile/${user?.id}`}
        className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-500 hover:text-slate-900 mb-8 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Back to Profile
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary-400/10 border border-primary-400/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight">Verified Expert Program</h1>
            <p className="text-[13px] text-slate-500">Bronze tier · MVP</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1.5 mb-8">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i < step ? "bg-primary-400 flex-1" :
              i === step ? "bg-primary-400 w-8" :
              "bg-slate-200 flex-1"
            }`}
          />
        ))}
      </div>

      {/* Step card */}
      <div className="bg-white border border-slate-200 rounded-[24px] p-6 sm:p-8 shadow-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-[20px] font-extrabold text-slate-900 mb-1">{STEPS[step].title}</h2>
            <p className="text-[13px] text-slate-500 mb-6">{STEPS[step].subtitle}</p>

            {/* Step 0: Domains */}
            {step === 0 && (
              <div>
                <p className="text-[12px] text-slate-500 mb-4">
                  {domains.length}/3 selected
                </p>
                <div className="flex flex-wrap gap-2">
                  {DOMAINS.map(d => {
                    const sel = domains.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDomain(d)}
                        className={`px-3.5 py-2 rounded-full text-[13px] font-bold transition-all border ${
                          sel
                            ? "bg-primary-400/10 border-primary-400/50 text-primary-400 shadow-sm"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
                        } ${!sel && domains.length >= 3 ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        {sel && <Check className="inline w-3 h-3 mr-1" />}
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 1: Identity */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <FieldLabel required>Professional headline</FieldLabel>
                  <Input value={headline} onChange={setHeadline} placeholder="e.g. Senior Product Manager at Paystack" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel required>Current role</FieldLabel>
                    <Input value={jobTitle} onChange={setJobTitle} placeholder="e.g. PM, Engineer, Founder" />
                  </div>
                  <div>
                    <FieldLabel>Years of experience</FieldLabel>
                    <Input value={yearsExp} onChange={setYearsExp} placeholder="e.g. 7" type="number" />
                  </div>
                </div>
                <div>
                  <FieldLabel>Current company</FieldLabel>
                  <Input value={company} onChange={setCompany} placeholder="e.g. Paystack" />
                </div>
                <div>
                  <FieldLabel>Past companies</FieldLabel>
                  <Input value={pastCompanies} onChange={setPastCompanies} placeholder="e.g. Flutterwave, Andela, Google" />
                </div>
              </div>
            )}

            {/* Step 2: Links */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <FieldLabel required>LinkedIn URL</FieldLabel>
                  <Input value={linkedinUrl} onChange={setLinkedinUrl} placeholder="https://linkedin.com/in/username" />
                </div>
                <div>
                  <FieldLabel>Portfolio / case studies URL</FieldLabel>
                  <Input value={portfolioUrl} onChange={setPortfolioUrl} placeholder="https://notion.so/your-portfolio" />
                </div>
                <div>
                  <FieldLabel>Personal website</FieldLabel>
                  <Input value={website} onChange={setWebsite} placeholder="https://yoursite.com" />
                </div>
                <div>
                  <FieldLabel>Public work samples</FieldLabel>
                  <Textarea
                    value={publicWork}
                    onChange={setPublicWork}
                    placeholder="Links to PRDs, design systems, posts, GitHub repos, talks…"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Story */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <FieldLabel required>Expert bio</FieldLabel>
                  <Textarea
                    value={bio}
                    onChange={setBio}
                    placeholder="Describe your expertise, what you've built, and your areas of depth..."
                    rows={4}
                  />
                </div>
                <div>
                  <FieldLabel required>Why do you want to be a Verified Expert?</FieldLabel>
                  <Textarea
                    value={reason}
                    onChange={setReason}
                    placeholder="Tell us what draws you to reviewing builds and what unique perspective you'd bring (min 30 characters)..."
                    rows={4}
                  />
                  <p className={`text-[11px] mt-1.5 ${reason.length < 30 ? "text-slate-600" : "text-emerald-500"}`}>
                    {reason.length} / 30 min characters
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Availability */}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <FieldLabel>Monthly review capacity</FieldLabel>
                  <Input
                    value={monthlyCapacity}
                    onChange={setMonthlyCapacity}
                    placeholder="e.g. 5 (reviews per month)"
                    type="number"
                  />
                  <p className="text-[11px] text-slate-500 mt-1.5">How many build reviews can you commit to monthly?</p>
                </div>
                <div>
                  <FieldLabel>Timezone</FieldLabel>
                  <div className="relative">
                    <select
                      value={timezone}
                      onChange={e => setTimezone(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-900 outline-none appearance-none transition-all focus:border-primary-400/50 cursor-pointer"
                    >
                      <option value="">Select your timezone</option>
                      {TIMEZONES.map(tz => (
                        <option key={tz} value={tz} className="bg-white">{tz}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <FieldLabel>Languages</FieldLabel>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {LANGUAGES.map(lang => {
                      const sel = languages.includes(lang);
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => toggleLanguage(lang)}
                          className={`px-3 py-1.5 rounded-full text-[12px] font-bold transition-all border ${
                            sel
                              ? "bg-primary-400/10 border-primary-400/40 text-primary-400"
                              : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          {lang}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={langInput}
                      onChange={e => setLangInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustomLang())}
                      placeholder="Add another language..."
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-900 placeholder-slate-400 outline-none focus:border-primary-400/40"
                    />
                    <button
                      type="button"
                      onClick={addCustomLang}
                      className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {step === 5 && (
              <div className="space-y-4 text-[13px]">
                <ReviewRow label="Domains" value={domains.join(", ") || "—"} />
                <ReviewRow label="Headline" value={headline || "—"} />
                <ReviewRow label="Current role" value={`${jobTitle}${company ? ` at ${company}` : ""}`} />
                <ReviewRow label="Years of exp." value={yearsExp || "—"} />
                <ReviewRow label="LinkedIn" value={linkedinUrl || "—"} />
                <ReviewRow label="Portfolio" value={portfolioUrl || "—"} />
                <ReviewRow label="Monthly capacity" value={monthlyCapacity ? `${monthlyCapacity} reviews/mo` : "—"} />
                <ReviewRow label="Timezone" value={timezone || "—"} />
                <ReviewRow label="Languages" value={languages.join(", ") || "—"} />
                <div className="mt-4 p-4 bg-primary-400/5 border border-primary-400/20 rounded-xl">
                  <p className="text-[11px] font-bold text-primary-400 uppercase tracking-widest mb-1">Why you want to join</p>
                  <p className="text-slate-700 leading-relaxed">{reason || "—"}</p>
                </div>
                <p className="text-[11px] text-slate-500 mt-4">
                  By submitting, you agree that the information above is accurate. Applications are reviewed within 3–5 business days.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Nav buttons */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-slate-100">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-[14px] transition-all border border-slate-200"
            >
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-400 hover:bg-[#7a6aeb] disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold rounded-xl text-[14px] transition-all shadow-sm"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-400 hover:bg-[#7a6aeb] disabled:opacity-50 text-white font-extrabold rounded-xl text-[14px] transition-all shadow-sm"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
              ) : (
                <><ShieldCheck className="w-4 h-4" /> Submit Application</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-slate-500 font-semibold shrink-0">{label}</span>
      <span className="text-slate-900 font-medium text-right">{value}</span>
    </div>
  );
}
