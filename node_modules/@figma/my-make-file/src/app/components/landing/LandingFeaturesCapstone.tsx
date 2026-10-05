import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Terminal, Zap, ShieldCheck, Activity, Code, GitCommit, Users } from 'lucide-react';
import React, { useState } from 'react';

const FEATURES = [
  {
    id: 'build',
    title: 'Live Build Rooms',
    desc: 'Sync Figma files and log UX trade-offs seamlessly. Built for delivery, with a timeline that updates live.',
    icon: Terminal,
    color: 'from-orange-500 to-red-500',
    shadow: 'shadow-orange-500/20',
  },
  {
    id: 'observer',
    title: 'Observer Network',
    desc: 'Feedback arrives in minutes from verified senior talent. Stop waiting on async PR reviews.',
    icon: Activity,
    color: 'from-emerald-400 to-emerald-600',
    shadow: 'shadow-emerald-500/20',
  },
  {
    id: 'rep',
    title: 'Reputation Engine',
    desc: 'Every validated decision bumps your score automatically. Turn your daily commits into career capital.',
    icon: Zap,
    color: 'from-blue-400 to-indigo-600',
    shadow: 'shadow-blue-500/20',
  },
  {
    id: 'verified',
    title: 'Verified Work',
    desc: 'A portfolio you can trust. No buzzwords, just the actual logs cryptographically tied to your profile.',
    icon: ShieldCheck,
    color: 'from-purple-400 to-pink-600',
    shadow: 'shadow-purple-500/20',
  }
];

