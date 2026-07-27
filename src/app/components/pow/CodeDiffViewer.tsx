import React, { useState } from "react";
import { Code, Check, Copy, FileCode } from "lucide-react";

export interface DiffData {
  filename?: string;
  language?: string;
  before: string;
  after: string;
}

interface CodeDiffViewerProps {
  data: DiffData;
}

export function CodeDiffViewer({ data }: CodeDiffViewerProps) {
  const [copied, setCopied] = useState(false);

  if (!data || (!data.before && !data.after)) return null;

  const beforeLines = data.before ? data.before.trim().split("\n") : [];
  const afterLines = data.after ? data.after.trim().split("\n") : [];

  const handleCopy = () => {
    setCopied(true);
    navigator.clipboard.writeText(data.after || data.before);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 text-slate-200 text-xs font-mono shadow-md">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-3 py-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-2 font-medium">
          <FileCode className="w-3.5 h-3.5 text-primary-400" />
          <span className="text-slate-200">{data.filename || "diff_changes.ts"}</span>
          {data.language && (
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] uppercase font-bold text-slate-400">
              {data.language}
            </span>
          )}
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Diff Output */}
      <div className="max-h-80 overflow-x-auto p-2 leading-relaxed text-[11px]">
        {/* Removed Lines */}
        {beforeLines.map((line, idx) => (
          <div key={`del-${idx}`} className="flex items-start bg-rose-950/40 text-rose-300 px-2 py-0.5 border-l-2 border-rose-500">
            <span className="w-6 shrink-0 select-none text-rose-600 font-bold">-</span>
            <span className="whitespace-pre">{line}</span>
          </div>
        ))}

        {/* Added Lines */}
        {afterLines.map((line, idx) => (
          <div key={`add-${idx}`} className="flex items-start bg-emerald-950/40 text-emerald-300 px-2 py-0.5 border-l-2 border-emerald-500">
            <span className="w-6 shrink-0 select-none text-emerald-600 font-bold">+</span>
            <span className="whitespace-pre">{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
