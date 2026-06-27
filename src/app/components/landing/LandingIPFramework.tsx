import { motion } from "motion/react";
import { Shield, Lock, Eye, FileSignature, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";

const features = [
  {
    icon: <Shield className="w-6 h-6 text-emerald-400" />,
    title: "Immutable Proof of Authorship",
    description: "Every decision is cryptographically hashed with timestamp and authorship data, creating an immutable log of when and who made the call."
  },
  {
    icon: <Lock className="w-6 h-6 text-primary-400" />,
    title: "Granular Access Controls",
    description: "Keep stealth features completely private while sharing public progress. You control exactly who sees what in your build room."
  },
  {
    icon: <FileSignature className="w-6 h-6 text-amber-400" />,
    title: "Digital NDAs",
    description: "Invited observers must digitally accept your Non-Disclosure Agreement before gaining access to private or restricted room content."
  },
  {
    icon: <Eye className="w-6 h-6 text-blue-400" />,
    title: "Comprehensive Audit Logs",
    description: "Track exactly who views, downloads, or interacts with your protected content. Total transparency on how your IP is accessed."
  }
];

export function LandingIPFramework() {
  const navigate = useNavigate();

  return (
    <section id="ip-framework" className="py-24 relative overflow-hidden bg-[#0A0812]">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary-400 bg-primary-400/10 px-3 py-1.5 rounded-full border border-primary-400/20 mx-auto md:mx-0">
              <Shield className="w-4 h-4" />
              Built for Stealth & Security
            </div>
            
            <h2 className="text-3xl md:text-5xl font-extrabold text-white font-display tracking-tight leading-tight">
              Protect your ideas with our <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-emerald-400">IP Protection Framework</span>
            </h2>
            
            <p className="text-slate-400 text-lg leading-relaxed max-w-xl mx-auto md:mx-0">
              Building in public shouldn't mean giving away your intellectual property. Patchwork uses cryptographic hashing and digital agreements to ensure your ideas remain yours, forever.
            </p>
            
            <button 
              onClick={() => navigate('/ip-framework')}
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-900 px-6 py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:-translate-y-0.5"
            >
              Read the Full IP Framework
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {features.map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/[0.02] border border-white/[0.05] hover:border-white/10 p-6 rounded-2xl transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-white/[0.03] flex items-center justify-center mb-4 border border-white/[0.05]">
                  {feature.icon}
                </div>
                <h3 className="text-white font-bold text-[15px] mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
          
        </div>
      </div>
    </section>
  );
}
