import { motion } from "motion/react";
import { Shield, Lock, Eye, FileSignature, ArrowRight, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router";

const features = [
  {
    icon: <Shield className="w-5 h-5 text-emerald-600" />,
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    title: "Immutable Proof",
    description: "Cryptographically hashed decisions with timestamp and authorship data."
  },
  {
    icon: <Lock className="w-5 h-5 text-indigo-600" />,
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    title: "Granular Access",
    description: "Keep stealth features private while sharing public progress."
  },
  {
    icon: <FileSignature className="w-5 h-5 text-amber-600" />,
    bg: "bg-amber-50",
    border: "border-amber-200",
    title: "Digital NDAs",
    description: "Invited observers must digitally accept your NDA before access."
  },
  {
    icon: <Eye className="w-5 h-5 text-blue-600" />,
    bg: "bg-blue-50",
    border: "border-blue-200",
    title: "Audit Logs",
    description: "Total transparency on who views or interacts with your content."
  }
];

export function LandingIPFramework() {
  const navigate = useNavigate();

  return (
    <section id="ip-framework" className="py-24 sm:py-32 relative overflow-hidden bg-white border-y border-slate-200/50">
      <div className="absolute inset-0 bg-[radial-gradient(slate-200_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.3]" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Text Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-widest border border-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Enterprise-Grade Security
            </div>
            
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
              Protect your ideas with our <span className="relative whitespace-nowrap">
                <span className="relative z-10 text-slate-900">IP Framework</span>
                <span className="absolute bottom-0 left-0 w-full h-3 bg-emerald-200 -z-10 -rotate-1" />
              </span>
            </h2>
            
            <p className="text-slate-600 text-lg leading-relaxed font-medium max-w-lg">
              Building in public shouldn't mean giving away your intellectual property. Patchwork uses cryptographic hashing and digital agreements to ensure your ideas remain yours, forever.
            </p>
            
            <button 
              onClick={() => navigate('/ip-framework')}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-full font-extrabold transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
            >
              Read the Full Framework
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Right Cards Grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="bg-white group hover:bg-slate-50 border border-slate-200 hover:border-slate-300 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-default"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 border ${feature.bg} ${feature.border} group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-slate-900 font-extrabold text-[15px] mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">{feature.description}</p>
              </motion.div>
            ))}
          </div>
          
        </div>
      </div>
    </section>
  );
}
