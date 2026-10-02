import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Pause, 
  Play, 
  Rocket, 
  Flag, 
  GitCommit, 
  Download, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { timeAgo } from '../../utils/helpers';

export interface JourneyItem {
  id: string;
  update_type?: string;
  content: string;
  created_at: string;
  media_urls?: string[];
  media?: string[];
}

interface JourneyTimelapseModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomTitle: string;
  items: JourneyItem[];
}

const SLIDE_DURATION_MS = 6000;

export function JourneyTimelapseModal({
  isOpen,
  onClose,
  roomTitle,
  items,
}: JourneyTimelapseModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressAnimRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setProgress(0);
      setIsPaused(false);
    }
  }, [isOpen]);

  // Keyboard navigation & Esc to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, items.length]);

  // Progress timer loop
  useEffect(() => {
    if (!isOpen || items.length === 0 || isPaused) {
      if (progressAnimRef.current) cancelAnimationFrame(progressAnimRef.current);
      return;
    }

    lastTickRef.current = performance.now();

    const tick = (now: number) => {
      if (lastTickRef.current === null) lastTickRef.current = now;
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      setProgress(prev => {
        const next = prev + (delta / SLIDE_DURATION_MS) * 100;
        if (next >= 100) {
          if (currentIndex < items.length - 1) {
            setCurrentIndex(i => i + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return next;
      });

      progressAnimRef.current = requestAnimationFrame(tick);
    };

    progressAnimRef.current = requestAnimationFrame(tick);

    return () => {
      if (progressAnimRef.current) cancelAnimationFrame(progressAnimRef.current);
    };
  }, [isOpen, currentIndex, items.length, isPaused, onClose]);

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(i => i + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
      setProgress(0);
    }
  };

  const jumpToSlide = (idx: number) => {
    setCurrentIndex(idx);
    setProgress(0);
  };

  if (!isOpen || items.length === 0) return null;

  const currentItem = items[currentIndex];
  const type = currentItem?.update_type || 'text';
  const mediaList = currentItem?.media_urls || currentItem?.media || [];
  const primaryImage = mediaList.length > 0 ? mediaList[0] : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-0 md:p-6 select-none"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Story Card Container */}
        <div className="relative w-full max-w-xl h-full md:h-[820px] max-h-screen bg-[#0d0d12] rounded-none md:rounded-[32px] overflow-hidden border border-white/10 shadow-2xl flex flex-col justify-between">
          
          {/* Background Ambient Glow & Background Image if available */}
          {primaryImage ? (
            <div className="absolute inset-0 z-0">
              <img
                src={primaryImage}
                alt="Update preview"
                className="w-full h-full object-cover opacity-35 filter blur-sm scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d12] via-[#0d0d12]/70 to-[#0d0d12]/90" />
            </div>
          ) : (
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-500/20 rounded-full blur-[100px] animate-pulse" />
              <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-[100px] animate-pulse delay-1000" />
            </div>
          )}

          {/* Top Bar: Progress Segments + Room Title + Controls */}
          <div className="relative z-20 p-4 md:p-6 flex flex-col gap-3.5 bg-gradient-to-b from-black/80 to-transparent">
            {/* Story Segments */}
            <div className="flex items-center gap-1.5 w-full">
              {items.map((_, idx) => {
                let segProgress = 0;
                if (idx < currentIndex) segProgress = 100;
                else if (idx === currentIndex) segProgress = progress;

                return (
                  <div
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      jumpToSlide(idx);
                    }}
                    className="h-1.5 flex-1 bg-white/20 hover:bg-white/40 cursor-pointer rounded-full overflow-hidden transition-colors"
                  >
                    <div
                      className="h-full bg-white transition-[width] duration-75 ease-linear rounded-full"
                      style={{ width: `${segProgress}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Header info & action buttons */}
            <div className="flex items-center justify-between gap-3 text-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary-400/20 border border-primary-400/30 flex items-center justify-center shrink-0">
                  <Rocket className="w-4 h-4 text-primary-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold truncate leading-tight">{roomTitle}</h3>
                  <p className="text-[11px] text-white/60 font-medium flex items-center gap-1.5">
                    <span>Build Journey</span>
                    <span>•</span>
                    <span>{currentIndex + 1} of {items.length}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPaused(p => !p);
                  }}
                  className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                  title={isPaused ? "Play" : "Pause"}
                >
                  {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>
                {primaryImage && (
                  <a
                    href={primaryImage}
                    target="_blank"
                    rel="noreferrer"
                    download
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                    title="Open original image"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
                  title="Close (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Clickable tap zones (Left 35% prev, Right 65% next) */}
          <div className="absolute inset-0 z-10 flex">
            <div
              className="w-1/3 h-full cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
            />
            <div
              className="w-2/3 h-full cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
            />
          </div>

          {/* Central Content Area */}
          <div className="relative z-20 flex-1 px-6 md:px-10 py-6 flex flex-col justify-center overflow-y-auto pointer-events-none">
            <div className="pointer-events-auto max-w-lg mx-auto w-full space-y-6">
              
              {/* Type Badge */}
              <div className="flex items-center gap-2">
                {(type === 'milestone' || type === 'shipped') && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-black font-extrabold text-[11px] tracking-wider uppercase shadow-lg shadow-amber-400/20">
                    <Flag className="w-3.5 h-3.5" />
                    Milestone Reached
                  </span>
                )}
                {type === 'decision' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-400 text-white font-extrabold text-[11px] tracking-wider uppercase shadow-lg shadow-primary-400/20">
                    <GitCommit className="w-3.5 h-3.5" />
                    Decision Logged
                  </span>
                )}
                {type === 'poll' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-400 text-black font-extrabold text-[11px] tracking-wider uppercase shadow-lg">
                    <Sparkles className="w-3.5 h-3.5" />
                    Community Poll
                  </span>
                )}
              </div>

              {/* Update Text */}
              <motion.div
                key={currentItem?.id || currentIndex}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <p className="text-white text-xl md:text-2xl font-bold leading-relaxed whitespace-pre-wrap drop-shadow-md">
                  {currentItem?.content}
                </p>

                {/* Primary Media if present */}
                {primaryImage && (
                  <div className="rounded-2xl overflow-hidden border border-white/15 max-h-72 w-full bg-black/40 shadow-2xl">
                    <img
                      src={primaryImage}
                      alt="Journey media"
                      className="w-full h-full object-contain max-h-72"
                    />
                  </div>
                )}
              </motion.div>

              {/* Timestamp */}
              <div className="flex items-center gap-2 text-white/50 text-xs font-semibold uppercase tracking-widest pt-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>{timeAgo(currentItem?.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Bottom Desktop Navigation Hints */}
          <div className="relative z-20 px-6 py-4 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between text-xs text-white/50">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-[11px] font-mono">
              Hold to pause • Click sides or arrow keys to navigate
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
