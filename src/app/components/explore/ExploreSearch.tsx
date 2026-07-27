import { Search, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface ExploreSearchProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function ExploreSearch({ value, onChange, placeholder = "Search builders or rooms..." }: ExploreSearchProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`relative flex items-center w-full max-w-md bg-transparent border rounded-2xl transition-all duration-300 ${
        isFocused
          ? "border-primary-400 shadow-[0_0_0_4px_rgba(139,124,248,0.1)]"
          : "border-slate-800 hover:border-slate-700"
      }`}
    >
      <div className="pl-4 pr-3 py-3 flex items-center justify-center shrink-0">
        <Search className={`w-5 h-5 transition-colors ${isFocused ? "text-primary-400" : "text-slate-400"}`} />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="flex-1 bg-transparent border-none outline-none text-[15px] font-medium text-slate-100 placeholder:text-slate-500 py-3 pr-4"
      />
      {value && (
        <button
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          className="pr-4 pl-2 py-3 flex items-center justify-center shrink-0 group"
          aria-label="Clear search"
        >
          <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
            <X className="w-3 h-3 text-slate-400 group-hover:text-slate-300" />
          </div>
        </button>
      )}
    </div>
  );
}
