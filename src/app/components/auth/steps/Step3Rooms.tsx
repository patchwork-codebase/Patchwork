import React from "react";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "motion/react";

interface Step3RoomsProps {
  role: 'builder' | 'observer';
  availableRooms: any[];
  followedRooms: string[];
  toggleFollow: (roomId: string) => void;
  roomName: string; setRoomName: (val: string) => void;
  roomDomain: string; setRoomDomain: (val: string) => void;
  onNext: () => void;
  onBack: () => void;
  loading?: boolean;
  loadingMessage?: string;
}

export function Step3Rooms({
  role, availableRooms, followedRooms, toggleFollow, roomName, setRoomName, roomDomain, setRoomDomain, onNext, onBack, loading, loadingMessage
}: Step3RoomsProps) {
  return (
    <div className="space-y-6 bg-white/[0.02] border border-white/[0.06] rounded-[32px] p-8 md:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#8B7CF8]/50 to-transparent opacity-50" />
      <div>
        <span className="text-[11px] font-mono text-[#8B7CF8] font-bold uppercase tracking-widest">Step 3 of 5</span>
        <h2 className="text-[32px] font-extrabold text-white tracking-tight mt-2 font-display">
          {role === 'observer' ? 'Follow rooms you want to observe' : 'Open your first build room'}
        </h2>
        <p className="text-[14px] text-slate-400 mt-2 font-medium">
          {role === 'observer'
            ? 'Choose a few live rooms to follow and shape your first observer feed.'
            : 'Name the thing you are building. Think of this as the headline someone would see while watching you work.'}
        </p>
      </div>

      {role === 'observer' ? (
        <div className="space-y-4 mt-8">
          {availableRooms.length ? (
            availableRooms.map(room => {
              const isFollowed = followedRooms.includes(room.id);
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => toggleFollow(room.id)}
                  className={`w-full rounded-3xl border px-5 py-4 text-left transition ${isFollowed ? 'border-[#8B7CF8] bg-[#8B7CF8]/10 text-white' : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]'}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[13px] uppercase tracking-[0.2em] text-slate-500">{room.tags?.[0] || 'Product'}</div>
                      <h3 className="mt-2 text-lg font-semibold text-white">{room.title}</h3>
                      <p className="text-sm text-slate-400 mt-1">{room.observerCount} observers · {room.updateCount} updates</p>
                    </div>
                    <div className={`rounded-full px-4 py-2 text-sm font-semibold ${isFollowed ? 'bg-white text-[#0A0910]' : 'bg-[#6C5CE7] text-white'}`}>
                      {isFollowed ? 'Following' : 'Follow'}
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="rounded-3xl border border-white/[0.08] bg-[#0F0C17] p-6 text-slate-400">Loading rooms...</div>
          )}
        </div>
      ) : (
        <>
          <div className="mt-8">
            <label className="text-[12px] font-bold text-slate-300 mb-2 block uppercase tracking-widest">Room name</label>
            <input
              type="text"
              placeholder="e.g. MoniFlow BNPL merchant dashboard"
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
              className="w-full px-4 py-3 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[14px] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#8B7CF8]/50 text-white transition-all font-medium"
            />
          </div>

          <div>
            <label className="text-[12px] font-bold text-slate-300 mb-2 block uppercase tracking-widest">Domain tag</label>
            <select
              value={roomDomain}
              onChange={e => setRoomDomain(e.target.value)}
              className="w-full px-4 py-3 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[14px] focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#8B7CF8]/50 text-white transition-all font-medium appearance-none"
            >
              <option value="product">🧩 Product</option>
              <option value="design">🎨 Design</option>
              <option value="engineering">⚙️ Engineering</option>
              <option value="writing">✍️ Writing</option>
              <option value="growth">📈 Growth</option>
              <option value="research">🔬 Research</option>
            </select>
          </div>

          <div className="bg-[#0A0910] border border-white/[0.08] rounded-2xl p-6 shadow-inner relative overflow-hidden mt-6">
            <div className="absolute inset-0 bg-gradient-to-br from-[#6C5CE7]/10 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="inline-block text-[10px] font-mono font-bold bg-[#8B7CF8]/20 text-[#8B7CF8] border border-[#8B7CF8]/30 px-2.5 py-1 rounded-md mb-3 uppercase tracking-widest">
                {roomDomain}
              </div>
              <div className="text-[20px] font-extrabold text-white mb-2 font-display">
                {roomName || "Your room name will appear here"}
              </div>
              <p className="text-[12px] text-slate-500 font-mono font-medium">Day 1 · 0 updates · 0 observers</p>
            </div>
          </div>
        </>
      )}

      <div className="flex gap-4 pt-6">
        <motion.button
          whileHover={{ scale: (loading || (role === 'builder' && !roomName)) ? 1 : 1.02 }}
          whileTap={{ scale: (loading || (role === 'builder' && !roomName)) ? 1 : 0.98 }}
          onClick={onNext}
          disabled={loading || (role === 'builder' ? !roomName : false)}
          className="px-8 py-3.5 bg-white text-[#0A0910] text-[14px] font-extrabold rounded-full transition-all flex items-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />{loadingMessage || 'Saving...'}</>
          ) : (
            <>{role === 'observer' ? 'Continue' : 'Open this room'} <ArrowRight className="w-4 h-4" /></>
          )}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onBack}
          className="px-8 py-3.5 border border-white/[0.08] rounded-full text-[14px] font-bold hover:bg-white/[0.05] text-white transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </motion.button>
      </div>
    </div>
  );
}
