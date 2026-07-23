import { useState } from "react";
import { CornerDownRight, Quote } from "lucide-react";

interface ReadMoreTextProps {
  content?: string;
  text?: string;
  maxLength?: number;
  className?: string;
}

function formatInlineText(textStr: string) {
  if (!textStr) return null;
  // Regex to split by @mentions or URLs
  const parts = textStr.split(/(@[a-zA-Z0-9_-]+|https?:\/\/[^\s]+)/g);

  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      return (
        <span key={i} className="font-bold text-primary-600 hover:text-primary-700 hover:underline cursor-pointer">
          {part}
        </span>
      );
    }
    if (part.startsWith('http://') || part.startsWith('https://')) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-primary-500 hover:text-primary-600 underline font-medium break-all"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

function QuoteBlock({ lines }: { lines: string[] }) {
  const cleanText = lines.map(l => l.replace(/^>\s?/, '')).join('\n').trim();
  if (!cleanText) return null;

  // Match "Replying to [Topic] from @User:" or "Replying to @User:"
  const replyMatch = cleanText.match(/^Replying to\s+(.*?)\s+from\s+@([^\s:]+)\s*:?(.*)/i)
    || cleanText.match(/^Replying to\s+@([^\s:]+)\s*:?(.*)/i);

  if (replyMatch) {
    let topic = '';
    let author = '';
    let extraText = '';

    if (replyMatch.length === 4) {
      topic = replyMatch[1];
      author = replyMatch[2];
      extraText = replyMatch[3]?.trim();
    } else if (replyMatch.length === 3) {
      author = replyMatch[1];
      extraText = replyMatch[2]?.trim();
    }

    return (
      <div className="my-2.5 p-3 sm:p-3.5 bg-gradient-to-r from-purple-50/80 via-primary-50/40 to-slate-50/80 rounded-2xl border border-primary-100/80 border-l-4 border-l-primary-500 shadow-sm transition-all text-[13px]">
        <div className="flex items-center gap-1.5 text-[12px] text-slate-600 font-semibold mb-1 flex-wrap">
          <CornerDownRight className="w-3.5 h-3.5 text-primary-500 shrink-0" />
          <span>Replying to</span>
          {topic && <span className="font-bold text-slate-800">"{topic}"</span>}
          <span>from</span>
          <span className="inline-flex items-center gap-1 font-bold text-primary-600 bg-white/90 px-2 py-0.5 rounded-full border border-primary-200/60 shadow-xs">
            @{author}
          </span>
        </div>
        {extraText && (
          <p className="text-[13px] text-slate-600 italic font-medium leading-relaxed pl-5 mt-1">
            "{extraText}"
          </p>
        )}
      </div>
    );
  }

  // Generic blockquote styling
  return (
    <div className="my-2.5 p-3 bg-slate-50/90 rounded-2xl border border-slate-200/80 border-l-4 border-l-slate-400 flex items-start gap-2.5 shadow-xs text-[13px]">
      <Quote className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
      <div className="text-slate-600 italic font-medium leading-relaxed whitespace-pre-wrap">
        {cleanText}
      </div>
    </div>
  );
}

function renderFormattedBlocks(fullText: string) {
  const lines = fullText.split('\n');
  const blocks: Array<{ type: 'quote' | 'text'; lines: string[] }> = [];
  let currentBlock: { type: 'quote' | 'text'; lines: string[] } | null = null;

  for (const line of lines) {
    const isQuoteLine = line.trim().startsWith('>');
    const type = isQuoteLine ? 'quote' : 'text';

    if (!currentBlock || currentBlock.type !== type) {
      currentBlock = { type, lines: [line] };
      blocks.push(currentBlock);
    } else {
      currentBlock.lines.push(line);
    }
  }

  return blocks.map((block, idx) => {
    if (block.type === 'quote') {
      return <QuoteBlock key={idx} lines={block.lines} />;
    }

    const nonQuoteText = block.lines.join('\n').trim();
    if (!nonQuoteText) return null;

    return (
      <p key={idx} className="leading-relaxed">
        {formatInlineText(nonQuoteText)}
      </p>
    );
  });
}

export function ReadMoreText({ content, text, maxLength = 280, className = "" }: ReadMoreTextProps) {
  const [expanded, setExpanded] = useState(false);
  const value = content ?? text ?? '';

  if (!value) return null;

  const isLong = value.length > maxLength || value.split('\n').length > 5;
  const displayText = (!expanded && isLong) ? value.slice(0, maxLength) + '...' : value;

  return (
    <div className="relative">
      <div className={`space-y-1.5 ${className}`}>
        {renderFormattedBlocks(displayText)}
      </div>

      {isLong && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="text-primary-500 hover:text-primary-600 font-bold text-[12px] mt-2 inline-flex items-center gap-1 transition-colors focus-visible:outline-none cursor-pointer"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}

