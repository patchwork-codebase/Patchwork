import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { useAuth, apiCall } from "../auth/AuthContext";
import { Hammer, Eye, Zap, Calendar, Edit2, Save, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  reputation: number;
  bio: string;
  avatar: string;
  createdAt: string;
}

interface Room {
  id: string;
  title: string;
  status: string;
  updateCount: number;
  observerCount: number;
  updatedAt: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

import { useProfile } from "../../hooks/useProfile";
import { useUserRooms } from "../../hooks/useRooms";
import { useQueryClient } from "@tanstack/react-query";
import Integrations from "./Integrations";

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const { user, token, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: profile, isLoading: profileLoading } = useProfile(id);
  const { 
    data: roomsData, 
    isLoading: roomsLoading,
    fetchNextPage: fetchNextRooms,
    hasNextPage: hasNextRooms,
    isFetchingNextPage: isFetchingNextRooms
  } = useUserRooms(id);
  const rooms = roomsData?.pages.flat() || [];
  
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', bio: '', role: '' });
  const [saving, setSaving] = useState(false);

  const loading = profileLoading || roomsLoading;
  const isOwn = user?.id === id;

  useEffect(() => {
    if (profile) {
      setEditForm({ name: profile.name || '', bio: profile.bio || '', role: profile.role || '' });
    }
  }, [profile]);

