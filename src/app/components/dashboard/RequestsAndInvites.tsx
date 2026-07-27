import { useEffect, useState } from "react";
import { supabase, useAuth } from "../auth/AuthContext";
import { toast } from "sonner";
import { Check, X, Loader2, UserPlus, Inbox } from "lucide-react";
import { timeAgo } from "../../utils/helpers";
import { Link } from "react-router";

export function RequestsAndInvites() {
  const { user } = useAuth();
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch incoming join requests for builder's rooms
      const { data: requestsData, error: requestsError } = await supabase
        .from('room_join_requests')
        .select(`
          id, status, created_at,
          room_id,
          rooms:room_id (title),
          user_id,
          users:user_id (email)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;
      
      // Filter out requests where the current user is not the builder 
      // (RLS should handle this, but just to be safe if RLS allows more)
      setJoinRequests(requestsData || []);

      // Fetch invitations sent to this user
      const { data: invitesData, error: invitesError } = await supabase
        .from('room_invitations')
        .select(`
          id, status, created_at, role, token,
          room_id,
          rooms:room_id (title, builder_name)
        `)
        .eq('email', user?.email)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (invitesError) throw invitesError;
      setInvitations(invitesData || []);

    } catch (err: unknown) {
      console.error("Error fetching requests/invites:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewRequest = async (requestId: string, status: 'approved' | 'declined') => {
    setActionLoading(requestId);
    try {
      const { error } = await supabase.rpc('review_join_request', {
        p_request_id: requestId,
        p_status: status
      });
      if (error) throw error;
      toast.success(`Request ${status}`);
      fetchData();
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "Failed to process request");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptInvite = async (token: string, inviteId: string) => {
    setActionLoading(inviteId);
    try {
      const { error } = await supabase.rpc('accept_room_invitation', {
        p_token: token
      });
      if (error) throw error;
      toast.success("Invitation accepted! You can now access the room.");
      fetchData();
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "Failed to accept invitation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineInvite = async (inviteId: string) => {
    setActionLoading(inviteId);
    try {
      const { error } = await supabase
        .from('room_invitations')
        .update({ status: 'declined' })
        .eq('id', inviteId);
      if (error) throw error;
      toast.success("Invitation declined");
      fetchData();
    } catch (err: unknown) {
      toast.error("Failed to decline invitation");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (joinRequests.length === 0 && invitations.length === 0) {
    return null; // Don't show the widget if there's nothing to action
  }

  return (
    <div className="bg-[#111111] border border-white/10 rounded-[20px] overflow-hidden shadow-sm mb-6">
      <div className="bg-white/5 border-b border-white/10 px-5 py-4">
        <h2 className="text-[15px] font-bold text-white flex items-center gap-2">
          <Inbox className="w-4 h-4 text-primary-400" /> Pending Requests & Invites
        </h2>
      </div>
      
      <div className="divide-y divide-white/10">
        {joinRequests.map(req => (
          <div key={req.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-white/5">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-1 sm:mt-0">
                <UserPlus className="w-5 h-5 text-amber-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] sm:text-[14px] text-white leading-snug">
                  <span className="font-bold">{req.users?.email || 'Someone'}</span> wants to join <Link to={`/dashboard/room/${req.room_id}`} className="font-bold hover:underline">{req.rooms?.title}</Link>
                </p>
                <p className="text-[12px] text-slate-400 font-mono mt-1">{timeAgo(req.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 sm:self-auto self-end">
              <button
                onClick={() => handleReviewRequest(req.id, 'declined')}
                disabled={actionLoading === req.id}
                className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                title="Decline"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleReviewRequest(req.id, 'approved')}
                disabled={actionLoading === req.id}
                className="w-8 h-8 rounded-full border border-primary-400/30 bg-primary-400/10 flex items-center justify-center text-primary-400 hover:bg-primary-400 hover:text-white transition-colors disabled:opacity-50"
                title="Approve"
              >
                {actionLoading === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}

        {invitations.map(inv => (
          <div key={inv.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:bg-white/5">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary-400/10 flex items-center justify-center shrink-0 mt-1 sm:mt-0">
                <span className="text-[18px]">💌</span>
              </div>
              <div className="min-w-0">
                <p className="text-[13px] sm:text-[14px] text-white leading-snug">
                  <span className="font-bold truncate inline-block max-w-full align-bottom">{inv.rooms?.builder_name}</span> invited you to collaborate on <span className="font-bold">{inv.rooms?.title}</span>
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-slate-400">Role: {inv.role}</span>
                  <span className="text-[12px] text-slate-400 font-mono">{timeAgo(inv.created_at)}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 sm:self-auto self-end">
              <button
                onClick={() => handleDeclineInvite(inv.id)}
                disabled={actionLoading === inv.id}
                className="px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:bg-white/10 text-[12px] font-bold transition-colors disabled:opacity-50"
              >
                Decline
              </button>
              <button
                onClick={() => handleAcceptInvite(inv.token, inv.id)}
                disabled={actionLoading === inv.id}
                className="px-3 py-1.5 rounded-lg bg-primary-400 hover:bg-[#7b6ce8] text-white text-[12px] font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {actionLoading === inv.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Accept
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
