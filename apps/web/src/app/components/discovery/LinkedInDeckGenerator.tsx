import React, { useState, useRef } from 'react';
import { Download, ChevronLeft, ChevronRight, Share2, Loader2 } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '../ui/dialog';
import { 
  useDiscoveryAssumptions, 
  useDiscoveryHypotheses, 
  useDiscoveryInterviews 
} from '../../hooks/useDiscovery';
import type { DiscoveryProject } from '../../types/discovery';

interface LinkedInDeckGeneratorProps {
  project: DiscoveryProject;
}

export default function LinkedInDeckGenerator({ project }: LinkedInDeckGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Fetch all research data
  const { data: assumptions = [], isLoading: loadingAssumptions } = useDiscoveryAssumptions(project.id);
  const { data: hypotheses = [], isLoading: loadingHypotheses } = useDiscoveryHypotheses(project.id);
  const { data: interviews = [], isLoading: loadingInterviews } = useDiscoveryInterviews(project.id);

  const totalSlides = 5;

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  // Helper function to wrap text on canvas
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  };

  // Main Canvas drawing engine
  const drawSlideToCanvas = (canvas: HTMLCanvasElement, slideIndex: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Slide Dimensions: 1920x1080 (Full HD 16:9)
    canvas.width = 1920;
    canvas.height = 1080;

    // 1. Dark Slate Gradient Background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0f172a'); // slate-900
    gradient.addColorStop(0.5, '#1e1b4b'); // indigo-950
    gradient.addColorStop(1, '#0b0f19');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative background grids
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 80) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let j = 0; j < canvas.height; j += 80) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(canvas.width, j);
      ctx.stroke();
    }

    const paddingLeft = 140;
    const paddingTop = 180;

    // 2. Branding & Slide Indicators
    ctx.fillStyle = '#a78bfa'; // violet-400
    ctx.font = 'bold 24px monospace';
    ctx.fillText('PATCHWORK // PROOF-OF-BUILD', paddingLeft, 100);

    ctx.fillStyle = '#64748b'; // slate-500
    ctx.font = '22px monospace';
    ctx.fillText(`SLIDE 0${slideIndex + 1} / 0${totalSlides}`, canvas.width - 280, 100);

    // 3. Render slide logic
    if (slideIndex === 0) {
      // SLIDE 1: Cover
      ctx.fillStyle = '#8b5cf6';
      ctx.fillRect(paddingLeft, paddingTop, 120, 8);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'extrabold 72px sans-serif';
      wrapText(ctx, project.title.toUpperCase(), paddingLeft, paddingTop + 100, canvas.width - 600, 90);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 28px monospace';
      ctx.fillText('PRODUCT DISCOVERY JOURNAL', paddingLeft, paddingTop + 380);

      // Confidence ring gauge on the right
      const circleX = canvas.width - 350;
      const circleY = canvas.height - 400;
      
      // Gray track
      ctx.beginPath();
      ctx.arc(circleX, circleY, 120, 0, 2 * Math.PI);
      ctx.lineWidth = 18;
      ctx.strokeStyle = '#334155';
      ctx.stroke();

      // Colored score arc
      ctx.beginPath();
      ctx.arc(circleX, circleY, 120, -0.5 * Math.PI, (2 * Math.PI * (project.confidence_score / 100)) - 0.5 * Math.PI);
      ctx.lineWidth = 18;
      ctx.strokeStyle = project.confidence_score >= 70 ? '#10b981' : project.confidence_score >= 40 ? '#f59e0b' : '#ef4444';
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 54px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${project.confidence_score}%`, circleX, circleY + 18);
      ctx.textAlign = 'left';

      ctx.fillStyle = '#64748b';
      ctx.font = '16px monospace';
      ctx.fillText('CONFIDENCE SCORE', circleX - 70, circleY + 180);

      // Footer metadata
      ctx.fillStyle = '#64748b';
      ctx.font = '20px monospace';
      ctx.fillText(`BUILDER_ID: #${project.builder_id.substring(0, 12)}`, paddingLeft, canvas.height - 140);
      ctx.fillText(`STARTED: ${new Date(project.created_at).toLocaleDateString()}`, paddingLeft, canvas.height - 100);

    } else if (slideIndex === 1) {
      // SLIDE 2: Problem Statement
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 56px sans-serif';
      ctx.fillText('PROBLEM STATEMENT', paddingLeft, paddingTop + 20);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '22px monospace';
      ctx.fillText('THE LEAP-OF-FAITH HYPOTHESIS', paddingLeft, paddingTop + 80);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 32px sans-serif';
      wrapText(ctx, project.problem_statement || 'No problem statement recorded yet.', paddingLeft, paddingTop + 160, canvas.width - 320, 52);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '22px monospace';
      ctx.fillText('TARGET CUSTOMER SEGMENT', paddingLeft, paddingTop + 440);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 30px sans-serif';
      wrapText(ctx, project.audience || 'General builders and early creators.', paddingLeft, paddingTop + 500, canvas.width - 320, 48);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '22px monospace';
      ctx.fillText('PAIN LEVEL SEVERITY', paddingLeft, paddingTop + 660);

      const severity = project.pain_level || 'Medium';
      ctx.fillStyle = severity === 'High' ? '#ef4444' : severity === 'Medium' ? '#f59e0b' : '#3b82f6';
      ctx.font = 'bold 36px monospace';
      ctx.fillText(severity.toUpperCase(), paddingLeft, paddingTop + 720);

    } else if (slideIndex === 2) {
      // SLIDE 3: Assumptions & Hypotheses
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 56px sans-serif';
      ctx.fillText('CORE RISKS & ASSUMPTIONS', paddingLeft, paddingTop + 20);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '22px monospace';
      ctx.fillText('VALIDATION ROADMAP INDICATORS', paddingLeft, paddingTop + 80);

      let startY = paddingTop + 180;
      const displayAssumptions = assumptions.slice(0, 4);

      if (displayAssumptions.length === 0) {
        ctx.fillStyle = '#64748b';
        ctx.font = 'italic 28px sans-serif';
        ctx.fillText('No assumptions logged on the board yet.', paddingLeft, startY);
      } else {
        displayAssumptions.forEach((item, index) => {
          // Draw Status Badge background
          const badgeColor = item.status === 'validated' ? '#10b981' : item.status === 'invalidated' ? '#ef4444' : '#475569';
          ctx.fillStyle = badgeColor;
          ctx.fillRect(paddingLeft, startY - 32, 160, 44);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px monospace';
          ctx.fillText(item.status.toUpperCase(), paddingLeft + 20, startY - 4);

          // Draw Assumption statement text
          ctx.fillStyle = '#cbd5e1';
          ctx.font = 'bold 24px sans-serif';
          wrapText(ctx, item.assumption, paddingLeft + 200, startY - 2, canvas.width - 560, 36);

          startY += 130;
        });
      }

    } else if (slideIndex === 3) {
      // SLIDE 4: Customer Research Insights
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 56px sans-serif';
      ctx.fillText('CUSTOMER INTERVIEWS', paddingLeft, paddingTop + 20);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '22px monospace';
      ctx.fillText('DIRECT QUALITATIVE FEEDBACK', paddingLeft, paddingTop + 80);

      let startY = paddingTop + 180;
      const displayInterviews = interviews.slice(0, 3);

      if (displayInterviews.length === 0) {
        ctx.fillStyle = '#64748b';
        ctx.font = 'italic 28px sans-serif';
        ctx.fillText('No customer conversations logged in Discovery Mode.', paddingLeft, startY);
      } else {
        displayInterviews.forEach((item) => {
          // Card panel backplate
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(paddingLeft, startY - 30, canvas.width - 280, 130);

          ctx.fillStyle = '#a78bfa';
          ctx.font = 'bold 24px sans-serif';
          ctx.fillText(item.interviewee_name || 'Anonymous User', paddingLeft + 30, startY + 15);

          ctx.fillStyle = '#64748b';
          ctx.font = '18px monospace';
          ctx.fillText(`${item.interviewee_role || 'User'} at ${item.interviewee_company || 'Undisclosed'}`, paddingLeft + 30, startY + 45);

          ctx.fillStyle = '#f1f5f9';
          ctx.font = 'italic 20px sans-serif';
          wrapText(ctx, `"${item.summary || 'No overview summary logged.'}"`, paddingLeft + 30, startY + 82, canvas.width - 340, 30);

          startY += 175;
        });
      }

    } else if (slideIndex === 4) {
      // SLIDE 5: Outcome & Verdict
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 56px sans-serif';
      ctx.fillText('DISCOVERY VERDICT', paddingLeft, paddingTop + 20);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '22px monospace';
      ctx.fillText('VALIDATION OUTCOME & DECISION RATIONALE', paddingLeft, paddingTop + 80);

      ctx.fillStyle = '#8b5cf6';
      ctx.font = 'extrabold 48px monospace';
      const statusLabel = 
        project.status === 'converted' ? 'CONVERTED TO ACTIVE ROOM' :
        project.status === 'killed' ? 'DISCOVERY CLOSED - SHELVED' :
        'ONGOING RESEARCH STAGE';
      ctx.fillText(statusLabel, paddingLeft, paddingTop + 180);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '26px sans-serif';
      const rationalDesc = 
        project.status === 'converted' ? 'This concept successfully passed core hypothesis metrics and has transitioned to active code development.' :
        project.status === 'killed' ? 'Customer inputs invalidated primary metrics, leading to a structural project stop prior to code compilation.' :
        'Continuing validation loops, logging customer feedback, and scoring market signals before room transition.';
      wrapText(ctx, rationalDesc, paddingLeft, paddingTop + 260, canvas.width - 320, 44);

      // Call to action banner
      ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.fillRect(paddingLeft, canvas.height - 240, canvas.width - 280, 110);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 28px monospace';
      ctx.fillText('Follow my build journey live on Patchwork', paddingLeft + 30, canvas.height - 185);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '20px monospace';
      ctx.fillText('Scan QR or visit patchwork.build for details', paddingLeft + 30, canvas.height - 145);
    }
  };

  // Export slides as PNG sequence
  const handleExportDeck = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsExporting(true);

    try {
      for (let i = 0; i < totalSlides; i++) {
        // Draw the slide on canvas
        drawSlideToCanvas(canvas, i);

        // Convert canvas state to link download
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        
        // Format filenames chronologically
        const slideName = 
          i === 0 ? 'slide01_cover' :
          i === 1 ? 'slide02_problem' :
          i === 2 ? 'slide03_assumptions' :
          i === 3 ? 'slide04_interviews' :
          'slide05_verdict';

        link.download = `${project.title.toLowerCase().replace(/\s+/g, '_')}_${slideName}.png`;
        link.href = dataUrl;
        
        // Trigger chronological download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Brief sleep to avoid download congestion in the browser thread
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
      showExportNotification();
    } catch (err) {
      console.error('Error generating LinkedIn deck:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const showExportNotification = () => {
    // Simple custom notification alert matching sonner or fallback
    alert('Slide Deck export complete! You have downloaded 5 high-resolution PNG slides ready for LinkedIn.');
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer select-none"
      >
        <Share2 className="w-3.5 h-3.5" />
        LinkedIn Carousel
      </button>

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl bg-slate-950 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white p-6 rounded-2xl flex flex-col h-[85vh] sm:h-[80vh] outline-none">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              LinkedIn Carousel Generator
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 select-none">
                Export Ready
              </span>
            </DialogTitle>
            <p className="text-xs text-slate-500 dark:text-slate-400">Preview and export your discovery journey as visual slide assets optimized for LinkedIn swipe posts.</p>
          </DialogHeader>

          {/* Interactive Slideshow Preview */}
          <div className="flex-1 flex flex-col justify-center items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 overflow-hidden relative group shadow-sm dark:shadow-none">
            
            {/* Live mockup of slide layout */}
            <div className="w-full max-w-[640px] aspect-[16/9] bg-gradient-to-br from-slate-950 via-slate-900 to-[#12102e] border border-slate-100 dark:border-slate-800/80 rounded-lg p-8 relative flex flex-col justify-between shadow-2xl">
              
              {/* Header mockup */}
              <div className="flex justify-between items-center text-[8px] font-mono tracking-widest text-violet-400 uppercase select-none">
                <span>PATCHWORK // PROOF-OF-BUILD</span>
                <span className="text-slate-500">SLIDE 0{currentSlide + 1} / 0{totalSlides}</span>
              </div>

              {/* Cover Slide Mockup */}
              {currentSlide === 0 && (
                <div className="my-auto space-y-4">
                  <div className="w-12 h-1 bg-violet-600 rounded" />
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight max-w-[80%]">{project.title}</h2>
                  <p className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">PRODUCT DISCOVERY JOURNAL</p>
                  
                  {/* Miniature gauge */}
                  <div className="absolute right-8 bottom-12 flex flex-col items-center gap-1.5">
                    <div className="w-14 h-14 rounded-full border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center relative">
                      <span className="text-[10px] font-mono font-bold text-slate-900 dark:text-white">{project.confidence_score}%</span>
                      {/* Score Arc mock */}
                      <svg className="absolute -inset-1 transform -rotate-90 w-16 h-16 pointer-events-none">
                        <circle 
                          cx="32" 
                          cy="32" 
                          r="28" 
                          className="stroke-emerald-500 fill-none" 
                          strokeWidth="4" 
                          strokeDasharray="175" 
                          strokeDashoffset={175 - (175 * project.confidence_score) / 100}
                        />
                      </svg>
                    </div>
                    <span className="text-[6px] font-mono text-slate-500">CONFIDENCE</span>
                  </div>
                </div>
              )}

              {/* Problem Slide Mockup */}
              {currentSlide === 1 && (
                <div className="my-auto space-y-4">
                  <span className="text-[7px] font-mono text-slate-500 dark:text-slate-400 tracking-wider">PROBLEM STATEMENT</span>
                  <p className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed max-w-[90%]">
                    {project.problem_statement || 'No problem statement recorded yet.'}
                  </p>
                  <span className="text-[7px] font-mono text-slate-500 dark:text-slate-400 tracking-wider block pt-2">TARGET AUDIENCE</span>
                  <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">{project.audience || 'General builders.'}</p>
                </div>
              )}

              {/* Assumptions Slide Mockup */}
              {currentSlide === 2 && (
                <div className="my-auto space-y-3.5">
                  <span className="text-[7px] font-mono text-slate-500 dark:text-slate-400 tracking-wider block mb-1">CORE ASSUMPTIONS BOARD</span>
                  {loadingAssumptions ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  ) : assumptions.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No assumptions logged yet.</p>
                  ) : (
                    assumptions.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex gap-3 items-center">
                        <span className={`text-[7px] font-mono px-2 py-0.5 rounded text-white ${
                          item.status === 'validated' ? 'bg-emerald-500' : item.status === 'invalidated' ? 'bg-rose-500' : 'bg-slate-700'
                        }`}>
                          {item.status.toUpperCase()}
                        </span>
                        <p className="text-[9px] text-slate-600 dark:text-slate-300 font-medium line-clamp-1">{item.assumption}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Interviews Slide Mockup */}
              {currentSlide === 3 && (
                <div className="my-auto space-y-3">
                  <span className="text-[7px] font-mono text-slate-500 dark:text-slate-400 tracking-wider block mb-1">CUSTOMER FEEDBACK SUMMARY</span>
                  {loadingInterviews ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  ) : interviews.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No interviews logged yet.</p>
                  ) : (
                    interviews.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-900/90 p-2 border border-slate-100 dark:border-slate-800 rounded shadow-sm dark:shadow-none">
                        <div className="text-[8px] font-bold text-violet-400">{item.interviewee_name}</div>
                        <div className="text-[6px] font-mono text-slate-500">{item.interviewee_role} at {item.interviewee_company}</div>
                        <p className="text-[8px] text-slate-600 dark:text-slate-300 italic mt-1 line-clamp-1">"{item.summary}"</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Verdict Slide Mockup */}
              {currentSlide === 4 && (
                <div className="my-auto space-y-4">
                  <span className="text-[7px] font-mono text-slate-500 dark:text-slate-400 tracking-wider block">DISCOVERY VERDICT</span>
                  <div className="text-sm font-mono font-bold text-violet-400 uppercase tracking-wide">
                    {project.status === 'converted' ? 'CONVERTED TO ACTIVE BUILD' :
                     project.status === 'killed' ? 'IDEA SHELVED / ARCHIVED' :
                     'ACTIVE DISCOVERY PHASE'}
                  </div>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-[85%]">
                    {project.status === 'converted' ? 'This concept passed validation metrics and has transitioned to active code development.' :
                     project.status === 'killed' ? 'Customer inputs invalidated assumptions, saving engineering cycles.' :
                     'Continuing research loops and calculating confidence before launching build room.'}
                  </p>
                </div>
              )}

              {/* Footer mockup */}
              <div className="flex justify-between items-center text-[7px] font-mono text-slate-500 uppercase select-none">
                <span>BUILDER_ID: #{project.builder_id.substring(0, 8)}</span>
                <span>outcome verification</span>
              </div>
            </div>

            {/* Navigation buttons */}
            <button 
              onClick={handlePrev} 
              className="absolute left-4 p-2 bg-slate-950/80 border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:bg-slate-800 rounded-full transition-colors cursor-pointer select-none"
            >
              <ChevronLeft className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </button>
            <button 
              onClick={handleNext} 
              className="absolute right-4 p-2 bg-slate-950/80 border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:bg-slate-800 rounded-full transition-colors cursor-pointer select-none"
            >
              <ChevronRight className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </button>
          </div>

          {/* Dialog Action Footer */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3 select-none">
            <button 
              onClick={handleExportDeck}
              disabled={isExporting}
              className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer border-none disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Slides...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export Slide Pack (5 PNGs)
                </>
              )}
            </button>
            <button 
              onClick={() => setIsOpen(false)}
              className="px-6 py-3 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-xl text-sm transition-colors cursor-pointer border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
