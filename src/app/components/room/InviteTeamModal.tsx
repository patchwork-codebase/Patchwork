import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, Mail, User, Loader2, UserPlus, ShieldCheck, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { Room } from "../../types";
import { usePendingInvites } from "../../hooks/usePendingInvites";

interface InviteTeamModalProps {
  open: boolean;
  onClose: () => void;
  room: Room;
}

export function InviteTeamModal({ open, onClose, room }: InviteTeamModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<'observer' | 'team_member' | 'expert'>('team_member');
  
  const { 
    invites, 
    isFetching, 
    inviteUser, 
    isInviting, 
    revokeInvite, 
    resendInvite,
    isResending 
  } = usePendingInvites(open ? room.id : '');

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }
    inviteUser({ email, role }, {
      onSuccess: () => setEmail("")
    });
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
        <div className="p-6 md:p-8 border-b border-slate-100 shrink-0 bg-white relative z-20">
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
              <div className="w-full">
                <label htmlFor="invite-email" className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-2">Email Address</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:border-primary-400 focus-within:ring-1 focus-within:ring-primary-400 transition-all">
                  <div className="pl-4 pr-2 text-slate-400 flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="invite-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className="w-full py-3 pr-4 bg-transparent text-[14px] text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-2">Role</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('team_member')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                      role === 'team_member' ? 'border-primary-400 bg-primary-400/5 text-primary-400' : 'border-slate-100 hover:border-slate-200 text-slate-600'
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5 mb-1" />
                    <span className="text-[12px] font-bold">Team Member</span>
                    <span className="text-[10px] text-center mt-1 opacity-70">Can build & edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('expert')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                      role === 'expert' ? 'border-amber-500 bg-amber-50 text-amber-600' : 'border-slate-100 hover:border-slate-200 text-slate-600'
                    }`}
                  >
                    <UserPlus className="w-5 h-5 mb-1" />
                    <span className="text-[12px] font-bold">Expert</span>
                    <span className="text-[10px] text-center mt-1 opacity-70">Invited consultant</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('observer')}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                      role === 'observer' ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-100 hover:border-slate-200 text-slate-600'
                    }`}
                  >
                    <User className="w-5 h-5 mb-1" />
                    <span className="text-[12px] font-bold">Observer</span>
                    <span className="text-[10px] text-center mt-1 opacity-70">View & react only</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isInviting || !email.trim()}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary-400 hover:bg-[#7b6ce8] text-white text-[14px] font-bold rounded-xl transition-all shadow-lg shadow-primary-400/20 disabled:opacity-50 mt-2"
              >
                {isInviting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Invitation
              </button>
            </div>
          </form>

          <div>
            <h3 className="text-[13px] font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">Pending Invitations</h3>
            {isFetching ? (
              <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
            ) : invites.length === 0 ? (
              <p className="text-[13px] text-slate-500 italic">No pending invitations.</p>
            ) : (
              <div className="space-y-3">
                {invites.map(invite => (
                  <div key={invite.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <div>
                      <p className="text-[13px] font-bold text-slate-700">{invite.email}</p>
                      <p className="text-[11px] text-slate-500 capitalize">{invite.role.replace('_', ' ')}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => resendInvite({ email: invite.email, role: invite.role })}
                        disabled={isResending}
                        className="p-1.5 text-slate-400 hover:text-primary-500 hover:bg-primary-50 rounded-md transition-colors"
                        title="Resend Invite"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => revokeInvite(invite.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Revoke Invite"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
