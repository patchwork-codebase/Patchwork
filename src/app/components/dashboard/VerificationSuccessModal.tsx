import { useState, useEffect } from "react";
import { CheckCircle, Rocket, MessageSquare, Plus, ArrowRight } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  role: string;
}

export default function VerificationSuccessModal({ isOpen, onClose, role }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setShow(true), 100);
    } else {
      setShow(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-500 ${show ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className={`relative w-full max-w-md bg-[#0D0B14] border border-emerald-500/30 rounded-3xl p-8 shadow-[0_0_80px_rgba(16,185,129,0.15)] transition-all duration-500 transform ${show ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}`}
      >
        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
          <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center backdrop-blur-md border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
            <CheckCircle className="w-12 h-12 text-emerald-400" />
          </div>
        </div>

        <div className="mt-10 text-center">
          <h2 className="text-2xl font-extrabold text-white font-display mb-2">Email Verified!</h2>
          <p className="text-slate-400 text-[15px] mb-8">
            Your account is fully activated. You now have access to all {role} features.
          </p>

          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 mb-8 text-left space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Unlocked Features</h3>
            
            {role === 'builder' ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#6C5CE7]/20 flex items-center justify-center shrink-0">
                    <Rocket className="w-4 h-4 text-[#8B7CF8]" />
                  </div>
                  <span className="text-sm font-medium text-slate-200">Initialize and manage build rooms</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#6C5CE7]/20 flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4 text-[#8B7CF8]" />
                  </div>
                  <span className="text-sm font-medium text-slate-200">Post updates to your timeline</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#6C5CE7]/20 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-[#8B7CF8]" />
                </div>
                <span className="text-sm font-medium text-slate-200">Comment and react to updates</span>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-white text-[#0A0910] hover:bg-slate-200 rounded-xl text-[14px] font-bold transition-all shadow-lg active:scale-95"
          >
            Let's Go <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
