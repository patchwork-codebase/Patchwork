import { useState, useRef } from "react";
import { supabase } from "../auth/AuthContext";
import { Bold, Italic, ListOrdered, List, Link as LinkIcon, Code, Quote, AtSign, ImageIcon, Smile } from "lucide-react";
import { InlineEmojiPicker } from "../ui/InlineEmojiPicker";
import { toast } from "sonner";
import { QUERY_KEYS } from "../../constants";
import type { FeedUpdate } from "../../hooks/useFeedUpdates";
import type { QueryClient } from "@tanstack/react-query";
import type { Profile } from "../../types";

interface ReplyComposerProps {
  update: FeedUpdate;
  user: { id: string; email?: string } | null;
  profile: Profile | null;
  queryClient: QueryClient;
  onCancel: () => void;
  onSuccess?: () => void;
  onSubmit: (text: string) => Promise<void>;
  initialText?: string;
}

export function ReplyComposer({
  update,
  user,
  profile,
  queryClient,
  onCancel,
  onSuccess,
  onSubmit,
  initialText = ""
}: ReplyComposerProps) {
  const [replyText, setReplyText] = useState(initialText);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = replyTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = replyText;
    const selectedText = text.substring(start, end);

    const newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
    setReplyText(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const submitReply = async () => {
    if (!replyText.trim() || !user || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(replyText.trim());
      setReplyText("");
      onSuccess?.();
    } catch (err: unknown) {
      console.error('Error submitting reply:', err);
      toast.error('Failed to post reply.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-3 flex flex-col gap-2 relative z-10" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-all">
        {/* Formatting Toolbar */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 bg-slate-50 overflow-x-auto">
          <button onClick={() => insertFormatting('**', '**')} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors" title="Bold"><Bold className="w-4 h-4" /></button>
          <button onClick={() => insertFormatting('*', '*')} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors" title="Italic"><Italic className="w-4 h-4" /></button>
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <button onClick={() => insertFormatting('1. ')} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors" title="Numbered List"><ListOrdered className="w-4 h-4" /></button>
          <button onClick={() => insertFormatting('- ')} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors" title="Bulleted List"><List className="w-4 h-4" /></button>
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <button onClick={() => insertFormatting('[', '](url)')} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors" title="Link"><LinkIcon className="w-4 h-4" /></button>
          <button onClick={() => insertFormatting('`', '`')} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors" title="Code"><Code className="w-4 h-4" /></button>
          <button onClick={() => insertFormatting('> ')} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors" title="Quote"><Quote className="w-4 h-4" /></button>
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <button onClick={() => insertFormatting('@')} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors" title="Mention"><AtSign className="w-4 h-4" /></button>
          <div className="w-px h-4 bg-slate-200 mx-1" />
          <button onClick={() => insertFormatting('![alt text](', ')')} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded transition-colors" title="Image"><ImageIcon className="w-4 h-4" /></button>
          <div className="relative flex items-center">
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-1.5 rounded transition-colors ${showEmojiPicker ? 'text-primary-500 bg-primary-50' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'}`} title="Emoji"><Smile className="w-4 h-4" /></button>
          </div>
        </div>
        <InlineEmojiPicker
          isOpen={showEmojiPicker}
          className="px-3 py-2 bg-slate-50/50 border-b border-slate-100"
          buttonClassName="w-8 h-8 rounded-full hover:bg-slate-200"
          onEmojiSelect={(emoji) => {
            setReplyText(prev => prev + emoji);
            replyTextareaRef.current?.focus();
          }}
        />
        <textarea
          ref={replyTextareaRef}
          autoFocus
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder={`Replying to @${update.authorName.toLowerCase().replace(/\s+/g, '')}...`}
          className="w-full bg-transparent p-3 text-[16px] sm:text-[14px] text-slate-900 placeholder-slate-400 focus:outline-none resize-none min-h-[80px]"
        />
      </div>
      <div className="flex justify-end gap-2 mt-1">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-full text-[13px] font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={submitReply}
          disabled={!replyText.trim() || isSubmitting}
          className="px-5 py-2 rounded-full bg-primary-500 hover:bg-[#5b4cdb] text-white text-[13px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Reply'
          )}
        </button>
      </div>
    </div>
  );
}
