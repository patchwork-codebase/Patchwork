import React from 'react';
import { Play, TrendingUp, Award, Zap, ArrowRight, Activity, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';

export default function PMStudioDashboard() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[calc(100vh-60px)] p-6 md:p-10 max-w-7xl mx-auto overflow-hidden">
      
      {/* Background ambient glows */}
      <div className="absolute top-0 left-[20%] w-[500px] h-[500px] bg-primary-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-[10%] w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />

      <motion.header 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 relative"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-500/10 border border-primary-500/20 rounded-full text-primary-400 text-xs font-bold uppercase tracking-widest mb-4">
          <Activity className="w-3.5 h-3.5" /> Workspace
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
          PM <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-orange-500">Studio</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl font-medium">
          Practice your product sense, solve real-world scenarios, and build a verified portfolio of your strategic thinking.
        </p>
      </motion.header>

      {/* Quick Stats */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14"
      >
        {[
          { label: 'Current Streak', value: '0', unit: 'days', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'group-hover:border-amber-500/30' },
          { label: 'Completed', value: '0', icon: Play, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'group-hover:border-blue-500/30' },
          { label: 'Avg Score', value: '--', icon: Award, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'group-hover:border-emerald-500/30' },
          { label: 'Top Skill', value: 'N/A', icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'group-hover:border-purple-500/30' },
        ].map((stat, idx) => (
          <div key={idx} className={`group bg-slate-50 dark:bg-[#15131C]/80 backdrop-blur-md border border-slate-100 dark:border-white/5 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 ${stat.border} relative overflow-hidden`}>
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/[0.02] rounded-full blur-2xl group-hover:bg-white/[0.04] transition-colors" />
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className={`w-8 h-8 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-sm font-bold">{stat.label}</div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white relative z-10 flex items-baseline gap-1">
              {stat.value}
              {stat.unit && <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">{stat.unit}</span>}
            </div>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Recommended Scenarios */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3 space-y-6"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Jump Back In</h2>
            <button className="text-sm font-bold text-primary-500 hover:text-primary-400 flex items-center gap-1 transition-colors">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="grid gap-4">
            {/* Card 1 */}
            <div 
              onClick={() => navigate('/pm-studio/case-studies')}
              className="group relative bg-slate-50 dark:bg-[#15131C] border border-slate-100 dark:border-white/5 hover:border-primary-500/30 rounded-3xl p-1 overflow-hidden transition-all duration-500 cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/5 to-primary-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%]" />
              <div className="bg-white dark:bg-[#1A1824] rounded-[22px] p-6 h-full flex flex-col sm:flex-row gap-6 items-start sm:items-center relative z-10">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-2.5 py-1 bg-primary-500/10 text-primary-500 text-[10px] font-black uppercase tracking-widest rounded-md border border-primary-500/20">
                      Case Study
                    </span>
                    <span className="text-slate-500 text-xs font-bold font-mono">30 MINS</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary-400 transition-colors truncate">Spotify Retention Drop</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-lg">
                    Analyze a simulated 18% MoM retention drop in the US market. Dive into analytics, user feedback, and eng constraints to prioritize a fix.
                  </p>
                </div>
                <button className="shrink-0 flex items-center justify-center w-14 h-14 rounded-full bg-primary-500 text-white shadow-[0_0_20px_rgba(255,91,34,0.3)] group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(255,91,34,0.5)] transition-all duration-300">
                  <Play className="w-5 h-5 ml-1" />
                </button>
              </div>
            </div>

            {/* Card 2 */}
            <div 
              onClick={() => navigate('/pm-studio/decisions')}
              className="group relative bg-slate-50 dark:bg-[#15131C] border border-slate-100 dark:border-white/5 hover:border-emerald-500/30 rounded-3xl p-1 overflow-hidden transition-all duration-500 cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-[-100%] group-hover:translate-x-[100%]" />
              <div className="bg-white dark:bg-[#1A1824] rounded-[22px] p-6 h-full flex flex-col sm:flex-row gap-6 items-start sm:items-center relative z-10">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-emerald-500/20">
                      Decision Sim
                    </span>
                    <span className="text-slate-500 text-xs font-bold font-mono">5 MINS</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-emerald-400 transition-colors truncate">The Growth Dilemma</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-lg">
                    Revenue is down. Marketing wants discounts, Engineering wants infra. Balance the trade-offs and justify your choice.
                  </p>
                </div>
                <button className="shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-white/5 text-white border border-slate-100 dark:border-white/10 group-hover:bg-emerald-500 group-hover:border-emerald-500 group-hover:text-black transition-all duration-300 shadow-sm dark:shadow-none">
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Skill Graph Placeholder */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Your Skill Radar</h2>
          <div className="bg-white dark:bg-gradient-to-b dark:from-[#1A1824] dark:to-[#15131C] border border-slate-200 dark:border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[380px] text-center relative overflow-hidden shadow-xl dark:shadow-2xl">
            {/* Subtle radar rings background */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 dark:opacity-20 pointer-events-none">
              <div className="w-32 h-32 rounded-full border border-slate-300 dark:border-slate-500 absolute" />
              <div className="w-48 h-48 rounded-full border border-slate-300 dark:border-slate-600 absolute" />
              <div className="w-64 h-64 rounded-full border border-slate-200 dark:border-slate-700 absolute" />
            </div>

            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center mb-6 shadow-sm dark:shadow-[0_0_30px_rgba(0,0,0,0.5)] z-10 relative">
                <Award className="w-8 h-8 text-slate-400 dark:text-slate-400" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 relative z-10">Unlock Your Profile</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs leading-relaxed relative z-10">
              Complete scenarios to generate your verified AI evaluation graph. Track your progress across 7 product dimensions.
            </p>
            
            <button 
              onClick={() => navigate('/pm-studio/profile')}
              className="mt-8 px-6 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold text-slate-900 dark:text-white transition-colors relative z-10 shadow-sm dark:shadow-none"
            >
              View Empty Profile
            </button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
