import React from "react";
import { ArrowRight, User, Mail, Lock, MapPin, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { motion } from "motion/react";

interface Step1AccountProps {
  fname: string; setFname: (val: string) => void;
  lname: string; setLname: (val: string) => void;
  email: string; setEmail: (val: string) => void;
  password: string; setPassword: (val: string) => void;
  city: string; setCity: (val: string) => void;
  role: 'builder' | 'observer'; setRole: (val: 'builder' | 'observer') => void;
  onNext: () => void;
  onBack: () => void;
  loading?: boolean;
  loadingMessage?: string;
  error?: string;
}

const validatePassword = (password: string) => {
  return {
    hasMinLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };
};

export function Step1Account({
  fname, setFname, lname, setLname, email, setEmail, password, setPassword, city, setCity, role, setRole, onNext, onBack, error, loading = false, loadingMessage
}: Step1AccountProps) {
  const passwordValidations = validatePassword(password);
  const isPasswordValid = Object.values(passwordValidations).every(Boolean);
  const isFormValid = !!(fname && lname && email && city && isPasswordValid && role);

  return (
    <div className="space-y-6 bg-white/[0.02] border border-white/[0.06] rounded-[32px] p-8 md:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#8B7CF8]/50 to-transparent opacity-50" />
      <div>
        <span className="text-[11px] font-mono text-[#8B7CF8] font-bold uppercase tracking-widest">Step 1 of 5</span>
        <h2 className="text-[32px] font-extrabold text-white tracking-tight mt-2 font-display">Create your account</h2>
        <p className="text-[14px] text-slate-400 mt-2 font-medium">You're joining as a founding member. Authenticate below to start setup.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-[13px] font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-5 mt-8">
        <div>
          <label className="text-[12px] font-bold text-slate-300 mb-2 block uppercase tracking-widest">First name</label>
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#8B7CF8] transition-colors" />
            <input
              type="text"
              placeholder="Akin"
              value={fname}
              onChange={e => setFname(e.target.value)}
              disabled={loading}
              className="w-full pl-11 pr-4 py-3 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[14px] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#8B7CF8]/50 text-white placeholder-slate-600 transition-all font-medium disabled:opacity-50"
            />
          </div>
        </div>
        <div>
          <label className="text-[12px] font-bold text-slate-300 mb-2 block uppercase tracking-widest">Last name</label>
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#8B7CF8] transition-colors" />
            <input
              type="text"
              placeholder="Rodolu"
              value={lname}
              onChange={e => setLname(e.target.value)}
              disabled={loading}
              className="w-full pl-11 pr-4 py-3 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[14px] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#8B7CF8]/50 text-white placeholder-slate-600 transition-all font-medium disabled:opacity-50"
            />
          </div>
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
              disabled={loading}
              className={`rounded-[18px] border px-4 py-3 text-left transition w-full sm:w-auto ${role === option.id ? 'border-[#8B7CF8] bg-[#8B7CF8]/10 text-white' : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]'} disabled:opacity-50`}
            >
              <div className="font-semibold">{option.label}</div>
              <div className="text-[12px] text-slate-500 mt-1">{option.desc}</div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-[12px] font-bold text-slate-300 mb-2 block uppercase tracking-widest">Email</label>
        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#8B7CF8] transition-colors" />
          <input
            type="email"
            placeholder="you@domain.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={loading}
            className="w-full pl-11 pr-4 py-3 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[14px] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#8B7CF8]/50 text-white placeholder-slate-600 transition-all font-medium disabled:opacity-50"
          />
        </div>
      </div>

      <div>
        <label className="text-[12px] font-bold text-slate-300 mb-2 block uppercase tracking-widest">Password</label>
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#8B7CF8] transition-colors" />
          <input
            type="password"
            placeholder="••••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
            className="w-full pl-11 pr-4 py-3 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[14px] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#8B7CF8]/50 text-white placeholder-slate-600 transition-all font-medium disabled:opacity-50"
          />
        </div>
        <div className="mt-3 space-y-2">
          {[
            { key: 'hasMinLength', label: 'At least 8 characters' },
            { key: 'hasUpperCase', label: 'Contains an uppercase letter' },
            { key: 'hasNumber', label: 'Contains a number' }
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2 text-[12px]">
              {passwordValidations[key as keyof typeof passwordValidations] ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-slate-500" />
              )}
              <span className={passwordValidations[key as keyof typeof passwordValidations] ? 'text-emerald-400' : 'text-slate-500'}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[12px] font-bold text-slate-300 mb-2 block uppercase tracking-widest">City</label>
        <div className="relative group">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-[#8B7CF8] transition-colors" />
          <input
            type="text"
            placeholder="Lagos, Nigeria"
            value={city}
            onChange={e => setCity(e.target.value)}
            disabled={loading}
            className="w-full pl-11 pr-4 py-3 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[14px] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#8B7CF8]/50 text-white placeholder-slate-600 transition-all font-medium disabled:opacity-50"
          />
        </div>
      </div>

      <div className="flex gap-4 pt-6">
        <motion.button
          whileHover={{ scale: isFormValid && !loading ? 1.02 : 1 }}
          whileTap={{ scale: isFormValid && !loading ? 0.98 : 1 }}
          onClick={onNext}
          disabled={!isFormValid || loading}
          className="px-8 py-3.5 bg-white text-[#0A0910] text-[14px] font-extrabold rounded-full transition-all flex items-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />{loadingMessage || 'Setting up...'}</>
          ) : (
            <>Continue <ArrowRight className="w-4 h-4" /></>
          )}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onBack}
          disabled={loading}
          className="px-8 py-3.5 border border-white/[0.08] rounded-full text-[14px] font-bold hover:bg-white/[0.05] text-white transition-all disabled:opacity-50"
        >
          Sign In
        </motion.button>
      </div>
    </div>
  );
}
