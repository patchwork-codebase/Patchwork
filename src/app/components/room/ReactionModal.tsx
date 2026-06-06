import { useState } from "react";
import { X, Send } from "lucide-react";

const REACTION_CONFIG = {
  sharp: { emoji: '⚡', label: 'Sharp', color: 'bg-white/[0.03] border-white/[0.08] text-white', badge: 'bg-[#8B7CF8]/10 text-[#8B7CF8] border border-[#8B7CF8]/20', desc: 'Incisive, direct critique' },
  pushback: { emoji: '🔄', label: 'Push back', color: 'bg-rose-500/5 border-rose-500/20 text-rose-400', badge: 'bg-rose-500/10 text-rose-400 border border-rose-500/20', desc: 'Challenge this assumption' },
  tellmemore: { emoji: '💬', label: 'Tell me more', color: 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', desc: 'I want to explore this deeper' },
};

interface ReactionModalProps {
  updateId: string | null;
  onClose: () => void;
  onSubmit: (type: string, text: string, updateId: string | null) => Promise<void>;
}

export function ReactionModal({ updateId, onClose, onSubmit }: ReactionModalProps) {
  const [type, setType] = useState<'sharp' | 'pushback' | 'tellmemore'>('sharp');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      await onSubmit(type, text.trim(), updateId);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  const handleOverlayClick = () => {
    if (text.trim()) {
      if (window.confirm("You have typed a reaction. Discard it?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Click outside backdrop with protection */}
      <div className="absolute inset-0" onClick={handleOverlayClick} />

      <div className="bg-[#0A0910] border border-white/[0.08] rounded-[32px] w-full max-w-md shadow-2xl relative overflow-hidden z-10">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#8B7CF8]/50 to-transparent opacity-50" />
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06] relative z-10">
          <h2 className="text-[20px] font-extrabold text-white font-display">Leave a reaction</h2>
          <button
            onClick={handleOverlayClick}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/[0.05] transition-colors text-slate-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6 relative z-10">
          <div>
            <label className="block text-[13px] font-bold text-slate-300 mb-3 uppercase tracking-widest">Reaction type</label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(REACTION_CONFIG) as Array<keyof typeof REACTION_CONFIG>).map(k => {
                const r = REACTION_CONFIG[k];
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setType(k)}
                    className={`p-4 border rounded-2xl text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8] ${type === k ? `${r.color} shadow-[0_0_20px_rgba(255,255,255,0.05)]` : 'border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] text-slate-400'
                      }`}
                  >
                    <div className="text-[28px] mb-2">{r.emoji}</div>
                    <div className="text-[12px] font-bold">{r.label}</div>
                  </button>
                );
              })}
            </div>
            <p className="text-[12px] text-slate-500 mt-3 font-medium text-center">{REACTION_CONFIG[type].desc}</p>
          </div>
          <div>
            <label className="block text-[13px] font-bold text-slate-300 mb-3 uppercase tracking-widest">Your thoughts</label>
            <textarea
              required
              autoFocus
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={`Write your ${REACTION_CONFIG[type].label.toLowerCase()} reaction...`}
              rows={4}
              aria-label="Reaction thoughts"
              className="w-full px-4 py-3 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-[#6C5CE7]/50 focus:ring-1 focus:ring-[#6C5CE7]/50 transition-all resize-none font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleOverlayClick}
              className="flex-1 py-3 border border-white/[0.08] hover:bg-white/[0.05] rounded-full text-[14px] font-bold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="flex-1 py-3 bg-white text-[#0A0910] rounded-full text-[14px] font-bold hover:bg-slate-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]"
            >
              {loading ? 'Posting...' : <><Send className="w-4 h-4" /> Post reaction</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
