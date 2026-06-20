import { useState } from 'react';
import { useRoomTeam, useRevokeInvitation, useResendInvitation, TeamMember, TeamInvitation } from '../../hooks/useRoomTeam';
import { Loader2, User, Mail, ShieldAlert, CheckCircle, Clock, XCircle, RefreshCw, X } from 'lucide-react';
import { VerifiedTick } from '../ui/VerifiedTick';
import { timeAgo, getAvatarUrl } from '../../utils/helpers';
import { motion } from 'motion/react';

interface RoomTeamTabProps {
  roomId: string;
  isBuilder: boolean;
  roomTitle: string;
  builderName: string;
}

export function RoomTeamTab({ roomId, isBuilder, roomTitle, builderName }: RoomTeamTabProps) {
  const { data, isLoading } = useRoomTeam(roomId);
  const revokeMutation = useRevokeInvitation();
  const resendMutation = useResendInvitation();

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
      </div>
    );
  }

  const members = data?.members || [];
  const invitations = data?.invitations || [];

  const handleRevoke = async (inviteId: string) => {
    setActionLoadingId(`revoke-${inviteId}`);
    try {
      await revokeMutation.mutateAsync({ inviteId, roomId });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResend = async (inviteId: string, email: string, role: string) => {
    setActionLoadingId(`resend-${inviteId}`);
    try {
      await resendMutation.mutateAsync({ roomId, email, role, roomTitle, builderName });
    } finally {
      setActionLoadingId(null);
    }
  };

  function getStatusBadge(status: string) {
    switch (status) {
      case 'accepted': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[11px] font-bold"><CheckCircle className="w-3 h-3" /> Accepted</span>;
      case 'pending': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[11px] font-bold"><Clock className="w-3 h-3" /> Pending</span>;
      case 'declined': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-500 text-[11px] font-bold"><XCircle className="w-3 h-3" /> Declined</span>;
      case 'expired': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-500 text-[11px] font-bold"><Clock className="w-3 h-3" /> Expired</span>;
      case 'revoked': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-500 text-[11px] font-bold"><X className="w-3 h-3" /> Revoked</span>;
      default: return <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold capitalize">{status}</span>;
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* ACTIVE MEMBERS SECTION */}
      <section className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 bg-primary-500/5 rounded-full blur-[50px] pointer-events-none" />
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[18px] font-extrabold text-slate-900 font-display leading-tight">Active Team Members</h2>
            <p className="text-[13px] text-slate-500 font-medium">People who have joined this room</p>
          </div>
        </div>

        {members.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 border border-slate-100 rounded-xl">
            <p className="text-[14px] text-slate-500 font-medium">No active team members yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map(member => (
              <div key={member.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:border-slate-200 transition-colors">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                  <img src={member.avatar || getAvatarUrl(member.id)} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[14px] text-slate-900 truncate flex items-center gap-1.5">
                    {member.name}
                    <VerifiedTick isVerified={member.is_verified_expert} className="w-4 h-4" />
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-mono font-bold uppercase text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {member.role}
                    </span>
                    {member.domain && (
                      <span className="text-[11px] font-mono font-bold uppercase text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded truncate">
                        {member.domain}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* INVITATIONS SECTION (Only for builders or if invitations exist) */}
      {(isBuilder || invitations.length > 0) && (
        <section className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[18px] font-extrabold text-slate-900 font-display leading-tight">Invitations</h2>
              <p className="text-[13px] text-slate-500 font-medium">Manage pending and past invitations</p>
            </div>
          </div>

          {invitations.length === 0 ? (
             <div className="text-center py-10 bg-slate-50 border border-slate-100 rounded-xl">
             <p className="text-[14px] text-slate-500 font-medium">No invitations have been sent yet.</p>
           </div>
          ) : (
            <div className="space-y-3">
              {invitations.map(invite => (
                <div key={invite.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                      <Mail className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[14px] text-slate-900">{invite.email}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-mono font-bold uppercase text-slate-500">{invite.role}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] text-slate-500 font-medium">Invited {timeAgo(invite.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 self-start sm:self-center">
                    {getStatusBadge(invite.status)}

                    {isBuilder && (invite.status === 'pending' || invite.status === 'expired') && (
                      <div className="flex items-center gap-2 ml-2">
                        <button
                          onClick={() => handleResend(invite.id, invite.email, invite.role)}
                          disabled={actionLoadingId === `resend-${invite.id}`}
                          className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-primary-500 hover:border-primary-200 transition-colors disabled:opacity-50"
                          title="Resend Invitation"
                        >
                          {actionLoadingId === `resend-${invite.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleRevoke(invite.id)}
                          disabled={actionLoadingId === `revoke-${invite.id}`}
                          className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-rose-500 hover:border-rose-200 transition-colors disabled:opacity-50"
                          title="Revoke Invitation"
                        >
                          {actionLoadingId === `revoke-${invite.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

    </div>
  );
}
