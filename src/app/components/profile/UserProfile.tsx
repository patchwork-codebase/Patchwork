import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useAuth, supabase } from "../auth/AuthContext";
import { apiCall } from "../../../utils/api";
import { Hammer, Eye, Zap, Calendar, Edit2, Save, X, ArrowLeft, Globe, Share, UserPlus, UserMinus, ShieldCheck, Clock, Check } from "lucide-react";
import { VerifiedTick } from "../ui/VerifiedTick";
import { getObserverCount, timeAgo } from "../../utils/helpers";
import { UserAvatar } from "../ui/UserAvatar";
import { ObserverAvatarStack } from "../ui/ObserverAvatarStack";
import { toast } from "sonner";
import { ExpertBadge } from "./ExpertBadge";
import { useExpertApplication } from "../../../hooks/useExpertApplication";

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
  domain?: string;
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



import { useProfile } from "../../hooks/useProfile";
import { useFollow } from "../../hooks/useFollow";
import { useUserRooms } from "../../hooks/useRooms";
import { useQueryClient } from "@tanstack/react-query";
import { EditProfileForm } from "./EditProfileForm";
import Integrations from "./Integrations";
import { ProfileDetailsView } from "./ProfileDetailsView";
import { ExpertCard } from "./ExpertCard";
import { ProfileStats } from "./ProfileStats";
import { OrganizationSettingsCard } from "./OrganizationSettingsCard";
import { SocialLinksCard } from "./SocialLinksCard";
import { SkillsCard } from "./SkillsCard";
import { SEO } from "../seo/SEO";


