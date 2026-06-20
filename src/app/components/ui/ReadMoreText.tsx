import { useState } from "react";

export function ReadMoreText({ content, text, maxLength = 250, className = "" }: { content?: string; text?: string; maxLength?: number; className?: string }) {
  const [expanded, setExpanded] = useState(false);
  const value = content ?? text ?? '';

  if (!value) return null;

  // If text is relatively short, just render it normally
  if (value.length < maxLength && value.split('\n').length <= 4) {
    return <p className={className}>{value}</p>;
  }

  return (
    <div className="relative">
      <p className={`${className} ${!expanded ? 'line-clamp-4 overflow-hidden' : ''}`}>
        {value}
      </p>
      {!expanded ? (
        <button 
          onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
          className="text-primary-400 hover:text-white font-bold text-[13px] mt-2 transition-colors focus-visible:outline-none"
        >
          Read more
        </button>
      ) : (
        <button 
          onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
          className="text-slate-500 hover:text-white font-bold text-[13px] mt-2 transition-colors focus-visible:outline-none"
        >
          Show less
        </button>
      )}
    </div>
  );
}
