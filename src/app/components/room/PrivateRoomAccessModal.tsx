import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Copy, RefreshCw, Lock, Link as LinkIcon, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useRegenerateInviteToken, useUpdateRoomAccess } from "../../hooks/useRooms";
import type { Room } from "../../types";

interface PrivateRoomAccessModalProps {
  open: boolean;
  onClose: () => void;
  room: Room;
}

export function PrivateRoomAccessModal({ open, onClose, room }: PrivateRoomAccessModalProps) {
  const [domainInput, setDomainInput] = useState("");
  
  const regenerateTokenMutation = useRegenerateInviteToken();
  const updateAccessMutation = useUpdateRoomAccess();

  if (!open) return null;

  const inviteLink = room?.inviteToken 
    ? `${window.location.origin}/room/${room.id}?invite=${room.inviteToken}`
    : null;

  const handleCopyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast.success("Invite link copied to clipboard!");
    }
  };

  const handleRegenerateToken = () => {
    if (window.confirm("Are you sure? Anyone using the old link will lose access.")) {
      regenerateTokenMutation.mutate(room.id, {
        onSuccess: () => toast.success("New invite link generated!"),
        onError: (err: any) => toast.error(`Failed to regenerate token: ${(err instanceof Error ? err.message : String(err))}`)
      });
    }
  };

  const handleAddDomain = () => {
    const domain = domainInput.trim().toLowerCase();
    if (!domain) return;
    
    // Basic domain validation
    if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)) {
      toast.error("Please enter a valid domain (e.g., acme.com)");
      return;
    }

    const currentDomains = room.whitelistedDomains || [];
    if (currentDomains.includes(domain)) {
      toast.error("Domain is already whitelisted");
      return;
    }

    const newDomains = [...currentDomains, domain];
    updateAccessMutation.mutate({ roomId: room.id, whitelistedDomains: newDomains }, {
      onSuccess: () => {
        setDomainInput("");
        toast.success("Domain added!");
      },
      onError: (err: any) => toast.error(`Failed to add domain: ${(err instanceof Error ? err.message : String(err))}`)
    });
  };

  const handleRemoveDomain = (domainToRemove: string) => {
    const currentDomains = room.whitelistedDomains || [];
    const newDomains = currentDomains.filter((d: string) => d !== domainToRemove);
    
    updateAccessMutation.mutate({ roomId: room.id, whitelistedDomains: newDomains }, {
      onSuccess: () => toast.success("Domain removed!"),
      onError: (err: any) => toast.error(`Failed to remove domain: ${(err instanceof Error ? err.message : String(err))}`)
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-ink/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#1A1825] border border-white/[0.08] rounded-[24px] w-full max-w-[500px] shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden"
        >
          <div className="p-6 border-b border-white/[0.08] flex items-center justify-between shrink-0">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary-400" /> Private Room Access
            </h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
            
            {/* Invite Link Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-[15px] font-bold text-white flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-slate-400" /> Shareable Invite Link
                </h3>
                <p className="text-[13px] text-slate-400 mt-1">
                  Anyone with this link can join and view your private room.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 bg-ink/50 border border-white/[0.08] rounded-xl px-4 py-3 text-[13px] font-mono text-slate-300 truncate select-all">
                  {inviteLink || "Generating..."}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="shrink-0 p-3 bg-primary-400/10 text-primary-400 hover:bg-primary-400/20 rounded-xl transition-colors border border-primary-400/20"
                  title="Copy link"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleRegenerateToken}
                  disabled={regenerateTokenMutation.isPending}
                  className="flex items-center gap-1.5 text-[12px] font-bold text-slate-500 hover:text-red-400 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${regenerateTokenMutation.isPending ? 'animate-spin' : ''}`} />
                  Regenerate Link (Revokes old link)
                </button>
              </div>
            </div>

            <div className="h-px bg-white/[0.05] w-full" />

            {/* Domain Whitelist Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-[15px] font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Auto-Join by Domain
                </h3>
                <p className="text-[13px] text-slate-400 mt-1">
                  Users who sign up with email addresses matching these domains will automatically get access to this room.
                </p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddDomain(); } }}
                  placeholder="e.g. yourcompany.com"
                  className="flex-1 px-4 py-3 bg-ink/50 border border-white/[0.08] rounded-xl text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-primary-500/50 transition-all font-medium"
                />
                <button
                  onClick={handleAddDomain}
                  disabled={!domainInput.trim() || updateAccessMutation.isPending}
                  className="px-4 py-3 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white hover:bg-white/[0.1] transition-all disabled:opacity-30 flex items-center justify-center font-bold text-[13px]"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                {room.whitelistedDomains?.map((domain: string) => (
                  <div key={domain} className="flex items-center justify-between px-4 py-2.5 bg-white/[0.02] border border-white/[0.05] rounded-lg group">
                    <span className="text-[13px] font-mono text-slate-300">@{domain}</span>
                    <button
                      onClick={() => handleRemoveDomain(domain)}
                      disabled={updateAccessMutation.isPending}
                      className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {(!room.whitelistedDomains || room.whitelistedDomains.length === 0) && (
                  <div className="text-center py-4 text-[13px] text-slate-600 font-medium border border-dashed border-white/[0.05] rounded-xl">
                    No domains whitelisted yet.
                  </div>
                )}
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
