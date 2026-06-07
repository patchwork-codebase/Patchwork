import { useState } from 'react';
import { supabase } from '../auth/AuthContext';
import { useGithubDrafts } from '../../hooks/useGithub';
import { Github, Check, X, GitCommit, FileText, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export function DraftUpdates({ roomId, profile }: { roomId: string, profile: any }) {
  const { data: drafts, isLoading, refetch } = useGithubDrafts(roomId);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [discarding, setDiscarding] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handlePublish = async (draft: any) => {
    setPublishing(draft.id);
    try {
      // Create new update in the rooms feed
      const updatePayload = {
        id: `${roomId}-update-${Date.now()}`,
        room_id: roomId,
        builder_id: profile?.id, // assuming profile.id is builder_id
        text: `**${draft.commit_title}**\n\n${draft.commit_message || ''}`,
        media: [],
        links: draft.commit_url ? [draft.commit_url] : [],
        code_snippet: null,
        created_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase.from('updates').insert(updatePayload);
      if (insertError) throw insertError;

      // Update room metadata
      const { data: room } = await supabase.from('rooms').select('update_count').eq('id', roomId).single();
      await supabase.from('rooms').update({
        update_count: (room?.update_count || 0) + 1,
        last_update: updatePayload.text.trim().slice(0, 120),
        updated_at: new Date().toISOString()
      }).eq('id', roomId);

      // Mark draft as published
      await supabase.from('github_drafts').update({ status: 'published' }).eq('id', draft.id);

      toast.success('Draft published successfully!');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['room', roomId] });
      queryClient.invalidateQueries({ queryKey: ['feed-updates'] });
    } catch (err: any) {
      toast.error(`Failed to publish draft: ${err.message}`);
    } finally {
      setPublishing(null);
    }
  };

  const handleDiscard = async (draftId: string) => {
    setDiscarding(draftId);
    try {
      await supabase.from('github_drafts').update({ status: 'discarded' }).eq('id', draftId);
      toast.success('Draft discarded');
      refetch();
    } catch (err: any) {
      toast.error(`Failed to discard draft: ${err.message}`);
    } finally {
      setDiscarding(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!drafts || drafts.length === 0) return null;

  return (
    <div className="mb-8 space-y-4">
      <h3 className="text-[14px] font-extrabold text-white flex items-center gap-2 uppercase tracking-widest font-display">
        <Github className="w-4 h-4 text-[#8B7CF8]" /> Review GitHub Drafts
      </h3>
      
      {drafts.map(draft => (
        <div key={draft.id} className="bg-[#8B7CF8]/5 border border-[#8B7CF8]/20 rounded-2xl p-4 sm:p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#6C5CE7] to-[#8B7CF8]" />
          
          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="flex items-center gap-1 text-[11px] font-bold text-slate-300 bg-white/5 px-2 py-1 rounded-md">
                  <GitCommit className="w-3 h-3" /> {draft.commit_hash.substring(0, 7)}
                </span>
                <span className="text-[12px] text-slate-500">{new Date(draft.created_at).toLocaleString()}</span>
              </div>
              <h4 className="text-[16px] font-bold text-white mb-2 leading-snug">{draft.commit_title}</h4>
              {draft.commit_message && draft.commit_message !== draft.commit_title && (
                <p className="text-[13px] text-slate-400 mb-3 line-clamp-2">{draft.commit_message}</p>
              )}
              {draft.diff_preview && (
                <div className="bg-[#0A0910]/50 border border-white/[0.05] rounded-lg p-3 text-[12px] text-slate-300 font-mono whitespace-pre-wrap">
                  {draft.diff_preview}
                </div>
              )}
            </div>
            
            <div className="flex md:flex-col gap-2 shrink-0">
              <button
                onClick={() => handlePublish(draft)}
                disabled={publishing === draft.id || discarding === draft.id}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#8B7CF8] hover:bg-[#7b6ce8] text-white rounded-xl text-[13px] font-bold transition-colors disabled:opacity-50"
              >
                {publishing === draft.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Publish
              </button>
              <button
                onClick={() => handleDiscard(draft.id)}
                disabled={publishing === draft.id || discarding === draft.id}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-[13px] font-bold transition-colors disabled:opacity-50"
              >
                {discarding === draft.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                Discard
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