  async function handleSave() {
    if (!id || !token) return;
    setSaving(true);
    try {
      const updated = await apiCall(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      }, token);
      queryClient.invalidateQueries({ queryKey: ['profile', id] });
      setEditing(false);
      await refreshProfile();
      toast.success('Profile updated!');
    } catch (err: any) {
      toast.error(`Failed to update: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-[800px] mx-auto px-6 py-12 animate-pulse space-y-6">
        <div className="h-24 w-24 bg-white/5 rounded-2xl" />
        <div className="h-8 bg-white/5 rounded-lg w-1/3" />
        <div className="h-4 bg-white/5 rounded-md w-1/2" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-[800px] mx-auto px-6 py-20 text-center text-slate-400">
        <p className="font-medium text-lg">User not found</p>
        <Link to="/dashboard" className="text-[#8B7CF8] hover:text-white transition-colors text-sm mt-4 inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto px-6 py-10 relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#6C5CE7]/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <Link to="/dashboard" className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-400 hover:text-white mb-8 transition-colors group">
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to Dashboard
      </Link>

      {/* Profile card */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-[32px] p-8 md:p-10 mb-8 backdrop-blur-md shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#6C5CE7]/50 to-transparent opacity-50" />
        
        <div className="flex items-start justify-between gap-6 flex-wrap relative z-10">
          <div className="flex items-start gap-6 w-full md:w-auto flex-1">
            <div className="w-20 h-20 rounded-[20px] bg-gradient-to-br from-[#6C5CE7] to-[#8B7CF8] flex items-center justify-center text-white text-[32px] font-extrabold shrink-0 shadow-inner" style={{ fontFamily: 'var(--font-display)' }}>
              {profile.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Name</label>
                    <input
                      value={editForm.name}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      className="px-4 py-2.5 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[14px] text-white w-full focus:outline-none focus:border-[#6C5CE7]/50 focus:ring-1 focus:ring-[#6C5CE7]/50 transition-all font-medium"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Bio</label>
                    <textarea
                      value={editForm.bio}
                      onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                      rows={3}
                      placeholder="Tell observers about yourself..."
                      className="px-4 py-3 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[14px] text-white w-full focus:outline-none focus:border-[#6C5CE7]/50 focus:ring-1 focus:ring-[#6C5CE7]/50 transition-all resize-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Role</label>
                    <div className="flex gap-3">
                      {['builder', 'observer'].map(r => (
                        <button
                          key={r} type="button"
                          onClick={() => setEditForm(f => ({ ...f, role: r }))}
                          className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-[13px] font-bold capitalize transition-all ${
                            editForm.role === r 
                              ? 'border-[#6C5CE7]/50 bg-[#6C5CE7]/10 text-white shadow-[0_0_15px_rgba(108,92,231,0.15)]' 
                              : 'border-white/[0.08] bg-transparent text-slate-400 hover:text-white hover:border-white/20'
                          }`}
                        >
                          {r === 'builder' ? <Hammer className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-[32px] font-extrabold text-white font-display tracking-tight leading-none mb-3">{profile.name}</h1>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#8B7CF8] bg-[#6C5CE7]/10 border border-[#6C5CE7]/20 px-3 py-1 rounded-full capitalize tracking-wide">
                      {profile.role === 'builder' ? <Hammer className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {profile.role}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full tracking-wide">
                      <Zap className="w-3 h-3" /> {profile.reputation} rep
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 bg-white/[0.03] border border-white/[0.06] px-3 py-1 rounded-full tracking-wide">
                      <Calendar className="w-3 h-3" /> Joined {timeAgo(profile.createdAt)}
                    </span>
                  </div>
                  {profile.bio && <p className="text-[14px] text-slate-300 mt-4 leading-relaxed max-w-xl font-medium">{profile.bio}</p>}
                </>
              )}
            </div>
          </div>

          {isOwn && (
            <div className="flex gap-3 w-full md:w-auto justify-end mt-4 md:mt-0">
              {editing ? (
                <>
                  <button
                    onClick={() => setEditing(false)}
                    className="flex items-center gap-2 px-5 py-2.5 border border-white/[0.08] hover:bg-white/[0.05] rounded-full text-[13px] font-bold text-white transition-colors"
                  >
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#0A0910] rounded-full text-[13px] font-bold hover:bg-slate-200 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-5 py-2.5 border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] rounded-full text-[13px] font-bold text-white transition-colors"
                >
                  <Edit2 className="w-4 h-4" /> Edit Profile
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-10">
        {[
          { label: 'Rooms', value: rooms.length, color: 'text-emerald-400', bg: 'bg-emerald-400/5', border: 'border-emerald-400/10' },
          { label: 'Reputation', value: profile.reputation, color: 'text-amber-400', bg: 'bg-amber-400/5', border: 'border-amber-400/10' },
          { label: 'Role', value: profile.role, color: 'text-[#8B7CF8]', bg: 'bg-[#6C5CE7]/5', border: 'border-[#6C5CE7]/10', capitalize: true },
        ].map((s, idx) => (
          <div key={s.label} className={`border ${s.border} ${s.bg} rounded-[16px] md:rounded-[20px] p-4 md:p-6 text-center backdrop-blur-sm ${idx === 2 ? 'col-span-2 md:col-span-1' : ''}`}>
            <div className={`text-[28px] md:text-[32px] font-black ${s.color} capitalize font-display leading-none mb-2`}>{s.value}</div>
            <div className="text-[10px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Integrations (Only visible to the owner if they are a builder) */}
      {isOwn && profile.role === 'builder' && (
        <Integrations userId={id!} />
      )}

      {/* Rooms */}
      <div>
        <h2 className="text-[20px] font-extrabold text-white mb-6 font-display">
          {isOwn ? 'My Rooms' : `${profile.name}'s Rooms`}
        </h2>
        {rooms.length === 0 ? (
          <div className="text-center py-16 bg-white/[0.01] border-2 border-dashed border-white/[0.06] rounded-[24px]">
            <Hammer className="w-12 h-12 mx-auto mb-4 text-slate-600" />
            <p className="text-[15px] font-bold text-slate-400 mb-2">No rooms yet</p>
            {isOwn && profile.role === 'builder' && (
              <Link to="/dashboard/create" className="text-[#8B7CF8] hover:text-white font-bold text-[13px] transition-colors inline-flex items-center gap-1">
                Create your first room <ArrowLeft className="w-3 h-3 rotate-180" />
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {rooms.map(room => (
              <Link
                key={room.id} to={`/dashboard/room/${room.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02] border border-white/[0.05] rounded-[20px] p-5 hover:border-white/[0.15] hover:bg-white/[0.04] transition-all group backdrop-blur-sm hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-[16px] text-white group-hover:text-[#8B7CF8] transition-colors font-display mb-2 truncate">{room.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-[12px] font-medium text-slate-400">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-widest font-mono ${room.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' : 'bg-white/5 text-slate-400 ring-1 ring-white/10'}`}>
                      {room.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                      {room.status}
                    </span>
                    <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-slate-600"/> {room.updateCount} updates</span>
                    <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-slate-600"/> {room.observerCount} observers</span>
                    <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-slate-600"/> {timeAgo(room.updatedAt)}</span>
                  </div>
                </div>
                {room.status === 'completed' && (
                  <Link
                    to={`/dashboard/build-logs`}
                    onClick={e => e.stopPropagation()}
                    className="shrink-0 text-[12px] font-bold px-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-full text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all whitespace-nowrap"
                  >
                    View in Logs
                  </Link>
                )}
              </Link>
            ))}
            {hasNextRooms && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => fetchNextRooms()}
                  disabled={isFetchingNextRooms}
                  className="px-6 py-2.5 bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.04] rounded-full text-[13px] font-bold text-slate-300 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isFetchingNextRooms ? "Loading..." : "Load More Rooms"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
