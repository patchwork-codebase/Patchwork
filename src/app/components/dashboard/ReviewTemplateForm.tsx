import React, { useState } from 'react';
import { CheckCircle, ShieldCheck, Star } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../auth/AuthContext';

interface ReviewTemplateFormProps {
  requestId: string;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export function ReviewTemplateForm({ requestId, onClose, onSubmitSuccess }: ReviewTemplateFormProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    understanding: '',
    whatWorks: '',
    risks: '',
    questions: '',
    alternativeApproaches: '',
    recommendation: '',
    confidence: 5,
    score: 5,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.from('expert_reviews').insert({
        request_id: requestId,
        understanding: form.understanding,
        what_works: form.whatWorks,
        risks: form.risks,
        alternative_approaches: form.alternativeApproaches,
        recommendation: form.recommendation,
        questions: form.questions,
        confidence: form.confidence,
        score: form.score
      });
      
      if (error) throw error;
      
      toast.success('Review submitted successfully!');
      onSubmitSuccess();
    } catch (error: unknown) {
      toast.error('Failed to submit review: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-[#1A1825] border border-white/[0.08] rounded-[24px] p-6 shadow-xl relative overflow-hidden">
      <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/[0.08]">
        <ShieldCheck className="w-8 h-8 text-emerald-400" />
        <div>
          <h2 className="text-xl font-bold text-white">Expert Review Template</h2>
          <p className="text-sm text-slate-400">Structured feedback yields the highest quality guidance.</p>
        </div>
      </div>

      <form id="expert-review-form" onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Understanding */}
        <div className="space-y-4">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-white/10 text-xs flex items-center justify-center">1</span> 
            Understanding
          </h3>
          <p className="text-xs text-slate-400">Reflect back what you understand about their build and challenge.</p>
          <textarea
            required name="understanding" value={form.understanding} onChange={handleChange} rows={3}
            placeholder="I understand that you are trying to build..."
            className="w-full px-5 py-4 bg-ink/50 border border-white/[0.08] rounded-xl text-[14px] text-white focus:outline-none focus:border-emerald-500/50 resize-none"
          />
        </div>

        {/* Section 2: What works */}
        <div className="space-y-4">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-white/10 text-xs flex items-center justify-center">2</span> 
            What Works
          </h3>
          <p className="text-xs text-slate-400">Identify the strengths of their current approach.</p>
          <textarea
            required name="whatWorks" value={form.whatWorks} onChange={handleChange} rows={3}
            placeholder="The strongest part of this approach is..."
            className="w-full px-5 py-4 bg-ink/50 border border-white/[0.08] rounded-xl text-[14px] text-white focus:outline-none focus:border-emerald-500/50 resize-none"
          />
        </div>

        {/* Section 3: Risks */}
        <div className="space-y-4">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-white/10 text-xs flex items-center justify-center">3</span> 
            Risks & Blind Spots
          </h3>
          <p className="text-xs text-slate-400">Highlight potential pitfalls or edge cases they might have missed.</p>
          <textarea
            required name="risks" value={form.risks} onChange={handleChange} rows={3}
            placeholder="A major risk here is..."
            className="w-full px-5 py-4 bg-ink/50 border border-white/[0.08] rounded-xl text-[14px] text-white focus:outline-none focus:border-emerald-500/50 resize-none"
          />
        </div>

        {/* Section 4: Alternative Approaches */}
        <div className="space-y-4">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-white/10 text-xs flex items-center justify-center">4</span> 
            Alternative Approaches
          </h3>
          <p className="text-xs text-slate-400">What are other ways to solve this challenge?</p>
          <textarea
            required name="alternativeApproaches" value={form.alternativeApproaches} onChange={handleChange} rows={3}
            placeholder="Alternatively, you could try..."
            className="w-full px-5 py-4 bg-ink/50 border border-white/[0.08] rounded-xl text-[14px] text-white focus:outline-none focus:border-emerald-500/50 resize-none"
          />
        </div>

        {/* Section 5: Recommendation */}
        <div className="space-y-4">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-white/10 text-xs flex items-center justify-center">5</span> 
            Recommendation
          </h3>
          <p className="text-xs text-slate-400">Your final, actionable recommendation.</p>
          <textarea
            required name="recommendation" value={form.recommendation} onChange={handleChange} rows={3}
            placeholder="I strongly recommend that you..."
            className="w-full px-5 py-4 bg-ink/50 border border-white/[0.08] rounded-xl text-[14px] text-white focus:outline-none focus:border-emerald-500/50 resize-none"
          />
        </div>

        {/* Section 6: Questions */}
        <div className="space-y-4">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-white/10 text-xs flex items-center justify-center">6</span> 
            Open Questions
          </h3>
          <p className="text-xs text-slate-400">Questions you have for the builder.</p>
          <textarea
            required name="questions" value={form.questions} onChange={handleChange} rows={2}
            placeholder="1. Have you considered... ?"
            className="w-full px-5 py-4 bg-ink/50 border border-white/[0.08] rounded-xl text-[14px] text-white focus:outline-none focus:border-emerald-500/50 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/[0.08]">
          <div className="space-y-3">
            <label className="text-sm font-bold text-white flex justify-between">
              Confidence Level 
              <span className="text-emerald-400">{form.confidence}/10</span>
            </label>
            <input 
              type="range" min="1" max="10" name="confidence" 
              value={form.confidence} onChange={handleChange} 
              className="w-full accent-emerald-500" 
            />
          </div>
          
          <div className="space-y-3">
            <label className="text-sm font-bold text-white flex justify-between">
              Overall Score 
              <span className="text-emerald-400">{form.score}/10</span>
            </label>
            <input 
              type="range" min="1" max="10" name="score" 
              value={form.score} onChange={handleChange} 
              className="w-full accent-emerald-500" 
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6">
          <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-6 py-3 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2 disabled:opacity-50 transition-all">
            <CheckCircle className="w-5 h-5" />
            {loading ? 'Submitting...' : 'Approve & Submit Review'}
          </button>
        </div>
      </form>
    </div>
  );
}
