import { useState } from "react";
import { motion } from "motion/react";
import { X, UserPlus, Loader2 } from "lucide-react";
import { supabase } from "../auth/AuthContext";
import { toast } from "sonner";

interface RequestJoinModalProps {
  open: boolean;
  onClose: () => void;
  roomId: string;
}

export function RequestJoinModal({ open, onClose, roomId }: RequestJoinModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRequest = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('request_to_join_room', {
        p_room_id: roomId
      });

      if (error) throw error;
      
      setSuccess(true);
      toast.success("Join request sent to the builder");
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "Failed to send join request");
    } finally {
      setLoading(false);
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
        className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm relative z-10 overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary-400/10 rounded-full flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-primary-400" />
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors focus-ring"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          
          {success ? (
            <div className="text-center py-4">
              <h2 className="text-[20px] font-extrabold text-slate-900 mb-2 font-display">Request Sent!</h2>
              <p className="text-[14px] text-slate-500 mb-6 leading-relaxed">
                The builder has been notified of your request to join. You'll receive a notification when they review it.
              </p>
              <button
                onClick={onClose}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-all"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-[20px] font-extrabold text-slate-900 mb-2 font-display">Request to Join</h2>
              <p className="text-[14px] text-slate-500 mb-6 leading-relaxed">
                This room is private. Send a request to the builder to get access and collaborate.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequest}
                  disabled={loading}
                  className="flex-1 py-3 bg-primary-400 hover:bg-[#7b6ce8] text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Request"}
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