export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const { user, token, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: expertApp } = useExpertApplication(user?.id);
  
  const { data: profile, isLoading: profileLoading } = useProfile(id);
  const { isFollowing, isLoading: followLoading, toggleFollow } = useFollow(id, user?.id);
  const { 
    data: roomsData, 
    isLoading: roomsLoading,
    fetchNextPage: fetchNextRooms,
    hasNextPage: hasNextRooms,
    isFetchingNextPage: isFetchingNextRooms
  } = useUserRooms(id);
  const rooms = roomsData?.pages.flat() || [];
  
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ 
    name: '', 
    bio: '', 
    role: '',
    domain: '',
    website: '',
    twitter: '',
    github_url: '',
    linkedin_url: '',
    organization_name: '',
    organization_logo_url: '',
    skills: [] as string[],
    expert_available: true,
    expert_open_slots: 3,
    expert_avg_response_hours: 48,
    email_notifications_enabled: true,
    in_app_notifications_enabled: true
  });
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);
  const loading = profileLoading || roomsLoading;
  const isOwn = user?.id === id;

  useEffect(() => {
    if (profile) {
      setEditForm({ 
        name: profile.name || '', 
        bio: profile.bio || '', 
        role: profile.role || '',
        domain: profile.domain || '',
        website: profile.website || '',
        twitter: profile.twitter || '',
        github_url: profile.githubUrl || '',
        linkedin_url: profile.linkedinUrl || '',
        organization_name: profile.organizationName || '',
        organization_logo_url: profile.organizationLogoUrl || '',
        skills: profile.skills || [],
        expert_available: profile.expertAvailable ?? true,
        expert_open_slots: profile.expertOpenSlots ?? 3,
        expert_avg_response_hours: profile.expertAvgResponseHours ?? 48,
        email_notifications_enabled: profile.emailNotificationsEnabled ?? true,
        in_app_notifications_enabled: profile.inAppNotificationsEnabled ?? true
      });
    }
  }, [profile]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Profile link copied to clipboard!");
  };

  async function handleSave() {
    if (!id || !token) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('users').update(editForm).eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['profile', id] });
      setEditing(false);
      await refreshProfile();
      toast.success('Profile updated!');
    } catch (err: unknown) {
      toast.error(`Failed to update: ${(err instanceof Error ? err.message : String(err))}`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-[800px] mx-auto px-6 py-12 animate-pulse space-y-6">
        <div className="h-24 w-24 bg-slate-200 rounded-2xl" />
        <div className="h-8 bg-slate-200 rounded-lg w-1/3" />
        <div className="h-4 bg-slate-200 rounded-md w-1/2" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-[800px] mx-auto px-6 py-20 text-center text-slate-400">
        <p className="font-medium text-lg">User not found</p>
        <Link to="/dashboard" className="text-primary-400 hover:text-white transition-colors text-sm mt-4 inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title={`${profile.name} (@${profile.name?.split(' ')[0]?.toLowerCase() || 'user'}) | Patchwork`}
        description={profile.bio || `Check out ${profile.name}'s profile and rooms on Patchwork.`}
        image={profile.avatar || profile.avatarUrl || profile.avatar_url || `https://api.dicebear.com/9.x/micah/svg?seed=${encodeURIComponent(profile.id || profile.name)}&backgroundColor=transparent`}
      />
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6 sm:py-10 relative overflow-x-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <Link to="/dashboard" className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-500 hover:text-slate-900 mb-6 sm:mb-8 transition-colors group">
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to Dashboard
      </Link>

      {/* Profile card */}
      <div className="bg-white border border-slate-200 rounded-[24px] sm:rounded-[32px] mb-8 shadow-sm relative overflow-hidden">
        {editing ? (
          <div className="p-5 sm:p-8 md:p-10 relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500/50 to-transparent opacity-50" />
            
            <div className="flex flex-col items-center md:items-start justify-between gap-6 relative z-10">
              <div className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6 w-full flex-1">
                <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-sm overflow-hidden shrink-0 relative ring-1 ring-slate-200">
                  <UserAvatar 
                    userId={profile.id} 
                    name={profile.name} 
                    avatarUrl={profile.avatar || profile.avatarUrl || profile.avatar_url} 
                    className="w-full h-full object-cover scale-110" 
                    lazy={false}
                  />
                </div>
                <div className="flex-1 min-w-0 w-full">
                  <EditProfileForm 
                    editForm={editForm}
                    setEditForm={setEditForm}
                    skillInput={skillInput}
                    setSkillInput={setSkillInput}
                    profile={profile}
                  />
                </div>
              </div>

              <div className="flex gap-3 w-full justify-end shrink-0 flex-wrap">
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 hover:bg-slate-100 rounded-full text-[13px] font-bold text-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-full text-[13px] font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 sm:p-8 md:p-10 relative">
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex flex-wrap justify-end gap-2 z-20">
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white/80 hover:bg-white backdrop-blur-md border border-slate-200/50 shadow-sm rounded-full text-[12px] font-bold text-slate-700 transition-colors"
              >
                <Share className="w-3.5 h-3.5" /> Share
              </button>
              {isOwn && !profile.isVerifiedExpert && !expertApp && (
                <Link
                  to="/dashboard/expert-apply"
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-500/90 hover:bg-primary-500 backdrop-blur-md shadow-sm rounded-full text-[12px] font-bold text-white transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" /> Become Expert
                </Link>
              )}
              {isOwn && expertApp?.status === "pending" && (
                <span className="flex items-center gap-2 px-4 py-2 bg-amber-500/90 backdrop-blur-md shadow-sm rounded-full text-[12px] font-bold text-white">
                  <Clock className="w-3.5 h-3.5" /> Under review
                </span>
              )}
              {isOwn ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-white/80 hover:bg-white backdrop-blur-md border border-slate-200/50 shadow-sm rounded-full text-[12px] font-bold text-slate-700 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                </button>
              ) : (
                <button
                  onClick={toggleFollow}
                  disabled={followLoading || !user}
                  className={`flex items-center justify-center gap-2 px-5 py-2 rounded-full text-[12px] font-bold transition-all disabled:opacity-50 shadow-sm ${
                    isFollowing 
                      ? 'border border-slate-200/50 bg-white/80 backdrop-blur-md text-slate-700 hover:bg-white hover:border-red-500/50 hover:text-red-400 group' 
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-3.5 h-3.5 hidden group-hover:block" />
                      <span className="hidden group-hover:block">Unfollow</span>
                      <span className="group-hover:hidden flex items-center gap-1.5"><Check className="w-3.5 h-3.5" /> Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" /> Follow
                    </>
                  )}
                </button>
              )}
            </div>

            <ProfileDetailsView
              profile={profile}
              isOwn={isOwn}
              onProfileUpdate={() => {
                queryClient.invalidateQueries({ queryKey: ['profile', id] });
                if (isOwn) refreshProfile();
              }}
            />
          </div>
        )}
      </div>

      <ExpertCard profile={profile} />

      <ProfileStats profile={profile} roomsCount={rooms.length} />


      {/* Editable Profile Extensions (Only visible to owner) */}
      {isOwn && !editing && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-6">
            <OrganizationSettingsCard profile={profile} />
            <SocialLinksCard profile={profile} />
          </div>
          <div>
            <SkillsCard profile={profile} />
          </div>
        </div>
      )}

      {/* Integrations (Only visible to the owner if they are a builder) */}
      {isOwn && profile.role === 'builder' && (
        <Integrations userId={id!} />
      )}

      {/* Rooms */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <h2 className="text-[20px] font-extrabold text-slate-900 font-display">
            {isOwn ? 'My Rooms' : `${profile.name}'s Rooms`}
          </h2>
          {rooms.length > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[12px] font-bold text-slate-600">{rooms.length}</span>
          )}
        </div>
        {rooms.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px]">
            <Hammer className="w-12 h-12 mx-auto mb-4 text-slate-600" />
            <p className="text-[15px] font-bold text-slate-600 mb-2">No rooms yet</p>
            {isOwn && profile.role === 'builder' && (
              <Link to="/dashboard/create" className="text-primary-400 hover:text-white font-bold text-[13px] transition-colors inline-flex items-center gap-1">
                Create your first room <ArrowLeft className="w-3 h-3 rotate-180" />
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {rooms.map(room => (
              <Link
                key={room.id} to={`/dashboard/room/${room.id}`}
                className="flex flex-col gap-3 bg-white border border-slate-200 rounded-[20px] p-4 sm:p-5 hover:border-l-4 hover:border-l-primary-400 hover:border-primary-500/30 hover:bg-primary-50/30 transition-all group backdrop-blur-sm hover:-translate-y-0.5 hover:shadow-md min-w-0 overflow-hidden"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-[15px] sm:text-[16px] text-slate-900 group-hover:text-primary-400 transition-colors font-display mb-2 line-clamp-2 break-words">{room.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-[12px] font-medium text-slate-600">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-widest font-mono ${room.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'}`}>
                      {room.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                      {room.status}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span>{room.updateCount} updates</span>
                    <span className="text-slate-300">·</span>
                    <ObserverAvatarStack room={room} />
                    <span className="text-slate-300">·</span>
                    <span>{timeAgo(room.updatedAt)}</span>
                  </div>
                </div>
                {room.status !== 'active' && (
                  <button
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(`/dashboard/build-logs/${room.id}`);
                    }}
                    className="self-start text-[12px] font-bold px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all whitespace-nowrap"
                  >
                    View in Logs
                  </button>
                )}
              </Link>
            ))}
            {hasNextRooms && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => fetchNextRooms()}
                  disabled={isFetchingNextRooms}
                  className="px-6 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-slate-100 rounded-full text-[13px] font-bold text-slate-700 hover:text-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isFetchingNextRooms ? "Loading..." : "Load More Rooms"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
