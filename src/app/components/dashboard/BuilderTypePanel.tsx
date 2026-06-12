import { motion } from "motion/react";
import {
  Clipboard, Code2, Palette, Rocket, PenLine,
  TrendingUp, FlaskConical, Sparkles, Target,
  Users, Lightbulb, BarChart3, BookOpen, Zap, MessageSquare
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type BuilderType =
  | 'product-manager'
  | 'engineer'
  | 'product-designer'
  | 'founder'
  | 'writer'
  | 'growth'
  | 'research'
  | 'other'
  | string; // for older profiles using the old domain values

// ─── Config per builder type ────────────────────────────────────────────────

interface BuilderConfig {
  label: string;
  emoji: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;       // tailwind text colour
  bgColor: string;     // tailwind bg for icon wrapper
  borderColor: string; // tailwind border
  gradientFrom: string;
  tagline: string;
  suggestedActions: Array<{ label: string; description: string; icon: React.ComponentType<{ className?: string }> }>;
}

const BUILDER_CONFIGS: Record<string, BuilderConfig> = {
  'product-manager': {
    label: 'Product Manager',
    emoji: '📋',
    icon: Clipboard,
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/20',
    gradientFrom: 'from-violet-500/10',
    tagline: 'Define what gets built and why',
    suggestedActions: [
      { label: 'Log a decision', description: 'Record a key product decision in your active room', icon: Zap },
      { label: 'Set a milestone', description: 'Track your next release or sprint goal', icon: Target },
      { label: 'Share a roadmap update', description: 'Post what changed and why', icon: BarChart3 },
    ],
  },
  'engineer': {
    label: 'Engineer',
    emoji: '⚙️',
    icon: Code2,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    gradientFrom: 'from-emerald-500/10',
    tagline: 'Ship code. Share the journey.',
    suggestedActions: [
      { label: 'Share a code snippet', description: 'Post a clever solution or pattern you discovered', icon: Code2 },
      { label: 'Log a technical decision', description: 'Document an architecture or tech choice', icon: Zap },
      { label: 'Post a build update', description: 'What did you ship or debug today?', icon: Rocket },
    ],
  },
  'product-designer': {
    label: 'Product Designer',
    emoji: '🎨',
    icon: Palette,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/20',
    gradientFrom: 'from-pink-500/10',
    tagline: 'Design the experience. Build in the open.',
    suggestedActions: [
      { label: 'Share a design decision', description: 'Post why you chose this layout or interaction', icon: Lightbulb },
      { label: 'Show your iteration', description: 'Upload a before/after or work-in-progress', icon: Palette },
      { label: 'Capture user feedback', description: 'Log what users are telling you', icon: MessageSquare },
    ],
  },
  'founder': {
    label: 'Founder',
    emoji: '🚀',
    icon: Rocket,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    gradientFrom: 'from-amber-500/10',
    tagline: 'Build the company. Share the story.',
    suggestedActions: [
      { label: 'Post a company update', description: 'Share your traction, pivots, and learnings', icon: TrendingUp },
      { label: 'Log a strategic decision', description: 'Record a major direction or trade-off', icon: Zap },
      { label: 'Track a milestone', description: 'First paying customer, launch, or key metric', icon: Target },
    ],
  },
  'writer': {
    label: 'Writer',
    emoji: '✍️',
    icon: PenLine,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    gradientFrom: 'from-blue-500/10',
    tagline: 'Write the words that build the product.',
    suggestedActions: [
      { label: 'Share a content update', description: 'What are you writing or publishing this week?', icon: PenLine },
      { label: 'Log your research', description: 'Post insights from interviews or secondary research', icon: BookOpen },
      { label: 'Share a creative decision', description: 'Document your tone, voice, or editorial choices', icon: Lightbulb },
    ],
  },
  'growth': {
    label: 'Growth',
    emoji: '📈',
    icon: TrendingUp,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    gradientFrom: 'from-green-500/10',
    tagline: 'Run the experiments. Share the results.',
    suggestedActions: [
      { label: 'Post an experiment result', description: 'What did you test and what happened?', icon: BarChart3 },
      { label: 'Log a channel decision', description: 'Document which acquisition channel you\'re focusing on', icon: Zap },
      { label: 'Share a metric update', description: 'Post a key number and what it means', icon: TrendingUp },
    ],
  },
  'research': {
    label: 'Research',
    emoji: '🔬',
    icon: FlaskConical,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/20',
    gradientFrom: 'from-cyan-500/10',
    tagline: 'Uncover the truth. Build on evidence.',
    suggestedActions: [
      { label: 'Share a finding', description: 'Post an insight from user research or data analysis', icon: FlaskConical },
      { label: 'Log a hypothesis', description: 'Document what you\'re testing and why', icon: Lightbulb },
      { label: 'Post a research update', description: 'Share progress on an ongoing study or experiment', icon: BookOpen },
    ],
  },
  // Legacy domain values from old "domain" field
  'design': {
    label: 'Designer',
    emoji: '🎨',
    icon: Palette,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/20',
    gradientFrom: 'from-pink-500/10',
    tagline: 'Design the experience. Build in the open.',
    suggestedActions: [
      { label: 'Share a design decision', description: 'Post why you chose this layout or interaction', icon: Lightbulb },
      { label: 'Show your iteration', description: 'Upload a before/after or work-in-progress', icon: Palette },
      { label: 'Capture user feedback', description: 'Log what users are telling you', icon: MessageSquare },
    ],
  },
  'engineering': {
    label: 'Engineer',
    emoji: '⚙️',
    icon: Code2,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    gradientFrom: 'from-emerald-500/10',
    tagline: 'Ship code. Share the journey.',
    suggestedActions: [
      { label: 'Share a code snippet', description: 'Post a clever solution or pattern you discovered', icon: Code2 },
      { label: 'Log a technical decision', description: 'Document an architecture or tech choice', icon: Zap },
      { label: 'Post a build update', description: 'What did you ship or debug today?', icon: Rocket },
    ],
  },
};

const DEFAULT_CONFIG: BuilderConfig = {
  label: 'Builder',
  emoji: '🔨',
  icon: Sparkles,
  color: 'text-[#8B7CF8]',
  bgColor: 'bg-[#8B7CF8]/10',
  borderColor: 'border-[#8B7CF8]/20',
  gradientFrom: 'from-[#8B7CF8]/10',
  tagline: 'Build in public. Share the journey.',
  suggestedActions: [
    { label: 'Post your first update', description: 'Share what you\'re working on right now', icon: Zap },
    { label: 'Create a room', description: 'Start a project and build in the open', icon: Rocket },
    { label: 'Explore the feed', description: 'See what other builders are shipping', icon: Users },
  ],
};

// ─── Component ───────────────────────────────────────────────────────────────

interface BuilderTypePanelProps {
  domain?: string;
  onSetTab: (tab: 'feed' | 'mine' | 'overview') => void;
}

export function BuilderTypePanel({ domain, onSetTab }: BuilderTypePanelProps) {
  const config = (domain && BUILDER_CONFIGS[domain]) ? BUILDER_CONFIGS[domain] : DEFAULT_CONFIG;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className={`rounded-3xl border ${config.borderColor} bg-gradient-to-br ${config.gradientFrom} to-transparent p-6 mb-6`}
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-5">
        <div className={`w-12 h-12 rounded-2xl ${config.bgColor} border ${config.borderColor} flex items-center justify-center shrink-0`}>
          <Icon className={`w-6 h-6 ${config.color}`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-[18px] font-extrabold text-white leading-tight">
              {config.emoji} {config.label} Dashboard
            </h2>
          </div>
          <p className="text-[13px] text-slate-400 font-medium mt-0.5">{config.tagline}</p>
        </div>
      </div>

      {/* Suggested actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {config.suggestedActions.map((action, i) => {
          const ActionIcon = action.icon;
          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 + i * 0.07 }}
              onClick={() => onSetTab('feed')}
              className={`group flex items-start gap-3 p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:${config.borderColor} rounded-2xl text-left transition-all hover:shadow-lg active:scale-[0.98] cursor-pointer`}
            >
              <div className={`w-8 h-8 rounded-xl ${config.bgColor} border ${config.borderColor} flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform`}>
                <ActionIcon className={`w-4 h-4 ${config.color}`} />
              </div>
              <div>
                <div className="text-[13px] font-bold text-white">{action.label}</div>
                <div className="text-[11.5px] text-slate-500 mt-0.5 leading-relaxed">{action.description}</div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
