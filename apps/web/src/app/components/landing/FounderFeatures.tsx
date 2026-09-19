import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Users, Lock, ChevronRight, Zap, Target, ShieldCheck } from 'lucide-react';

export function FounderFeatures() {
  const [activeTab, setActiveTab] = useState(0);

  const features = [
    {
      id: 'investors',
      icon: <LineChart className="w-5 h-5" />,
      title: 'Investor Updates',
      desc: 'Generate read-only reports and roadmaps to show month-over-month velocity. Let your product do the talking.'
    },
    {
      id: 'recruiting',
      icon: <Users className="w-5 h-5" />,
      title: 'Data-Driven Hiring',
      desc: 'Create paid bounties or 7-day trials. Test potential hires on actual codebase issues, not whiteboard algorithms.'
    },
    {
      id: 'security',
      icon: <Lock className="w-5 h-5" />,
      title: 'Role-Based Access',
      desc: 'Control exactly who sees what. Keep sensitive roadmaps and IP completely private while building in public.'
    }
  ];

  return (
    <section className="py-32 bg-[#0A0A0A] relative overflow-hidden border-t border-slate-100 dark:border-white/5">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column: Interactive Tabs */}
          <div>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-6 leading-tight">
              Scale your team, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] italic">not your overhead.</span>
            </h2>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-lg mb-12 max-w-lg">
              Patchwork gives founders the ultimate executive dashboard. Monitor velocity, hire based on verified skills, and securely report to stakeholders without the busywork.
            </p>

            <div className="space-y-4">
              {features.map((feature, idx) => (
                <button
                  key={feature.id}
                  onClick={() => setActiveTab(idx)}
                  className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 ${
                    activeTab === idx 
                      ? 'bg-white/10 border-[#f59e0b]/50 shadow-[0_0_30px_rgba(245,158,11,0.1)]' 
                      : 'bg-transparent border-transparent hover:bg-white/5'
                  }`}
                >
                  <div className="flex gap-4">
                    <div className={`mt-1 w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      activeTab === idx ? 'bg-[#f59e0b] text-slate-900' : 'bg-white/10 text-slate-400'
                    }`}>
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className={`text-xl font-bold mb-2 ${activeTab === idx ? 'text-white' : 'text-slate-300'}`}>
                        {feature.title}
                      </h4>
                      <p className={`text-sm leading-relaxed ${activeTab === idx ? 'text-slate-300' : 'text-slate-500'}`}>
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: The "Screen" */}
          <div className="relative h-[600px] w-full bg-white dark:bg-[#111111] rounded-3xl border border-[#333333] shadow-2xl overflow-hidden flex flex-col">
            {/* Top Bar of Screen */}
            <div className="h-12 border-b border-[#333333] bg-[#0A0A0A] flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              <div className="mx-auto flex items-center gap-2 bg-[#1A1A1A] px-3 py-1 rounded-md border border-[#333]">
                <Lock className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">dashboard.patchwork.com</span>
              </div>
            </div>

            {/* Dynamic Content Area */}
            <div className="flex-1 relative bg-[#0F0F0F] p-6 overflow-hidden">
              <AnimatePresence mode="wait">
                {activeTab === 0 && (
                  <motion.div
                    key="investor-update"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Q3 Performance</div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Velocity Score</h3>
                      </div>
                      <div className="text-5xl font-black text-[#fbbf24] flex items-center gap-2">
                        94 <Zap className="w-8 h-8 fill-[#fbbf24]" />
                      </div>
                    </div>
                    
                    <div className="space-y-6 flex-1">
                      <div className="bg-[#1A1A1A] border border-[#333] p-4 rounded-xl">
                        <div className="flex justify-between text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
                          <span>Features Shipped</span>
                          <span className="text-[#10b981]">24 / 20 Target</span>
                        </div>
                        <div className="w-full bg-[#0A0A0A] rounded-full h-3 border border-[#333]">
                          <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1, delay: 0.2 }} className="bg-[#10b981] h-full rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></motion.div>
                        </div>
                      </div>
                      
                      <div className="bg-[#1A1A1A] border border-[#333] p-4 rounded-xl">
                        <div className="flex justify-between text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
                          <span>Active Builders</span>
                          <span className="text-[#fbbf24]">12</span>
                        </div>
                        <div className="w-full bg-[#0A0A0A] rounded-full h-3 border border-[#333]">
                          <motion.div initial={{ width: 0 }} animate={{ width: '60%' }} transition={{ duration: 1, delay: 0.4 }} className="bg-[#fbbf24] h-full rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)]"></motion.div>
                        </div>
                      </div>
                      
                      <div className="bg-[#1A1A1A] border border-[#333] p-4 rounded-xl">
                        <div className="flex justify-between text-sm font-bold text-slate-600 dark:text-slate-300 mb-2">
                          <span>Burn Rate vs Budget</span>
                          <span className="text-red-400">Under Budget</span>
                        </div>
                        <div className="w-full bg-[#0A0A0A] rounded-full h-3 border border-[#333]">
                          <motion.div initial={{ width: 0 }} animate={{ width: '40%' }} transition={{ duration: 1, delay: 0.6 }} className="bg-red-500 h-full rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></motion.div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 1 && (
                  <motion.div
                    key="recruiting"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Active Pipeline</div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Top Candidates</h3>
                      </div>
                      <Target className="w-8 h-8 text-[#fbbf24]" />
                    </div>

                    <div className="space-y-4">
                      {[
                        { name: 'Sarah Chen', role: 'Frontend Engineer', score: '98%', status: 'Trial Passed', color: '#10b981' },
                        { name: 'Alex Rivera', role: 'Full Stack', score: '92%', status: 'In Simulation', color: '#fbbf24' },
                        { name: 'James Doe', role: 'Backend Engineer', score: '85%', status: 'In Simulation', color: '#fbbf24' },
                      ].map((candidate, i) => (
                        <motion.div 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          key={i} 
                          className="bg-[#1A1A1A] border border-[#333] p-4 rounded-xl flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#0A0A0A] border border-[#333] flex items-center justify-center text-slate-900 dark:text-white font-bold">
                              {candidate.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-slate-900 dark:text-white font-bold text-sm">{candidate.name}</div>
                              <div className="text-slate-500 text-xs">{candidate.role}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-slate-900 dark:text-white mb-1">{candidate.score} Match</div>
                            <div className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${candidate.color}20`, color: candidate.color }}>
                              {candidate.status}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 2 && (
                  <motion.div
                    key="security"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="h-full flex flex-col items-center justify-center text-center"
                  >
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring" }}
                      className="w-24 h-24 rounded-full bg-[#1A1A1A] border-4 border-[#333] flex items-center justify-center mb-6 relative"
                    >
                      <ShieldCheck className="w-10 h-10 text-[#fbbf24]" />
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#10b981] border-2 border-[#1A1A1A]"></div>
                    </motion.div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Enterprise-Grade IP Protection</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8">
                      Your codebase stays yours. Developers only get access to the specific simulation branches they are working on.
                    </p>
                    
                    <div className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl p-1 flex">
                      <div className="flex-1 text-center py-2 bg-[#333] rounded-lg text-slate-900 dark:text-white text-xs font-bold">Admin View</div>
                      <div className="flex-1 text-center py-2 text-slate-500 text-xs font-bold">Builder View</div>
                      <div className="flex-1 text-center py-2 text-slate-500 text-xs font-bold">Investor View</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
