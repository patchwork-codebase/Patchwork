import { ShieldCheck } from "lucide-react";

const TIER_CONFIG = {
  bronze: {
    label: "Verified Expert",
    emoji: "🥉",
    gradient: "from-amber-700 to-amber-500",
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    ring: "ring-amber-500/20",
    description: "Verified experience",
  },
  silver: {
    label: "Recognized Expert",
    emoji: "🥈",
    gradient: "from-slate-500 to-slate-300",
    text: "text-slate-300",
    bg: "bg-slate-400/10",
    border: "border-slate-400/20",
    ring: "ring-slate-400/20",
    description: "Recognized expert",
  },
  gold: {
    label: "Industry Leader",
    emoji: "🥇",
    gradient: "from-yellow-600 to-yellow-400",
    text: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    ring: "ring-yellow-500/20",
    description: "Industry leader",
  },
  platinum: {
    label: "Patchwork Fellow",
    emoji: "💎",
    gradient: "from-cyan-500 to-violet-500",
    text: "text-cyan-300",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    ring: "ring-cyan-500/20",
    description: "Patchwork Fellow",
  },
} as const;

type Tier = keyof typeof TIER_CONFIG;

interface ExpertBadgeProps {
  tier?: string | null;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ExpertBadge({ tier = "bronze", size = "md", showLabel = true }: ExpertBadgeProps) {
  const config = TIER_CONFIG[(tier as Tier) ?? "bronze"] ?? TIER_CONFIG.bronze;

  const sizes = {
    sm: { icon: "w-3 h-3", text: "text-[10px]", px: "px-2 py-1", gap: "gap-1" },
    md: { icon: "w-3.5 h-3.5", text: "text-[11px]", px: "px-2.5 py-1.5", gap: "gap-1.5" },
    lg: { icon: "w-4 h-4", text: "text-[13px]", px: "px-3 py-2", gap: "gap-2" },
  };

  const s = sizes[size];

  return (
    <span
      className={`inline-flex items-center ${s.gap} ${s.px} rounded-full border ${config.border} ${config.bg} ring-1 ${config.ring}`}
      title={config.description}
    >
      <ShieldCheck className={`${s.icon} ${config.text} shrink-0`} strokeWidth={2.5} />
      {showLabel && (
        <span className={`${s.text} font-bold ${config.text} tracking-wide whitespace-nowrap`}>
          {config.emoji} {config.label}
        </span>
      )}
    </span>
  );
}
