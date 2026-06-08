import { useState } from "react";

export function ReadMoreText({ content, className = "" }: { content: string, className?: string }) {
  const [expanded, setExpanded] = useState(false);
  
  // If text is relatively short, just render it normally
  if (content.length < 250 && content.split('\n').length <= 4) {
    return <p className={className}>{content}</p>;
  }

  return (
    <div className="relative">
      <p className={`${className} ${!expanded ? 'line-clamp-4 overflow-hidden' : ''}`}>
        {content}
      </p>
      {!expanded ? (
        <button 
          onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
          className="text-[#8B7CF8] hover:text-white font-bold text-[13px] mt-2 transition-colors focus-visible:outline-none"
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
