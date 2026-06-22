import React, { useState } from 'react';
import { ShieldCheck, MessageCircle, CheckCircle, BookOpen, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface ExpertReview {
  id: string;
  expert: {
    name: string;
    avatar: string;
    title: string;
  };
  understanding: string;
  whatWorks: string;
  risks: string;
  questions: string;
  alternativeApproaches: string;
  recommendation: string;
  confidence: number;
  score: number;
  isResolved: boolean;
  convertedToArtifact: boolean;
}

interface ReviewReportProps {
  review: ExpertReview;
}

export function ReviewReport({ review }: ReviewReportProps) {
  const [isResolved, setIsResolved] = useState(review.isResolved);
  const [isConverted, setIsConverted] = useState(review.convertedToArtifact);
  const [replyText, setReplyText] = useState('');
  const [expanded, setExpanded] = useState(false);

  const handleResolve = () => {
    setIsResolved(true);
    toast.success('Review marked as resolved!');
  };

  const handleConvert = () => {
    setIsConverted(true);
    toast.success('Review converted to Build Log artifact!');
  };

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    toast.success('Reply sent to expert');
    setReplyText('');
  };

  return (
    <div className={`bg-gradient-to-b from-[#1C1A24] to-[#121018] border ${isResolved ? 'border-white/10' : 'border-emerald-500/30'} rounded-[24px] shadow-xl overflow-hidden`}>
      {/* Header */}
      <div className="p-6 border-b border-white/[0.08] flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img src={review.expert.avatar} alt={review.expert.name} className="w-12 h-12 rounded-full border border-white/10" />
            <div className="absolute -bottom-1 -right-1 bg-ink-80 rounded-full p-0.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-white font-bold text-lg">{review.expert.name}</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Verified Expert Review
              </span>
            </div>
            <p className="text-slate-400 text-sm">{review.expert.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm font-bold">
          <div className="flex flex-col items-center">
            <span className="text-slate-400 text-xs">Score</span>
            <span className="text-emerald-400 flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-current" /> {review.score}/10</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-slate-400 text-xs">Confidence</span>
            <span className="text-white">{review.confidence}/10</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        
        {/* Highlight Reel (Recommendation) */}
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5">
          <h4 className="text-emerald-400 font-bold text-sm mb-2 uppercase tracking-wider">Expert Recommendation</h4>
          <p className="text-white font-medium text-[15px] leading-relaxed">
            {review.recommendation}
          </p>
        </div>

        {!expanded && (
          <button 
            onClick={() => setExpanded(true)}
            className="w-full py-3 flex items-center justify-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold"
          >
            Read Full Review <ChevronDown className="w-4 h-4" />
          </button>
        )}

        {expanded && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="text-white font-bold flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white/10 text-[10px] flex items-center justify-center">1</span> Understanding
                </h4>
                <p className="text-slate-300 text-[14px] leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5">{review.understanding}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-white font-bold flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white/10 text-[10px] flex items-center justify-center">2</span> What Works
                </h4>
                <p className="text-slate-300 text-[14px] leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5">{review.whatWorks}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-white font-bold flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white/10 text-[10px] flex items-center justify-center">3</span> Risks
                </h4>
                <p className="text-slate-300 text-[14px] leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5">{review.risks}</p>
              </div>
              <div className="space-y-2">
                <h4 className="text-white font-bold flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-white/10 text-[10px] flex items-center justify-center">4</span> Alternative Approaches
                </h4>
                <p className="text-slate-300 text-[14px] leading-relaxed bg-black/20 p-4 rounded-xl border border-white/5">{review.alternativeApproaches}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-white font-bold flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/10 text-[10px] flex items-center justify-center">5</span> Open Questions
              </h4>
              <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                <p className="text-slate-300 text-[14px] leading-relaxed whitespace-pre-wrap">{review.questions}</p>
              </div>
            </div>

            <button 
              onClick={() => setExpanded(false)}
              className="w-full py-3 flex items-center justify-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold"
            >
              Show Less <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-white/[0.08] bg-black/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
        
        {/* Reply Box */}
        <form onSubmit={handleReply} className="w-full sm:flex-1 flex items-center gap-2">
          <input 
            type="text" 
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Reply to the expert..." 
            className="flex-1 bg-[#1A1825] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
          />
          <button type="submit" className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors">
            <MessageCircle className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          {!isResolved && (
            <button 
              onClick={handleResolve}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-bold transition-all"
            >
              <CheckCircle className="w-4 h-4" /> Mark Resolved
            </button>
          )}
          
          {!isConverted ? (
            <button 
              onClick={handleConvert}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold transition-all shadow-lg"
            >
              <BookOpen className="w-4 h-4" /> Publish as Artifact
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 text-emerald-400 text-sm font-bold">
              <CheckCircle className="w-4 h-4" /> Published
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
