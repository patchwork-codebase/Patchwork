import React from "react";
import { CheckCircle2, XCircle, ArrowRight, AlertTriangle } from "lucide-react";

export interface DecisionOption {
  title: string;
  pros?: string[];
  cons?: string[];
  tradeoffs?: string;
  selected?: boolean;
}

export interface DecisionMatrixData {
  problemContext?: string;
  options: DecisionOption[];
  rationale?: string;
}

interface DecisionMatrixBlockProps {
  data: DecisionMatrixData;
}

export function DecisionMatrixBlock({ data }: DecisionMatrixBlockProps) {
  if (!data || !data.options || data.options.length === 0) return null;

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-indigo-100 bg-gradient-to-b from-indigo-50/60 to-slate-50/50 p-3 sm:p-4 text-xs sm:text-sm">
      <div className="flex items-center gap-1.5 font-bold text-indigo-950 mb-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-600 text-slate-900 dark:text-white text-[10px]">
          ⚖️
        </span>
        <span>Decision Trade-off Matrix</span>
      </div>

      {data.problemContext && (
        <p className="text-slate-600 mb-3 italic text-xs border-l-2 border-indigo-300 pl-2">
          "{data.problemContext}"
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {data.options.map((opt, idx) => (
          <div
            key={idx}
            className={`rounded-lg border p-3 transition-all ${
              opt.selected
                ? "border-emerald-300 bg-white shadow-sm ring-1 ring-emerald-400/30"
                : "border-slate-200 bg-white/70 opacity-80"
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                {opt.selected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                )}
                {opt.title}
              </span>
              {opt.selected && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  Chosen Path
                </span>
              )}
            </div>

            {opt.tradeoffs && (
              <p className="text-[12px] text-slate-600 mb-2">
                <strong className="text-slate-700">Trade-off: </strong>
                {opt.tradeoffs}
              </p>
            )}

            {opt.pros && opt.pros.length > 0 && (
              <div className="space-y-1 mb-1">
                {opt.pros.map((pro, pIdx) => (
                  <div key={pIdx} className="flex items-start gap-1 text-[11px] text-emerald-700">
                    <span className="font-bold">+</span>
                    <span>{pro}</span>
                  </div>
                ))}
              </div>
            )}

            {opt.cons && opt.cons.length > 0 && (
              <div className="space-y-1">
                {opt.cons.map((con, cIdx) => (
                  <div key={cIdx} className="flex items-start gap-1 text-[11px] text-rose-700">
                    <span className="font-bold">-</span>
                    <span>{con}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {data.rationale && (
        <div className="mt-3 rounded-lg bg-indigo-900/5 border border-indigo-200/60 p-2.5 flex items-start gap-2 text-indigo-900 text-xs">
          <AlertTriangle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Architectural Rationale: </span>
            <span>{data.rationale}</span>
          </div>
        </div>
      )}
    </div>
  );
}
