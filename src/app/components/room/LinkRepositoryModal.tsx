import { useState, useEffect } from 'react';
import { supabase } from '../auth/AuthContext';
import { useGithubAccount, useGithubRepositories } from '../../hooks/useGithub';
import { Github, Link as LinkIcon, Loader2, Plus, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

export function LinkRepositoryModal({ roomId, userId }: { roomId: string, userId: string }) {
  const { data: githubAccount, isLoading: accountLoading } = useGithubAccount(userId);
  const { data: linkedRepos, refetch: refetchRepos } = useGithubRepositories(userId);
  const [open, setOpen] = useState(false);
  const [repos, setRepos] = useState<any[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [linking, setLinking] = useState<string | null>(null);

  const roomLinkedRepo = linkedRepos?.find(r => r.linked_room_id === roomId);

  useEffect(() => {
    if (open && githubAccount) {
      loadGithubRepos();
    }
  }, [open, githubAccount]);

  const loadGithubRepos = async () => {
    setLoadingRepos(true);
    try {
      // For MVP, we would normally call an Edge Function here.
      // e.g., const { data } = await supabase.functions.invoke('github-api', { body: { action: 'list_repos' } });
      // Since edge functions might not be deployed yet, we simulate fetching repos.
      // In a real implementation, this hits api.github.com/user/repos
      
      // Simulating network delay and dummy data
      await new Promise(r => setTimeout(r, 800));
      setRepos([
        { id: '123456', name: 'patchwork-web', full_name: 'builder/patchwork-web', private: false },
        { id: '789012', name: 'patchwork-api', full_name: 'builder/patchwork-api', private: false },
        { id: '345678', name: 'my-awesome-project', full_name: 'builder/my-awesome-project', private: false }
      ]);
    } catch (err: any) {
      toast.error('Failed to load repositories');
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleLinkRepo = async (repo: any) => {
    setLinking(repo.id);
    try {
      // 1. In a real implementation, call Edge Function to register webhook with GitHub
      // await supabase.functions.invoke('github-api', { body: { action: 'create_webhook', repo_full_name: repo.full_name, room_id: roomId } });
      
      // 2. Save to database
      const { error } = await supabase.from('repositories').upsert({
        github_repo_id: repo.id,
        github_repo_name: repo.full_name,
        github_owner: repo.full_name.split('/')[0],
        is_public: !repo.private,
        linked_room_id: roomId,
        linked_user_id: userId
      }, { onConflict: 'linked_room_id' });

      if (error) throw error;
      
      toast.success(`Repository ${repo.name} linked successfully!`);
      refetchRepos();
      setOpen(false);
    } catch (err: any) {
      toast.error(`Failed to link repository: ${err.message}`);
    } finally {
      setLinking(null);
    }
  };

  if (accountLoading) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {roomLinkedRepo ? (
           <button className="flex items-center gap-2 px-5 py-2.5 border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] rounded-full text-[13px] font-bold text-white transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]">
             <Github className="w-4 h-4" /> {roomLinkedRepo.github_repo_name.split('/')[1]}
           </button>
        ) : (
          <button className="flex items-center gap-2 px-5 py-2.5 border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] rounded-full text-[13px] font-bold text-white transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B7CF8]">
            <LinkIcon className="w-4 h-4" /> Link Repository
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-32px)] sm:max-w-[500px] bg-[#0A0910] border border-white/[0.08] p-4 sm:p-6 shadow-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-extrabold text-white font-display flex items-center gap-2">
            <Github className="w-5 h-5" /> Link GitHub Repository
          </DialogTitle>
          <DialogDescription className="text-[14px] text-slate-400 font-medium">
            Connect a repository to automatically generate draft updates from your commits.
          </DialogDescription>
        </DialogHeader>

        {!githubAccount ? (
          <div className="py-8 text-center bg-white/[0.02] border border-white/[0.05] rounded-2xl">
            <Github className="w-10 h-10 mx-auto mb-3 text-slate-600" />
            <p className="text-[14px] text-slate-300 mb-4">You need to connect your GitHub account first.</p>
            <button 
              onClick={() => { setOpen(false); /* route to profile or trigger auth */ }}
              className="px-4 py-2 bg-white text-[#0A0910] font-bold text-[13px] rounded-full hover:bg-slate-200 transition-colors"
            >
              Go to Integrations
            </button>
          </div>
        ) : (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {loadingRepos ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-[#8B7CF8]" />
              </div>
            ) : repos.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">No repositories found.</div>
            ) : (
              repos.map(repo => {
                const isLinked = linkedRepos?.some(r => r.github_repo_id === repo.id);
                return (
                  <div key={repo.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl hover:border-white/[0.1] transition-colors">
                    <div>
                      <h4 className="font-bold text-white text-[14px]">{repo.name}</h4>
                      <p className="text-[12px] text-slate-500">{repo.full_name}</p>
                    </div>
                    {isLinked ? (
                      <span className="flex items-center gap-1 text-[12px] font-bold text-emerald-400">
                        <Check className="w-3 h-3" /> Linked
                      </span>
                    ) : (
                      <button
                        onClick={() => handleLinkRepo(repo)}
                        disabled={linking === repo.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8B7CF8]/10 text-[#8B7CF8] hover:bg-[#8B7CF8]/20 rounded-lg text-[12px] font-bold transition-colors disabled:opacity-50"
                      >
                        {linking === repo.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                        Link
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
