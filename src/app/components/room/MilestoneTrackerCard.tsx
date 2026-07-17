import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, ArrowRight, Clock, AlertCircle, MessageCircle, Send, Smile } from "lucide-react";
import { InlineEmojiPicker } from "../ui/InlineEmojiPicker";
import { toast } from "sonner";
import { supabase, useAuth } from "../auth/AuthContext";
import { timeAgo } from '../../utils/helpers';
import { UserAvatar } from '../ui/UserAvatar';
import { fireConfetti } from "../ui/Confetti";
import { useQuery } from "@tanstack/react-query";

interface Milestone {
  id: string;
  title: string;
  description?: string;
  status: 'done' | 'active' | 'review' | 'planned' | 'blocked';
}

const STATUS_STYLES: Record<string, any> = {
  done: { icon: CheckCircle, iconColor: "text-emerald-500", badgeBg: "bg-emerald-500/10", badgeText: "text-emerald-600", badgeBorder: "border-emerald-500/20" },
  active: { icon: ArrowRight, iconColor: "text-amber-500", badgeBg: "bg-amber-500/10", badgeText: "text-amber-600", badgeBorder: "border-amber-500/20" },
  review: { icon: ArrowRight, iconColor: "text-amber-500", badgeBg: "bg-amber-500/10", badgeText: "text-amber-600", badgeBorder: "border-amber-500/20" },
  planned: { icon: Clock, iconColor: "text-slate-400", badgeBg: "bg-slate-100", badgeText: "text-slate-500", badgeBorder: "border-slate-200" },
  blocked: { icon: AlertCircle, iconColor: "text-rose-400", badgeBg: "bg-rose-500/10", badgeText: "text-rose-500", badgeBorder: "border-rose-500/20" },
};

function mapLinearStateToStatus(stateName: string): 'done' | 'active' | 'review' | 'planned' | 'blocked' {
  const lower = stateName.toLowerCase();
  if (lower.includes('done') || lower.includes('completed') || lower.includes('canceled')) return 'done';
  if (lower.includes('progress') || lower.includes('doing') || lower.includes('active')) return 'active';
  if (lower.includes('review')) return 'review';
  if (lower.includes('blocked') || lower.includes('stuck')) return 'blocked';
  return 'planned';
}

interface MilestoneTrackerCardProps {
  roomId: string;
  user: any;
  reactions: any[];
  queryClient: any;
  isNested?: boolean;
}

