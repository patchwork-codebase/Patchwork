import { motion, AnimatePresence } from "motion/react";
import React from "react";

export const COMMON_EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😉', '😊', '😇', 
  '🥰', '😍', '🤩', '😘', '🔥', '👍', '👎', '🚀', '👀', '💯', '✨', '🎉', 
  '👏', '🙌', '🤔', '❤️'
];

interface InlineEmojiPickerProps {
  isOpen: boolean;
  onEmojiSelect: (emoji: string) => void;
  className?: string;
  buttonClassName?: string;
}

export function InlineEmojiPicker({ isOpen, onEmojiSelect, className = "", buttonClassName = "" }: InlineEmojiPickerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className={`flex flex-wrap items-center gap-1.5 overflow-hidden ${className}`}
        >
          {COMMON_EMOJIS.map(emoji => (
            <button
              key={emoji}
              onClick={(e) => {
                e.preventDefault();
                onEmojiSelect(emoji);
              }}
              className={`text-xl flex items-center justify-center shrink-0 transition-colors ${buttonClassName}`}
            >
              {emoji}
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
