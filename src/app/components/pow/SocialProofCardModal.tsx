import React, { useState } from "react";
import { Share2, X, Download, Copy, Check, Sparkles, Flame } from "lucide-react";
import type { FeedUpdate } from "../../hooks/useFeedUpdates";

interface SocialProofCardModalProps {
  update: FeedUpdate;
  isOpen: boolean;
  onClose: () => void;
}

export function SocialProofCardModal({ update, isOpen, onClose }: SocialProofCardModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    setCopied(true);
    navigator.clipboard.writeText(window.location.href);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-500" />
            <h3 className="font-bold text-slate-900 text-base">Share Proof of Work Card</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* The OpenGraph Social Preview Card */}
        <div className="p-6 bg-slate-50 flex justify-center">
          <div className="w-full rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
            {/* Background Accent Glow */}
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary-500/20 blur-3xl pointer-events-none" />

            {/* Top Bar */}
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center font-bold text-white text-sm shadow-md">
                  {update.authorName ? update.authorName.charAt(0) : "B"}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm leading-tight">{update.authorName || "Builder"}</h4>
                  <span className="text-[11px] text-indigo-300 font-medium">Patchwork Builder</span>
                </div>
              </div>

              <div className="flex items-center gap-1 rounded-full bg-indigo-500/20 px-2.5 py-1 border border-indigo-400/30 text-[10px] font-bold text-indigo-200">
                <Flame className="w-3 h-3 text-amber-400" /> PROOF OF WORK
              </div>
            </div>

            {/* Post Content */}
            <p className="text-slate-100 text-sm leading-relaxed font-medium mb-4 line-clamp-4">
              "{update.content}"
            </p>

            {/* Footer Room & Date Tag */}
            <div className="pt-3 border-t border-indigo-900/60 flex items-center justify-between text-[11px] text-indigo-300">
              <span className="font-semibold tracking-wide">patchwork.build</span>
              <span>{new Date(update.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500">Ready to post on Twitter / LinkedIn</span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied Link" : "Copy Link"}
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Share2 className="w-3.5 h-3.5" /> Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