export function MilestoneTrackerCard({ roomId, user, reactions = [], queryClient, isNested = false }: MilestoneTrackerCardProps) {
  const { profile } = useAuth();
  const isObserver = profile?.role === 'observer';
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const navigate = useNavigate();

  const { data: dbMilestones = [] } = useQuery({
    queryKey: ['linear-issues', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('linear_issues')
        .select('*')
        .eq('room_id', roomId)
        .order('updated_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching linear issues:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!roomId,
  });

  const { data: dbClickUp = [] } = useQuery({
    queryKey: ['clickup-issues', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clickup_issues')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false });
      if (error) return [];
      return data || [];
    },
    enabled: !!roomId,
  });

  const { data: dbJira = [] } = useQuery({
    queryKey: ['jira-issues', roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jira_issues')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false });
      if (error) return [];
      return data || [];
    },
    enabled: !!roomId,
  });

  // Real-time listener for linear issues
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`linear-issues-${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'linear_issues', filter: `room_id=eq.${roomId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['linear-issues', roomId] });
        }
      )
      .subscribe();

    const channel2 = supabase
      .channel(`clickup-issues-${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clickup_issues', filter: `room_id=eq.${roomId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['clickup-issues', roomId] });
      }).subscribe();

    const channel3 = supabase
      .channel(`jira-issues-${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jira_issues', filter: `room_id=eq.${roomId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['jira-issues', roomId] });
      }).subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(channel2);
      supabase.removeChannel(channel3);
    };
  }, [roomId, queryClient]);

  const linearMilestones = dbMilestones.map(issue => ({
    id: issue.id,
    title: issue.title,
    description: issue.description || '',
    status: mapLinearStateToStatus(issue.state),
    originalState: issue.state,
    url: issue.url,
    source: 'Linear'
  }));

  const clickUpMilestones = dbClickUp.map(issue => ({
    id: issue.id,
    title: issue.title,
    description: '',
    status: mapLinearStateToStatus(issue.state),
    originalState: issue.state,
    url: issue.url,
    source: 'ClickUp'
  }));

  const jiraMilestones = dbJira.map(issue => ({
    id: issue.id,
    title: issue.title,
    description: '',
    status: mapLinearStateToStatus(issue.state),
    originalState: issue.state,
    url: issue.url,
    source: 'Jira'
  }));

  const allMilestones = [...linearMilestones, ...clickUpMilestones, ...jiraMilestones].sort((a, b) => a.status === 'done' ? 1 : -1);

  const previousDoneCount = useRef(0);
  // Initialize previous count on first mount with actual data, to avoid confetti on page load
  useEffect(() => {
    previousDoneCount.current = allMilestones.filter(m => m.status === 'done').length;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbMilestones.length, dbClickUp.length, dbJira.length]);

  useEffect(() => {
    const currentDoneCount = allMilestones.filter(m => m.status === 'done').length;
    if (currentDoneCount > previousDoneCount.current && previousDoneCount.current > 0) {
      fireConfetti();
    }
    if (currentDoneCount !== previousDoneCount.current && allMilestones.length > 0) {
      previousDoneCount.current = currentDoneCount;
    }
  }, [allMilestones]);

  const handleSync = async () => {
    if (isObserver) return;
    setIsSyncing(true);
    try {
      const { data: linearAccount, error: accError } = await supabase
        .from('linear_accounts')
        .select('access_token')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (accError || !linearAccount || !linearAccount.access_token) {
        toast.error('Linear account not connected.');
        setIsSyncing(false);
        return;
      }

      const linearRes = await fetch('/linear-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': linearAccount.access_token
        },
        body: JSON.stringify({
          query: `
            query {
              issues(first: 20, filter: { assignee: { isMe: { eq: true } } }, orderBy: updatedAt) {
                nodes {
                  id
                  title
                  description
                  url
                  state {
                    name
                  }
                }
              }
            }
          `
        })
      });

      if (!linearRes.ok) throw new Error('Failed to fetch from Linear API');

      const linearData = await linearRes.json();
      if (linearData.errors) throw new Error('Linear API returned errors');

      const issues = linearData.data?.issues?.nodes || [];
      const upserts = issues.map((issue: any) => ({
        room_id: roomId,
        linear_issue_id: issue.id,
        title: issue.title,
        description: issue.description || '',
        state: issue.state?.name || 'Todo',
        url: issue.url
      }));

      if (upserts.length > 0) {
        const { error: upsertError } = await supabase
          .from('linear_issues')
          .upsert(upserts, { onConflict: 'room_id,linear_issue_id' });
        
        if (upsertError) throw new Error(upsertError.message);
      }

      toast.success(`Successfully synced ${upserts.length} issues from Linear!`);
      queryClient.invalidateQueries({ queryKey: ['linear-issues', roomId] });
    } catch (err: unknown) {
      toast.error(`Linear sync failed: ${(err instanceof Error ? err.message : String(err))}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncClickUp = async () => {
    if (isObserver) return;
    setIsSyncing(true);
    try {
      const { data: clickupAccount, error: accError } = await supabase
        .from('clickup_accounts')
        .select('access_token')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (accError || !clickupAccount || !clickupAccount.access_token) {
        toast.error('ClickUp account not connected.');
        return;
      }

      const clickupRes = await fetch('/clickup-api/team', {
        headers: { 'Authorization': clickupAccount.access_token }
      });
      if (!clickupRes.ok) throw new Error('Failed to fetch from ClickUp API');
      const teamsData = await clickupRes.json();
      const teamId = teamsData.teams?.[0]?.id;
      if (!teamId) throw new Error('No ClickUp team found');

      const tasksRes = await fetch(`/clickup-api/team/${teamId}/task?subtasks=true`, {
        headers: { 'Authorization': clickupAccount.access_token }
      });
      if (!tasksRes.ok) throw new Error('Failed to fetch tasks');
      const tasksData = await tasksRes.json();
      
      const upserts = (tasksData.tasks || []).map((task: any) => ({
        room_id: roomId,
        clickup_task_id: task.id,
        title: task.name,
        state: task.status?.status || 'Open',
        url: task.url
      }));

      if (upserts.length > 0) {
        const { error: upsertError } = await supabase.from('clickup_issues').upsert(upserts, { onConflict: 'room_id,clickup_task_id' });
        if (upsertError) throw new Error(upsertError.message);
      }
      toast.success(`Synced ${upserts.length} tasks from ClickUp!`);
      queryClient.invalidateQueries({ queryKey: ['clickup-issues', roomId] });
    } catch (err: unknown) {
      toast.error(`ClickUp sync failed: ${(err instanceof Error ? err.message : String(err))}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncJira = async () => {
    if (isObserver) return;
    setIsSyncing(true);
    try {
      const { data: jiraAccount, error: accError } = await supabase
        .from('jira_accounts')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (accError || !jiraAccount || !jiraAccount.access_token || !jiraAccount.jira_domain) {
        toast.error('Jira account not connected properly.');
        return;
      }

      const jql = encodeURIComponent('assignee=currentUser() ORDER BY updated DESC');
      const authHeader = 'Basic ' + btoa(`${jiraAccount.email}:${jiraAccount.access_token}`);
      
      const jiraRes = await fetch(`/jira-api/rest/api/3/search?jql=${jql}&maxResults=20`, {
        headers: { 
          'Authorization': authHeader,
          'Accept': 'application/json',
          'x-jira-domain': jiraAccount.jira_domain
        }
      });
      if (!jiraRes.ok) throw new Error('Failed to fetch from Jira API');
      const jiraData = await jiraRes.json();
      
      const upserts = (jiraData.issues || []).map((issue: any) => ({
        room_id: roomId,
        jira_issue_key: issue.key,
        title: issue.fields?.summary || issue.key,
        state: issue.fields?.status?.name || 'To Do',
        url: `https://${jiraAccount.jira_domain}/browse/${issue.key}`
      }));

      if (upserts.length > 0) {
        const { error: upsertError } = await supabase.from('jira_issues').upsert(upserts, { onConflict: 'room_id,jira_issue_key' });
        if (upsertError) throw new Error(upsertError.message);
      }
      toast.success(`Synced ${upserts.length} issues from Jira!`);
      queryClient.invalidateQueries({ queryKey: ['jira-issues', roomId] });
    } catch (err: unknown) {
      toast.error(`Jira sync failed: ${(err instanceof Error ? err.message : String(err))}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleReaction = async (itemId: string, type: string) => {
    if (!user) return;
    const existing = reactions.find(r => (r.update_id === itemId || r.updateId === itemId) && r.type === type && (r.observer_id === user.id || r.observerId === user.id));
    
    try {
      if (existing) {
        await supabase.from('reactions').delete().eq('id', existing.id);
      } else {
        await supabase.from('reactions').insert({
          id: `${roomId}-reaction-${type}-${user.id}-${Date.now()}`,
          room_id: roomId,
          update_id: itemId,
          observer_id: user.id,
          observer_name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Observer',
          type: type,
          text: '',
          created_at: new Date().toISOString()
        });
      }
      queryClient.invalidateQueries({ queryKey: ["room-details", roomId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    } catch (err: unknown) {
      toast.error(`Reaction failed: ${(err instanceof Error ? err.message : String(err))}`);
    }
  };

  const submitReply = async (itemId: string) => {
    if (!replyText.trim() || !user) return;
    
    try {
      const { error } = await supabase.from('reactions').insert({
        id: `${roomId}-reply-${itemId}-${user.id}-${Date.now()}`,
        room_id: roomId,
        update_id: itemId,
        observer_id: user.id,
        observer_name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Observer',
        type: 'reply',
        text: replyText.trim(),
        created_at: new Date().toISOString()
      });

      if (error) throw error;
      
      toast.success("Reply posted!");
      await queryClient.invalidateQueries({ queryKey: ["room-details", roomId] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setReplyText('');
      setReplyingTo(null);
      setShowEmojiPicker(false);
    } catch (err: unknown) {
      toast.error(`Failed to post reply: ${(err instanceof Error ? err.message : String(err))}`);
    }
  };

  return (
    <div className={isNested ? "flex flex-col h-full" : "bg-white rounded-[24px] border border-slate-200 overflow-hidden flex flex-col h-[500px] shadow-sm"}>
      {!isNested && (
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 shrink-0 bg-white">
          <div>
            <h3 className="text-[16px] font-extrabold text-slate-900 leading-tight">
              Milestone tracker
            </h3>
            <span className="text-[12px] text-slate-500 font-medium">Synced with Integrations</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {!isObserver && (
              <>
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-full font-bold text-[11px] transition-colors flex items-center gap-1.5 active:scale-95 disabled:opacity-50 whitespace-nowrap"
                >
                  Linear
                </button>
                <button
                  onClick={handleSyncClickUp}
                  disabled={isSyncing}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-full font-bold text-[11px] transition-colors flex items-center gap-1.5 active:scale-95 disabled:opacity-50 whitespace-nowrap"
                >
                  ClickUp
                </button>
                <button
                  onClick={handleSyncJira}
                  disabled={isSyncing}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-full font-bold text-[11px] transition-colors flex items-center gap-1.5 active:scale-95 disabled:opacity-50 whitespace-nowrap"
                >
                  Jira
                </button>
              </>
            )}
            <div className="flex items-center gap-1.5 ml-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap shrink-0">
              <span className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
              <span className="hidden sm:inline">Active</span>
            </div>
          </div>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto scrollbar-hide ${isNested ? 'p-1 space-y-0' : 'p-5 space-y-0'}`}>
        <div className="space-y-4">
          {allMilestones.length === 0 ? (
            <div className="text-center py-8">
              <p className={`text-[13px] font-medium ${isNested ? 'text-slate-500' : 'text-slate-500'}`}>No milestones tracked yet.</p>
            </div>
          ) : (
            allMilestones.map((milestone, index) => {
              const style = STATUS_STYLES[milestone.status] || STATUS_STYLES.planned;
              const Icon = style.icon;
              const itemReactions = reactions.filter(r => r.update_id === milestone.id || r.updateId === milestone.id);
              const itemReplies = itemReactions.filter(r => r.type === 'reply' || r.text);
              
              const sharpCount = itemReactions.filter(r => r.type === 'sharp').length;
              const pushbackCount = itemReactions.filter(r => r.type === 'pushback').length;
              
              const hasSharp = itemReactions.some(r => r.type === 'sharp' && (r.observer_id === user?.id || r.observerId === user?.id));
              const hasPushback = itemReactions.some(r => r.type === 'pushback' && (r.observer_id === user?.id || r.observerId === user?.id));

              return (
                <div key={milestone.id} className={`pb-5 ${index !== allMilestones.length - 1 ? `border-b ${isNested ? 'border-slate-200' : 'border-white/[0.08]'} mb-5` : ''}`}>
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${isNested ? 'border-slate-200 bg-slate-100' : 'border-white/[0.08] bg-ink'}`}>
                        <Icon className={`w-3.5 h-3.5 ${style.iconColor}`} />
                      </div>
                      <div>
                        <h4 className={`text-[14px] font-bold leading-tight ${isNested ? 'text-slate-900' : 'text-white'}`}>{milestone.title}</h4>
                        {milestone.description && (
                          <p className={`text-[12px] mt-0.5 ${isNested ? 'text-slate-500' : 'text-slate-400'}`}>{milestone.description}</p>
                        )}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${style.badgeBg} ${style.badgeText} ${style.badgeBorder} whitespace-nowrap`}>
                      {milestone.originalState || milestone.status}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-2">
                    <button 
                      onClick={() => toggleReaction(milestone.id, 'sharp')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold border transition-all ${hasSharp ? 'bg-primary-400/10 text-primary-400 border-primary-400/30' : `bg-transparent border-slate-200 ${isNested ? 'text-slate-500 hover:text-slate-900 hover:border-slate-400' : 'text-slate-400 border-white/10 hover:border-white/20 hover:text-white'}`}`}
                    >
                      <span>✦</span> Sharp {sharpCount > 0 && <span className="opacity-70">{sharpCount}</span>}
                    </button>
                    <button 
                      onClick={() => toggleReaction(milestone.id, 'pushback')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold border transition-all ${hasPushback ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' : `bg-transparent border-slate-200 ${isNested ? 'text-slate-500 hover:text-slate-900 hover:border-slate-400' : 'text-slate-400 border-white/10 hover:border-white/20 hover:text-white'}`}`}
                    >
                      <span>↩</span> Push back {pushbackCount > 0 && <span className="opacity-70">{pushbackCount}</span>}
                    </button>
                    
                    <div className="flex-1" />
                    
                    <button 
                      onClick={() => setReplyingTo(replyingTo === milestone.id ? null : milestone.id)}
                      className={`flex items-center gap-1.5 text-[12px] font-bold transition-colors ${isNested ? 'text-slate-400 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> 
                      {itemReplies.length} {itemReplies.length === 1 ? 'Reply' : 'Replies'}
                    </button>
                  </div>

                  <AnimatePresence>
                    {itemReplies.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 space-y-3 px-2"
                      >
                        {itemReplies.map((reply: any) => (
                          <div key={reply.id} className={`flex items-start gap-3 p-3 rounded-2xl border ${isNested ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/[0.05]'}`}>
                            <UserAvatar 
                              userId={reply.observer_id || reply.observerId} 
                              name={reply.observerName} 
                              avatarUrl={reply.observerAvatar} 
                              className="w-6 h-6 rounded-full shrink-0 cursor-pointer hover:ring-2 hover:ring-primary-400 transition-all object-cover" 
                            />
                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={`text-[12px] font-bold ${isNested ? 'text-slate-900' : 'text-white'}`}>Observer</span>
                                <span className="text-[10px] text-slate-500">{timeAgo(reply.created_at || reply.createdAt)}</span>
                              </div>
                              <p className={`text-[13px] ${isNested ? 'text-slate-600' : 'text-slate-300'}`}>{reply.text}</p>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}

                    {replyingTo === milestone.id && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="mt-4 p-3 bg-[#110F1A] border border-primary-400/30 rounded-2xl relative mx-2"
                      >
                        <textarea
                          ref={replyTextareaRef}
                          autoFocus
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write your reply..."
                          className="w-full bg-transparent border-none focus:ring-0 text-[13px] text-white placeholder-slate-500 resize-none h-16 focus-visible:outline-none"
                        />
                        <InlineEmojiPicker
                          isOpen={showEmojiPicker}
                          className="px-1 py-2 bg-transparent border-t border-white/5"
                          buttonClassName="w-8 h-8 rounded-full hover:bg-white/10"
                          onEmojiSelect={(emoji) => {
                            setReplyText(prev => prev + emoji);
                            replyTextareaRef.current?.focus();
                          }}
                        />
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                          <button 
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                            className={`p-1.5 rounded transition-colors ${showEmojiPicker ? 'text-primary-400 bg-primary-500/20' : 'text-slate-400 hover:text-white hover:bg-white/10'}`} 
                            title="Emoji"
                          >
                            <Smile className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => submitReply(milestone.id)}
                            disabled={!replyText.trim()}
                            className="px-4 py-1.5 bg-primary-400 hover:bg-[#7a6ce0] disabled:bg-slate-700 disabled:text-slate-400 text-white text-[12px] font-bold rounded-full transition-colors flex items-center gap-1.5 focus-ring"
                          >
                            <Send className="w-3.5 h-3.5" /> Send
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
