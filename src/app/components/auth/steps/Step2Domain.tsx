import React from "react";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "motion/react";

interface Step2DomainProps {
  role: 'builder' | 'observer';
  selectedTopics: string[];
  toggleTopic: (topic: string) => void;
  domain: string; setDomain: (val: string) => void;
  roomDomain: string; setRoomDomain: (val: string) => void;
  buildingDesc: string; setBuildingDesc: (val: string) => void;
  onNext: () => void;
  onBack: () => void;
  loading?: boolean;
  loadingMessage?: string;
}

const observerTopics = [
  'Product', 'Design', 'Engineering', 'Growth', 'Writing', 'Research',
];

export function Step2Domain({
  role, selectedTopics, toggleTopic, domain, setDomain, roomDomain, setRoomDomain, buildingDesc, setBuildingDesc, onNext, onBack, loading, loadingMessage
}: Step2DomainProps) {
  return (
    <div className="space-y-6 bg-white/[0.02] border border-white/[0.06] rounded-[32px] p-8 md:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#8B7CF8]/50 to-transparent opacity-50" />
      <div>
        <span className="text-[11px] font-mono text-[#8B7CF8] font-bold uppercase tracking-widest">Step 2 of 5</span>
        <h2 className="text-[32px] font-extrabold text-white tracking-tight mt-2 font-display">
          {role === 'observer' ? 'Pick the domains you care about' : 'What do you build?'}
        </h2>
        <p className="text-[14px] text-slate-400 mt-2 font-medium">
          {role === 'observer'
            ? 'Choose the areas you want to observe. This helps us personalize your feed and room recommendations.'
            : 'Pick your primary domain. Your reputation lives here. You can post across domains, but this is your home base.'}
        </p>
      </div>

      {role === 'observer' ? (
        <div className="mt-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {observerTopics.map(topic => (
              <button
                key={topic}
                type="button"
                onClick={() => toggleTopic(topic)}
                className={`p-4 border rounded-[20px] text-center transition-all ${
                  selectedTopics.includes(topic)
                    ? 'border-[#8B7CF8] bg-[#8B7CF8]/10 text-white shadow-[0_0_20px_rgba(139,124,248,0.15)]'
                    : 'border-white/[0.05] bg-white/[0.02] text-slate-400 hover:bg-white/[0.05]'
                }`}
              >
                <div className="text-[15px] font-bold">{topic}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
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
              className="w-full px-4 py-3 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[14px] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#8B7CF8]/50 text-white transition-all font-medium resize-none"
            />
          </div>
        </>
      )}

      <div className="flex gap-4 pt-6">
        <motion.button
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          onClick={onNext}
          disabled={loading}
          className="px-8 py-3.5 bg-white text-[#0A0910] text-[14px] font-extrabold rounded-full transition-all flex items-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />{loadingMessage || 'Saving...'}</>
          ) : (
            <>Continue <ArrowRight className="w-4 h-4" /></>
          )}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onBack}
          className="px-8 py-3.5 border border-white/[0.08] rounded-full text-[14px] font-bold hover:bg-white/[0.05] text-white transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </motion.button>
      </div>
    </div>
  );
}
