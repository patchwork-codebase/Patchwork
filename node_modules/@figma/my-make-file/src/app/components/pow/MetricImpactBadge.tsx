import React from "react";
import { Zap, TrendingUp, ShieldCheck } from "lucide-react";

export interface MetricWinData {
  metricName: string;
  beforeVal: string | number;
  afterVal: string | number;
  unit?: string;
  impactPct?: string;
}

interface MetricImpactBadgeProps {
  data: MetricWinData;
}

export function MetricImpactBadge({ data }: MetricImpactBadgeProps) {
  if (!data || !data.metricName) return null;

  return (
    <div className="my-2.5 inline-flex items-center gap-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-3 py-1.5 text-xs text-emerald-950 shadow-xs">
      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
        <Zap className="w-3.5 h-3.5" />
      </div>

      <div className="flex items-center gap-2">
        <span className="font-semibold text-slate-700">{data.metricName}:</span>
        <div className="flex items-center gap-1 font-mono font-bold">
          <span className="text-slate-500 line-through text-[11px]">
            {data.beforeVal}
            {data.unit}
          </span>
          <span className="text-slate-500 dark:text-slate-400">→</span>
          <span className="text-emerald-700 font-extrabold">
            {data.afterVal}
            {data.unit}
          </span>
        </div>

        {data.impactPct && (
          <span className="ml-1 flex items-center gap-0.5 rounded-full bg-emerald-200/60 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
            <TrendingUp className="w-3 h-3" />
            {data.impactPct}
          </span>
        )}
      </div>
    </div>
  );
}
