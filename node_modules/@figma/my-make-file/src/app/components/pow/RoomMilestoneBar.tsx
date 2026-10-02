import React from "react";
import { CheckCircle2, Circle, Compass, Rocket, Zap, Flag } from "lucide-react";

export type PhaseType = "ideation" | "prototype" | "beta" | "launched" | "scaling";

interface MilestonePhaseConfig {
  label: string;
  icon: React.ReactNode;
  color: string;
}

const PHASES: Record<PhaseType, MilestonePhaseConfig> = {
  ideation: { label: "Ideation & Specs", icon: <Compass className="w-3.5 h-3.5" />, color: "bg-primary-500/10 text-primary-400 border-primary-500/20" },
  prototype: { label: "Working Prototype", icon: <Zap className="w-3.5 h-3.5" />, color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  beta: { label: "Private Beta", icon: <Flag className="w-3.5 h-3.5" />, color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  launched: { label: "Public Launch (V1)", icon: <Rocket className="w-3.5 h-3.5" />, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  scaling: { label: "Growth & Scaling", icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
};

interface RoomMilestoneBarProps {
  currentPhase?: PhaseType;
  interactive?: boolean;
  onPhaseSelect?: (phase: PhaseType) => void;
}

export function RoomMilestoneBar({ currentPhase = "beta", interactive = false, onPhaseSelect }: RoomMilestoneBarProps) {
  const phaseKeys = Object.keys(PHASES) as PhaseType[];
  const activeConfig = PHASES[currentPhase] || PHASES["beta"];
  const currentIndex = Math.max(0, phaseKeys.indexOf(currentPhase in PHASES ? currentPhase : "beta"));

  return (
    <div className="w-full my-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-transparent p-3 shadow-xs">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Flag className="w-3.5 h-3.5 text-primary-500" /> Project Lifecycle
        </span>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold ${activeConfig.color}`}>
          {activeConfig.icon}
          {activeConfig.label}
        </span>
      </div>

      {/* Progress Track */}
      <div className="relative flex items-center justify-between">
        {/* Background Line */}
        <div className="absolute top-1/2 left-3 right-3 -translate-y-1/2 h-0.5 bg-slate-100 dark:bg-slate-800 z-0" />

        {/* Active Line Fill */}
        <div
          className="absolute top-1/2 left-3 -translate-y-1/2 h-0.5 bg-primary-500 z-0 transition-all duration-500"
          style={{ width: `${(currentIndex / (phaseKeys.length - 1)) * 100}%` }}
        />

        {/* Phase Nodes */}
        {phaseKeys.map((phase, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <button
              key={phase}
              disabled={!interactive}
              onClick={() => onPhaseSelect?.(phase)}
              className={`relative z-10 flex flex-col items-center gap-1 group ${
                interactive ? "cursor-pointer" : "cursor-default"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  isCurrent
                    ? "bg-primary-600 text-white ring-4 ring-primary-900/50 shadow-md scale-110"
                    : isDone
                    ? "bg-primary-500 text-white"
                    : "bg-slate-800 text-slate-500 border border-slate-700"
                }`}
              >
                {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <span
                className={`text-[10px] font-medium hidden sm:inline-block max-w-[70px] text-center truncate ${
                  isCurrent ? "text-primary-400 font-bold" : isDone ? "text-slate-300" : "text-slate-500"
                }`}
              >
                {PHASES[phase].label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
