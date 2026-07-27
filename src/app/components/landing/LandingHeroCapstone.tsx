import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, MessageSquare, CheckCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { UserAvatar } from '../ui/UserAvatar';

interface Props {
  onSignup: () => void;
}

export function LandingHeroCapstone({ onSignup }: Props) {
  const { user, profile } = useAuth();
  
  // Attempt to grab the real name from profile or auth metadata, fallback to placeholder
  const metadata = user?.user_metadata || {};
  const builderName = profile?.name || metadata.full_name || metadata.name || user?.email?.split('@')[0] || 'Akin Rodolu';
  const avatarUrl = profile?.avatar || profile?.avatarUrl || profile?.avatar_url || metadata.avatar_url || metadata.avatar;
  
  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-white">
      {/* Background soft glow mimicking Capstone's clean style */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-50/50 blur-[120px] pointer-events-none" />
      
      <div className="mx-auto max-w-7xl px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Left: Copy */}
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">
              We'll give you real <br />
              <span className="text-primary-500 relative inline-block">
                proof of work
                {/* Accent line under text */}
                <span className="absolute bottom-1 left-0 w-full h-[6px] bg-primary-100 -z-10 rounded-full" />
              </span>
            </h1>
            
            <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed font-medium max-w-lg">
              Stop relying on static resumes and hidden GitHub repos. Build in public, log your real-time decisions, and get verifiable proof of your product skills.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
              <button 
                onClick={onSignup}
                className="w-full sm:w-auto px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-lg transition-all shadow-[0_8px_20px_rgba(255,91,34,0.3)] hover:shadow-[0_8px_25px_rgba(255,91,34,0.4)] hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                Start Building Now <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Right: Mockup Interface */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            {/* Soft backdrop shadow */}
            <div className="absolute inset-0 bg-primary-500/10 blur-3xl rounded-[40px]" />
            
            <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[500px]">
              {/* Fake Browser/App Header */}
              <div className="h-12 border-b border-white/10 bg-[#111111] flex items-center px-4 gap-3 shrink-0">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                  <div className="w-3 h-3 rounded-full bg-white/20" />
                </div>
                <div className="flex-1 text-center text-xs font-bold text-slate-500 font-mono">patchwork / moniflow-dashboard</div>
              </div>
              
              {/* App Content */}
              <div className="flex-1 p-5 overflow-y-auto bg-[#0a0a0a] space-y-6 relative">
                
                {/* Mock Message 1 (Looks like FeedUpdateCard) */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-[#111111] border border-white/5 shadow-xl rounded-[24px] p-5 sm:p-6 relative overflow-hidden"
                >
                  <div className="flex items-start gap-3 sm:gap-4 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#1a1a1a] ring-1 ring-white/10 flex items-center justify-center font-bold text-white shrink-0 overflow-hidden">
                      <UserAvatar 
                        userId={user?.id || ''} 
                        name={builderName}
                        avatarUrl={avatarUrl}
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap mb-1">
                        <span className="font-bold text-[15px] sm:text-[16px] text-white">
                          {builderName}
                        </span>
                        <span className="text-slate-600 text-[14px]">·</span>
                        <span className="text-[13px] sm:text-[14px] text-slate-400 font-medium truncate">
                          MoniFlow Dashboard
                        </span>
                      </div>
                      
                      <div className="mt-1">
                        <p className="text-[15px] sm:text-[16px] text-slate-300 leading-relaxed font-medium">
                          I've completely scrapped the v1 onboarding flow. The drop-off rate was way too high on the KYC step. 
                          I'm moving the KYC verification to happen *after* they create their first product listing.
                        </p>
                      </div>
                      
                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div className="flex items-center gap-4 text-slate-400 text-xs font-bold">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[14px]">🔥</span> 5
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[14px]">👀</span> 2
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[14px]">💬</span> 1
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 shrink-0 ml-auto">
                          <span className="text-[11px] font-bold border bg-primary-500/10 text-primary-400 border-primary-500/20 px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1.5">
                            <span>⚡</span> Decision
                          </span>
                          <span className="text-[12px] sm:text-[13px] text-slate-400 font-medium">9:14 AM</span>
                        </div>
                      </div>
                      
                      {/* Threaded Reply */}
                      <div className="mt-3 relative pl-2 pt-3 border-t border-white/5">
                        <div className="absolute left-6 top-0 bottom-6 w-[2px] bg-white/5 -z-10" />
                        <div className="flex gap-3 relative z-10">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-emerald-500/20">
                            S
                          </div>
                          <div>
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="font-bold text-white text-[13px]">Sarah (Observer)</span>
                              <span className="text-[11px] text-slate-500">9:28 AM</span>
                            </div>
                            <p className="text-[13px] text-slate-400 leading-relaxed">
                              Great call moving KYC later. That matches what we saw at Stripe. Have you considered adding a "soft limit" on listings until KYC is passed?
                            </p>
                          </div>
                        </div>
                      </div>
                      
                    </div>
                  </div>
                </motion.div>
                
                {/* Floating Notification Popup */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ delay: 1.5, type: 'spring' }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#1C1A24] border border-white/10 shadow-2xl rounded-xl p-4 w-64 z-10"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center shrink-0 text-primary-400 border border-primary-500/30">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[12px] font-bold text-white leading-tight">Insight Validated</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Your decision on KYC flow earned +5 reputation.</p>
                    </div>
                  </div>
                </motion.div>

              </div>
              
              {/* Fake Input Area */}
              <div className="p-4 bg-[#0a0a0a] border-t border-white/10 shrink-0">
                <div className="h-10 bg-[#1a1a1a] rounded-xl flex items-center px-4 justify-between border border-white/5">
                  <span className="text-sm text-slate-500">Log a new decision...</span>
                  <div className="w-6 h-6 rounded-md bg-primary-500 text-white flex items-center justify-center">
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
}
