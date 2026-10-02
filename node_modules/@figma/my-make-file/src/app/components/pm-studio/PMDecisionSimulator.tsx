import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Clock, Send, Zap, ChevronRight, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function PMDecisionSimulator() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);

  // Mock fetching the scenario
  const scenario = {
    title: 'The Growth Dilemma',
    category: 'Prioritization',
    context: 'Revenue has declined 12% this quarter. \n\n- Marketing insists on running a massive discount campaign immediately to hit targets.\n- Engineering states the billing infrastructure must be rebuilt this quarter or it will fail under holiday load.\n- Sales promises a massive enterprise deal if you build two custom features this month.\n- Customer Support says a lingering bug is causing a spike in churn.\n\nWhat do you prioritize and why? Walk through your resource allocation.',
  };

  const handleSubmit = async () => {
    if (!response.trim()) return;
    setIsSubmitting(true);
    
    try {
      const { supabase } = await import('../auth/AuthContext');
      
      const { data, error } = await supabase.functions.invoke('evaluate-decision', {
        body: { 
          scenarioId: id || '1', 
          responseText: response 
        }
      });

      if (error) {
        console.error("Edge function error:", error);
        throw error;
      }

      setFeedback(data);
    } catch (err) {
      console.error("Failed to evaluate decision:", err);
      // Fallback in case the edge function isn't running locally yet
      setFeedback({
        overallScore: 80,
        strengths: ['Great reasoning on the fallback.'],
        weaknesses: ['Edge function connection failed locally.'],
        skillScores: { prioritization: 80, strategy: 80, customerFocus: 80, communication: 80 }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0E0C15] flex flex-col">
      <header className="h-16 border-b border-slate-100 dark:border-white/10 flex items-center px-6 justify-between bg-white dark:bg-[#120F1C] shrink-0">
        <button onClick={() => navigate('/pm-studio/decisions')} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white">
          <ArrowLeft className="w-4 h-4" /> Exit Simulator
        </button>
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold px-2 py-1 bg-white/5 rounded text-slate-500 dark:text-slate-400 uppercase tracking-wider">{scenario.category}</span>
          <div className="flex items-center gap-2 text-red-400 text-sm font-bold bg-red-500/10 px-3 py-1.5 rounded-full">
            <Clock className="w-4 h-4" /> 05:00
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel: Context & Input */}
        <div className={`flex-1 flex flex-col transition-all duration-500 ${feedback ? 'w-1/2 max-w-[50%]' : 'w-full max-w-4xl mx-auto'}`}>
          <div className="flex-1 overflow-y-auto p-8">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-6">{scenario.title}</h1>
            <div className="prose prose-invert max-w-none text-slate-600 dark:text-slate-300 mb-8 whitespace-pre-wrap leading-relaxed">
              {scenario.context}
            </div>

            {!feedback ? (
              <div className="mt-8">
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">Your Response</h3>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Explain your prioritization logic..."
                  className="w-full h-64 bg-white dark:bg-[#1C1A24] border border-slate-100 dark:border-white/10 rounded-xl p-4 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/50 resize-none"
                  disabled={isSubmitting}
                />
                <div className="mt-4 flex justify-end">
                  <button 
                    onClick={handleSubmit}
                    disabled={isSubmitting || !response.trim()}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Evaluating...</>
                    ) : (
                      <>Submit for Evaluation <Send className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-8 opacity-50 pointer-events-none">
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">Your Response</h3>
                <div className="w-full bg-white dark:bg-[#1C1A24] border border-slate-100 dark:border-white/10 rounded-xl p-4 text-slate-900 dark:text-white whitespace-pre-wrap">
                  {response}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: AI Evaluation (Slides in) */}
        <AnimatePresence>
          {feedback && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              className="w-1/2 border-l border-slate-100 dark:border-white/10 bg-white dark:bg-[#120F1C] flex flex-col overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI Evaluation Complete</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Scores have been added to your profile.</p>
                  </div>
                </div>

                {/* Score */}
                <div className="bg-white dark:bg-[#1C1A24] border border-slate-100 dark:border-white/10 rounded-2xl p-6 mb-8 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-slate-500 dark:text-slate-400 font-bold mb-1">Overall Quality</div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">{feedback.overallScore}/100</div>
                  </div>
                  <Activity className="w-12 h-12 text-emerald-500 opacity-20" />
                </div>

                {/* Feedback */}
                <div className="space-y-6 mb-8">
                  <div>
                    <h3 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Strengths
                    </h3>
                    <ul className="space-y-2">
                      {feedback.strengths.map((s: string, i: number) => (
                        <li key={i} className="text-slate-300 text-sm bg-emerald-500/5 px-3 py-2 rounded-lg border border-emerald-500/10">{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-red-400 font-bold mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div> Areas to Improve
                    </h3>
                    <ul className="space-y-2">
                      {feedback.weaknesses.map((w: string, i: number) => (
                        <li key={i} className="text-slate-300 text-sm bg-red-500/5 px-3 py-2 rounded-lg border border-red-500/10">{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Skill Impacts */}
                <h3 className="text-slate-900 dark:text-white font-bold mb-4">Profile Impact</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-[#1C1A24] p-4 rounded-xl border border-slate-100 dark:border-white/5">
                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Prioritization</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white">{feedback.skillScores.prioritization}/100</div>
                  </div>
                  <div className="bg-white dark:bg-[#1C1A24] p-4 rounded-xl border border-slate-100 dark:border-white/5">
                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Strategy</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white">{feedback.skillScores.strategy}/100</div>
                  </div>
                </div>

                <button onClick={() => navigate('/pm-studio/decisions')} className="w-full mt-8 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-slate-900 dark:text-white px-6 py-4 rounded-xl font-bold transition-colors">
                  Return to Dashboard <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
