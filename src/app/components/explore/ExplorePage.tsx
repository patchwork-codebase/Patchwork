import { Link } from "react-router";
import { Search, Compass } from "lucide-react";

export default function ExplorePage() {
  return (
    <div className="max-w-[1080px] w-full mx-auto px-4 sm:px-6 py-12 relative overflow-hidden">
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[380px] h-[380px] sm:w-[600px] sm:h-[600px] bg-[#6C5CE7]/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#6C5CE7]/10 border border-[#6C5CE7]/20 rounded-full mb-4 mx-auto">
          <Compass className="w-3.5 h-3.5 text-[#8B7CF8]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#8B7CF8]">Directory</span>
        </div>
        <h1 className="text-5xl sm:text-[40px] font-extrabold text-white font-display tracking-tight leading-tight mb-3">
          Explore <span className="text-[#8B7CF8]">Builders</span>
        </h1>
        <p className="text-[15px] text-slate-400 font-medium">
          Discover builders working in the open across Patchwork.
        </p>
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-[32px] px-6 py-10 sm:p-16 text-center backdrop-blur-md relative overflow-hidden max-w-2xl mx-auto shadow-xl">
        <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-[#6C5CE7]/30 to-transparent opacity-50" />
        
        <div className="w-20 h-20 rounded-[24px] bg-[#6C5CE7]/10 border border-[#6C5CE7]/20 flex items-center justify-center mx-auto mb-6 shadow-inner relative group">
          <Search className="w-8 h-8 text-[#8B7CF8] group-hover:scale-110 transition-transform duration-300" />
        </div>
        
        <p className="font-display font-extrabold text-[24px] text-white mb-3 tracking-tight">
          Coming soon
        </p>
        <p className="text-[14px] text-slate-400 max-w-[360px] mx-auto leading-relaxed font-medium mb-8">
          The builder directory is in active development. For now,{' '}
          <Link to="/dashboard" className="text-[#8B7CF8] font-bold hover:text-white transition-colors">browse the global timeline</Link>{' '}
          to discover what's being built.
        </p>
      </div>
    </div>
  );
}
