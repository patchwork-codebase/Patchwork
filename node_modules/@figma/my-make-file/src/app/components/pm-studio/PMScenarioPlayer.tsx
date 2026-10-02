import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Clock, Send, BarChart2, MessageSquare, Code, LayoutDashboard } from 'lucide-react';

export default function PMScenarioPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('context');
  const [response, setResponse] = useState('');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0E0C15] flex flex-col">
      <header className="h-16 border-b border-slate-100 dark:border-white/10 flex items-center px-6 justify-between bg-white dark:bg-[#120F1C] shrink-0">
        <button onClick={() => navigate('/pm-studio/case-studies')} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white">
          <ArrowLeft className="w-4 h-4" /> Save & Exit
        </button>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold px-2 py-1 bg-white/5 rounded text-slate-500 dark:text-slate-400 uppercase tracking-wider">Product Discovery</span>
          <div className="flex items-center gap-2 text-blue-400 text-sm font-bold bg-blue-500/10 px-3 py-1.5 rounded-full">
            <Clock className="w-4 h-4" /> Phase 1: Investigation
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Tabs for data gathering */}
        <div className="w-1/2 border-r border-slate-100 dark:border-white/10 flex flex-col bg-white dark:bg-[#120F1C]">
          <div className="flex border-b border-slate-100 dark:border-white/10">
            <button 
              onClick={() => setActiveTab('context')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'context' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-white/5'}`}
            >
              <LayoutDashboard className="w-4 h-4" /> Context
            </button>
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'analytics' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-white/5'}`}
            >
              <BarChart2 className="w-4 h-4" /> Analytics
            </button>
            <button 
              onClick={() => setActiveTab('feedback')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'feedback' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-white/5'}`}
            >
              <MessageSquare className="w-4 h-4" /> User Feedback
            </button>
            <button 
              onClick={() => setActiveTab('eng')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'eng' ? 'border-blue-500 text-blue-400 bg-blue-500/5' : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-white/5'}`}
            >
              <Code className="w-4 h-4" /> Engineering
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8">
            {activeTab === 'context' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Spotify Retention Drop</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                  You have just joined Spotify as a Senior Product Manager on the Core Experience team. The VP of Product has pulled you into an emergency meeting.
                </p>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  "Over the last month, we've seen an 18% drop in Day-30 retention in the US market. This is unprecedented. We rolled out the new Podcast-first UI, a new recommendation algorithm, and a change to the free-tier ad frequency all around the same time."
                </p>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mt-6">
                  <h3 className="text-yellow-400 font-bold mb-2">Your Task</h3>
                  <p className="text-yellow-400/80 text-sm">Investigate the provided analytics, user feedback, and engineering constraints. Decide what your immediate next step is to diagnose the root cause.</p>
                </div>
              </div>
            )}
            
            {activeTab === 'analytics' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Mixpanel Dashboard (Simulated)</h2>
                <div className="bg-white dark:bg-[#1C1A24] border border-slate-100 dark:border-white/10 rounded-xl p-6 mb-6">
                  <div className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">US Market D30 Retention</div>
                  <div className="h-32 flex items-end gap-2 border-b border-l border-slate-300 dark:border-white/20 p-2">
                    <div className="w-1/4 bg-blue-500/40 rounded-t h-[90%]"></div>
                    <div className="w-1/4 bg-blue-500/40 rounded-t h-[88%]"></div>
                    <div className="w-1/4 bg-blue-500/40 rounded-t h-[85%]"></div>
                    <div className="w-1/4 bg-red-500/60 rounded-t h-[70%]"></div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4 (Drop)</span>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'feedback' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">App Store Reviews</h2>
                <div className="bg-white dark:bg-[#1C1A24] border border-slate-100 dark:border-white/10 rounded-xl p-4">
                  <div className="text-yellow-400 text-xs mb-2">★☆☆☆☆</div>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">"I just want to listen to music. Why is my homepage full of Joe Rogan podcasts? I can't even find my playlists anymore."</p>
                </div>
                <div className="bg-white dark:bg-[#1C1A24] border border-slate-100 dark:border-white/10 rounded-xl p-4">
                  <div className="text-yellow-400 text-xs mb-2">★★☆☆☆</div>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">"The app keeps crashing when an ad tries to play. Very annoying."</p>
                </div>
              </div>
            )}

            {activeTab === 'eng' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Engineering Slack Channel</h2>
                <div className="bg-white dark:bg-[#1C1A24] border border-slate-100 dark:border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">Sarah</div>
                    <span className="text-xs text-slate-500">Lead Eng • 2 hours ago</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">"Just a heads up, rolling back the Podcast UI isn't a simple feature flag toggle. It requires a hard app update because of the caching layer changes we made. If we want to test a revert, it will take 2 weeks of eng effort."</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Action Input */}
        <div className="w-1/2 flex flex-col bg-slate-50 dark:bg-[#0E0C15]">
          <div className="flex-1 overflow-y-auto p-8 flex flex-col">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Phase 1 Submission</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Based on the context provided, what is your immediate next step? Describe your hypothesis and the action you will take.</p>
            
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="E.g., I hypothesize the drop is due to..."
              className="flex-1 bg-white dark:bg-[#1C1A24] border border-slate-100 dark:border-white/10 rounded-xl p-4 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 resize-none mb-6"
            />
            
            <button 
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-xl font-bold transition-colors w-full"
            >
              Submit to AI Coach <Send className="w-4 h-4" />
            </button>
            <p className="text-center text-xs text-slate-500 mt-4">The AI will evaluate your approach and advance you to Phase 2 based on your decision.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
