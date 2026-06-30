import React from 'react';
import { Zap } from 'lucide-react';

interface ReputationBadgeProps {
  score?: number;
  domain?: string;
  className?: string;
}

export function ReputationBadge({ score, domain, className = '' }: ReputationBadgeProps) {
  if (score === undefined || score <= 0) return null;

  return (
    <span 
      className={`inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-800 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded-md shadow-sm ml-1 align-text-bottom tracking-wide ${className}`}
      title="Domain Reputation"
    >
      <Zap className="w-3 h-3 text-amber-500 fill-amber-500/20" />
      {domain ? <span className="opacity-70">{domain}</span> : null}
      <span>{score}</span>
    </span>
  );
}
