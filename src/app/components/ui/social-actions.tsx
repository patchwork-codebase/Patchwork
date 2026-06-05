import * as React from "react";
import { cn } from "./utils";

export interface SocialActionItem {
  key: string;
  icon: React.ReactNode;
  count?: number | string;
  label?: string;
  onClick?: () => void;
  accent?: "slate" | "rose" | "emerald" | "blue" | "purple";
  active?: boolean;
}

const ACCENT_CLASSES: Record<SocialActionItem["accent"], string> = {
  slate: "hover:text-slate-100 text-slate-500",
  rose: "hover:text-rose-400 text-slate-500",
  emerald: "hover:text-emerald-400 text-slate-500",
  blue: "hover:text-[#8B7CF8] text-slate-500",
  purple: "hover:text-[#8B7CF8] text-slate-500",
};

const ICON_BG_CLASSES: Record<SocialActionItem["accent"], string> = {
  slate: "group-hover:bg-white/5",
  rose: "group-hover:bg-rose-500/10",
  emerald: "group-hover:bg-emerald-500/10",
  blue: "group-hover:bg-[#8B7CF8]/10",
  purple: "group-hover:bg-[#8B7CF8]/10",
};

interface SocialActionRowProps {
  actions: SocialActionItem[];
  className?: string;
}

export function SocialActionRow({ actions, className }: SocialActionRowProps) {
  return (
    <div className={cn("flex items-center justify-between text-slate-500 max-w-[400px]", className)}>
      {actions.map((action) => {
        const accent = action.accent ?? "slate";

        return (
          <button
            key={action.key}
            type="button"
            onClick={action.onClick}
            className={cn("flex items-center gap-2 transition-colors group active:scale-90", ACCENT_CLASSES[accent])}
          >
            <div className={cn("p-2 rounded-full transition-colors", ICON_BG_CLASSES[accent], action.active ? "bg-white/10" : "")}> 
              {action.icon}
            </div>

            {(action.count !== undefined || action.label) && (
              <span className="text-[13px]">{action.count ?? action.label}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