export function LandingFeaturesCapstone() {
  const [activeFeature, setActiveFeature] = useState(FEATURES[0].id);

  return (
    <section className="bg-[#050505] py-24 sm:py-36 px-5 sm:px-8 lg:px-12 border-t border-white/5 relative z-20 overflow-hidden">
      {/* Background glow based on active feature */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
         <AnimatePresence mode="popLayout">
           {FEATURES.map(f => f.id === activeFeature && (
             <motion.div
               key={f.id}
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 0.15, scale: 1 }}
               exit={{ opacity: 0, scale: 1.2 }}
               transition={{ duration: 1, ease: "easeInOut" }}
               className={`w-[800px] h-[800px] rounded-full bg-gradient-to-br ${f.color} blur-[120px] absolute`}
             />
           ))}
         </AnimatePresence>
      </div>

      <div className="mx-auto max-w-7xl relative z-10">
        <div className="mb-16 md:mb-24 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-primary-500 font-bold text-sm tracking-widest uppercase font-mono mb-6 flex items-center gap-3"
          >
            <span className="w-8 h-[2px] bg-primary-500" />
            The Ecosystem
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tighter leading-[1.05]"
          >
            Stop typing threads. <br/>
            <span className="text-white/30">Start shipping proof.</span>
          </motion.h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
          
          {/* Interactive Feature List */}
          <div className="w-full lg:w-5/12 flex flex-col gap-4">
            {FEATURES.map((feature, index) => {
              const isActive = activeFeature === feature.id;
              const Icon = feature.icon;
              
              return (
                <div
                  key={feature.id}
                  onClick={() => setActiveFeature(feature.id)}
                  className={`group relative p-6 rounded-2xl cursor-pointer transition-all duration-500 ${
                    isActive ? 'bg-white/5 border border-white/10' : 'hover:bg-white/[0.02] border border-transparent'
                  }`}
                >
                  {/* Progress Line */}
                  {isActive && (
                    <motion.div 
                      layoutId="activeFeatureIndicator"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-400 to-primary-600 rounded-l-2xl"
                    />
                  )}
                  
                  <div className="flex items-start gap-5">
                    <div className={`mt-1 flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-500 ${
                      isActive ? 'bg-white/10 text-white' : 'bg-[#111] text-white/30 group-hover:text-white/60'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold mb-2 transition-colors duration-500 ${
                        isActive ? 'text-white' : 'text-white/40 group-hover:text-white/80'
                      }`}>
                        {feature.title}
                      </h3>
                      <AnimatePresence>
                        {isActive && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-white/60 leading-relaxed text-sm overflow-hidden"
                          >
                            {feature.desc}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dynamic Visualizer Area */}
          <div className="w-full lg:w-7/12 sticky top-32">
            <div className="aspect-square md:aspect-[4/3] rounded-[40px] bg-[#0A0A0A] border border-white/10 overflow-hidden relative shadow-2xl">
              
              {/* Glass reflection */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none z-10" />

              <AnimatePresence mode="wait">
                {activeFeature === 'build' && <VisualizerBuild key="build" />}
                {activeFeature === 'observer' && <VisualizerObserver key="observer" />}
                {activeFeature === 'rep' && <VisualizerReputation key="rep" />}
                {activeFeature === 'verified' && <VisualizerVerified key="verified" />}
              </AnimatePresence>
              
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

/* =======================================================================
   Animated Visualizers for each feature
======================================================================= */

function VisualizerBuild() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 p-8 flex flex-col justify-center"
    >
      <div className="w-full max-w-md mx-auto bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="h-10 border-b border-white/5 flex items-center px-4 gap-2 bg-[#151515]">
          <div className="w-3 h-3 rounded-full bg-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-green-500/50" />
        </div>
        <div className="p-6 font-mono text-sm text-white/70 flex flex-col gap-4">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex gap-3">
            <span className="text-primary-500">➜</span>
            <span>git commit -m "Shipped feature parity"</span>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }} className="flex gap-3 text-emerald-400">
            <span>✔</span>
            <span>Syncing to Patchwork Room...</span>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0 }} className="flex gap-3 text-white">
            <GitCommit className="w-5 h-5 text-emerald-500" />
            <div className="bg-white/5 p-3 rounded-lg border border-white/10 flex-1">
              <div className="text-white font-bold mb-1">Update Generated</div>
              <div className="text-white/50 text-xs">AI analyzed your diff and logged the decision.</div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function VisualizerObserver() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.6, ease: "circOut" }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <div className="relative w-64 h-64">
        {/* Central Hub */}
        <div className="absolute inset-0 m-auto w-20 h-20 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl rotate-45 flex items-center justify-center animate-pulse">
           <Activity className="w-8 h-8 text-emerald-400 -rotate-45" />
        </div>
        
        {/* Orbiting nodes */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ rotate: 360 }}
            transition={{ duration: 10 + i * 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 m-auto w-full h-full"
          >
            <div className={`absolute top-0 left-1/2 -ml-6 w-12 h-12 bg-[#151515] border border-white/10 rounded-full flex items-center justify-center ${i % 2 === 0 ? 'text-emerald-400' : 'text-blue-400'}`}>
              <Users className="w-5 h-5" />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function VisualizerReputation() {
  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(20px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <div className="relative flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute w-80 h-80 border border-dashed border-blue-500/30 rounded-full" 
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute w-64 h-64 border-2 border-transparent border-t-blue-500/50 border-b-blue-500/50 rounded-full" 
        />
        
        <div className="text-center z-10 bg-[#0A0A0A] w-48 h-48 rounded-full flex flex-col items-center justify-center border border-white/10 shadow-[0_0_50px_rgba(59,130,246,0.2)]">
          <Zap className="w-8 h-8 text-blue-400 mb-2" />
          <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-indigo-600">
            842
          </div>
          <div className="text-white/40 font-mono text-xs mt-2 uppercase tracking-widest">Score</div>
        </div>
      </div>
    </motion.div>
  );
}

function VisualizerVerified() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.6, type: "spring" }}
      className="absolute inset-0 flex items-center justify-center p-12"
    >
      <div className="relative w-full max-w-sm">
        <div className="bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl relative z-10">
          <div className="flex gap-4 items-center mb-6">
            <div className="w-12 h-12 bg-white/5 rounded-full" />
            <div className="space-y-2 flex-1">
               <div className="h-3 w-1/2 bg-white/20 rounded" />
               <div className="h-2 w-1/3 bg-white/10 rounded" />
            </div>
          </div>
          <div className="space-y-3">
             <div className="h-2 w-full bg-white/5 rounded" />
             <div className="h-2 w-full bg-white/5 rounded" />
             <div className="h-2 w-3/4 bg-white/5 rounded" />
          </div>
        </div>
        
        <motion.div 
          initial={{ scale: 3, opacity: 0, rotate: -20 }}
          animate={{ scale: 1, opacity: 1, rotate: -10 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 15 }}
          className="absolute -right-6 -bottom-6 z-20"
        >
           <div className="w-32 h-32 bg-purple-500/20 backdrop-blur-md border border-purple-500/50 rounded-full flex flex-col items-center justify-center text-purple-400 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
             <ShieldCheck className="w-10 h-10 mb-1" />
             <span className="font-black tracking-widest uppercase text-xs">Verified</span>
           </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

