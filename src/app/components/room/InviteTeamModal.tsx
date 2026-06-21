import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, Mail, User, Loader2, UserPlus, ShieldCheck, Trash2 } from "lucide-react";
import { supabase } from "../auth/AuthContext";
import { toast } from "sonner";
import type { Room } from "../../types";

interface InviteTeamModalProps {
  open: boolean;
  onClose: () => void;
  room: Room;
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

export function InviteTeamModal({ open, onClose, room }: InviteTeamModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<'observer' | 'collaborator'>('collaborator');
  const [loading, setLoading] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [fetchingInvites, setFetchingInvites] = useState(false);

  useEffect(() => {
    if (open) {
      fetchInvites();
    }
  }, [open]);

  const fetchInvites = async () => {
    setFetchingInvites(true);
    try {
      const { data, error } = await supabase
        .from('room_invitations')
        .select('id, email, role, status, created_at')
        .eq('room_id', room.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingInvites(data || []);
    } catch (err: unknown) {
      console.error("Error fetching invites:", err);
    } finally {
      setFetchingInvites(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const { data: token, error } = await supabase.rpc('invite_user_to_room', {
        p_room_id: room.id,
        p_email: email.trim().toLowerCase(),
        p_role: role
      });

      if (error) throw error;

      // Manually invoke the edge function to send the email
      await supabase.functions.invoke('room-invitations', {
        body: {
          record: {
            email: email.trim().toLowerCase(),
            room_id: room.id,
            role: role,
            token: token,
            origin: window.location.origin
          }
        }
      });

      toast.success(`Invitation sent to ${email}`);
      setEmail("");
      fetchInvites();
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      const { error } = await supabase
        .from('room_invitations')
        .update({ status: 'revoked' })
        .eq('id', id);

      if (error) throw error;
      toast.success("Invitation revoked");
      fetchInvites();
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "Failed to revoke invitation");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 md:p-8 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-primary-400/10 rounded-xl flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary-400" />
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors focus-ring"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          <h2 className="text-[24px] font-extrabold text-slate-900 font-display">Invite to Team</h2>
          <p className="text-[14px] text-slate-500 mt-1">Invite members to collaborate on {room.title}.</p>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto">
          <form onSubmit={handleInvite} className="mb-8">
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] focus:outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-2">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('collaborator')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                      role === 'collaborator' ? 'border-primary-400 bg-primary-400/5 text-primary-400' : 'border-slate-100 hover:border-slate-200 text-slate-600'
                    }`}
                  >
                    <ShieldCheck className="w-6 h-6 mb-2" />
                    <span className="text-[13px] font-bold">Collaborator</span>
                    <span className="text-[11px] text-center mt-1 opacity-70">Can post updates and edit settings</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('observer')}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                      role === 'observer' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-100 hover:border-slate-200 text-slate-600'
                    }`}
                  >
                    <User className="w-6 h-6 mb-2" />
                    <span className="text-[13px] font-bold">Observer</span>
                    <span className="text-[11px] text-center mt-1 opacity-70">Can only view and react</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary-400 hover:bg-[#7b6ce8] text-white text-[14px] font-bold rounded-xl transition-all shadow-lg shadow-primary-400/20 disabled:opacity-50 mt-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Invitation
              </button>
            </div>
          </form>

          <div>
            <h3 className="text-[13px] font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Pending Invitations</h3>
            {fetchingInvites ? (
              <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
            ) : pendingInvites.length === 0 ? (
              <p className="text-[13px] text-slate-500 italic">No pending invitations.</p>
            ) : (
              <div className="space-y-3">
                {pendingInvites.map(invite => (
                  <div key={invite.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <div>
                      <p className="text-[13px] font-bold text-slate-700">{invite.email}</p>
                      <p className="text-[11px] text-slate-500 capitalize">{invite.role}</p>
                    </div>
                    <button
                      onClick={() => handleRevoke(invite.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      title="Revoke Invite"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
