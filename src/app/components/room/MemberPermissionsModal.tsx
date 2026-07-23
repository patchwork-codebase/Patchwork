import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, Check, Ticket, FileText, Link2, UserPlus, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateMemberPermissions, RoomMemberPermissions, DEFAULT_PERMISSIONS } from '../../hooks/useRoomPermissions';

interface MemberPermissionsModalProps {
  open: boolean;
  onClose: () => void;
  roomId: string;
  member: {
    id: string;
    name: string;
    avatar?: string | null;
    permissions?: RoomMemberPermissions;
  } | null;
}

export function MemberPermissionsModal({ open, onClose, roomId, member }: MemberPermissionsModalProps) {
  const updatePermissionsMutation = useUpdateMemberPermissions();
  const [perms, setPerms] = useState<RoomMemberPermissions>(DEFAULT_PERMISSIONS);

  useEffect(() => {
    if (member?.permissions) {
      setPerms({ ...DEFAULT_PERMISSIONS, ...member.permissions });
    } else {
      setPerms(DEFAULT_PERMISSIONS);
    }
  }, [member?.id]);

  if (!open || !member) return null;

  const togglePerm = (key: keyof RoomMemberPermissions) => {
    setPerms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    try {
      await updatePermissionsMutation.mutateAsync({
        roomId,
        userId: member.id,
        permissions: perms,
      });
      toast.success(`Permissions updated for ${member.name}`);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update permissions');
    }
  };

  const PERM_ITEMS: { key: keyof RoomMemberPermissions; label: string; desc: string; icon: any }[] = [
    {
      key: 'can_manage_tickets',
      label: 'Manage Tickets & Roadmap',
      desc: 'Create, edit, assign, and organize sprint tickets.',
      icon: <Ticket className="w-4 h-4 text-primary-500" />,
    },
    {
      key: 'can_post_updates',
      label: 'Post Progress Updates',
      desc: 'Share build progress logs and updates in the feed.',
      icon: <FileText className="w-4 h-4 text-emerald-500" />,
    },
    {
      key: 'can_manage_docs',
      label: 'Manage Documents & Integrations',
      desc: 'Link Notion PRDs, Linear roadmaps, and GitHub repos.',
      icon: <Link2 className="w-4 h-4 text-blue-500" />,
    },
    {
      key: 'can_invite_members',
      label: 'Invite New Members',
      desc: 'Send invitations to new team members and collaborators.',
      icon: <UserPlus className="w-4 h-4 text-amber-500" />,
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary-500/10 border border-primary-500/20 text-primary-600 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 font-display">Team Permissions</h3>
                <p className="text-xs text-slate-500 font-medium">Configuring access for <strong className="text-slate-800">{member.name}</strong></p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {PERM_ITEMS.map((item) => {
              const active = perms[item.key];
              return (
                <div
                  key={item.key}
                  onClick={() => togglePerm(item.key)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 select-none ${
                    active
                      ? 'bg-primary-50/40 border-primary-200/80 shadow-xs'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-white border border-slate-200/60 shrink-0 mt-0.5 shadow-xs">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-bold text-slate-900">{item.label}</span>
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                        active ? 'bg-primary-600 text-white' : 'border border-slate-300 bg-white'
                      }`}>
                        {active && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 leading-snug">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updatePermissionsMutation.isPending}
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-primary-600/20 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Save Permissions
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
