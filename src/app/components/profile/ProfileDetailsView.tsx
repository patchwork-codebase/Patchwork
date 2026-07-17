import React, { useRef, useState } from "react";
import { Hammer, Eye, Zap, Calendar, Users, Globe, Twitter, Github, Linkedin, Camera, Upload, X } from "lucide-react";
import { VerifiedTick } from "../ui/VerifiedTick";
import { OrganizationBadge } from "../ui/OrganizationBadge";
import { ExpertBadge } from "./ExpertBadge";
import { timeAgo, registerAvatarUrl } from "../../utils/helpers";
import { UserAvatar } from "../ui/UserAvatar";
import { uploadImage } from "../../utils/uploadImage";
import { supabase } from "../auth/AuthContext";
import { toast } from "sonner";

interface ProfileDetailsViewProps {
  profile: any;
  isOwn?: boolean;
  onProfileUpdate?: () => void;
}

export function ProfileDetailsView({ profile, isOwn, onProfileUpdate }: ProfileDetailsViewProps) {
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;
    setUploadingAvatar(true);
    try {
      const base64 = await toBase64(file);
      const url = await uploadImage(base64);
      const { error } = await supabase.from('users').update({ avatar: url, avatar_url: url }).eq('id', profile.id);
      if (error && error.code === 'PGRST204') {
         // if one column doesn't exist, try updating just avatar_url
         await supabase.from('users').update({ avatar_url: url }).eq('id', profile.id);
      }
      // Immediately update cache so all components show the new photo
      registerAvatarUrl(profile.id, url);
      await supabase.auth.updateUser({ data: { avatar_url: url, avatar: url } });
      toast.success('Profile photo updated!');
      onProfileUpdate?.();
    } catch {
      toast.error('Failed to upload photo. Please try again.');
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;
    setUploadingCover(true);
    try {
      const base64 = await toBase64(file);
      const url = await uploadImage(base64);
      const { error } = await supabase.from('users').update({ cover_url: url }).eq('id', profile.id);
      if (error) throw error;
      toast.success('Cover photo updated!');
      onProfileUpdate?.();
    } catch {
      toast.error('Failed to upload cover. Please try again.');
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };


  return (
    <>
      {/* Hidden inputs */}
      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />

      {/* Cover Banner */}
      <div className="relative h-32 sm:h-40 rounded-t-[24px] sm:rounded-t-[32px] overflow-hidden -mx-5 sm:-mx-8 md:-mx-10 -mt-5 sm:-mt-8 md:-mt-10 mb-0">
        {profile?.coverUrl ? (
          <img
            src={profile.coverUrl}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-400/30 via-violet-500/20 to-indigo-500/10" />
        )}
        {/* Fade to white at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent" />
        {/* Cover upload button (owner only) */}
        {isOwn && (
          <button
            onClick={() => coverInputRef.current?.click()}
            disabled={uploadingCover}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white text-[11px] font-bold rounded-full transition-all"
          >
            {uploadingCover ? (
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Camera className="w-3 h-3" />
            )}
            {uploadingCover ? 'Uploading…' : 'Change cover'}
          </button>
        )}
      </div>

      {/* Avatar + Name Row */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-4 -mt-10 sm:-mt-12 relative z-10 pb-2">
        {/* Avatar */}
        <div className="relative shrink-0 group">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white ring-4 ring-white shadow-[0_0_0_3px_rgba(139,92,246,0.15)] overflow-hidden relative">
            <UserAvatar 
              userId={profile?.id} 
              name={profile?.name} 
              avatarUrl={profile?.avatar || profile?.avatarUrl || profile?.avatar_url} 
              className="w-full h-full object-cover scale-110" 
              lazy={false}
            />
          </div>
          {/* Avatar upload overlay */}
          {isOwn && (
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
            >
              {uploadingAvatar ? (
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-white drop-shadow" />
              )}
            </button>
          )}
        </div>

        {/* Name + Badges */}
        <div className="flex flex-col items-center md:items-start gap-1 flex-1 min-w-0">
          <h1 className="text-[26px] sm:text-[30px] font-extrabold text-slate-900 font-display tracking-tight leading-tight text-center md:text-left">
            {profile?.name}
          </h1>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            {!profile?.organizationName && (
              <VerifiedTick isVerified={!!profile?.isVerifiedExpert} className="w-5 h-5 shrink-0" />
            )}
            {profile?.organizationName && (
              <OrganizationBadge
                orgName={profile.organizationName}
                orgLogo={profile.organizationLogoUrl}
                isVerified={!!profile.isVerifiedExpert}
              />
            )}
            {profile?.isVerifiedExpert && (
              <ExpertBadge tier={profile.expertLevel || "bronze"} size="sm" />
            )}
          </div>
        </div>
      </div>

      {/* Meta chips */}
      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-4">
        <span className="flex items-center gap-1.5 text-[12px] font-bold text-primary-700 bg-primary-50/60 border border-primary-200/50 px-3 py-1.5 rounded-full">
          {profile?.role === 'builder' ? <Hammer className="w-3.5 h-3.5 text-primary-500" /> : <Eye className="w-3.5 h-3.5 text-primary-500" />}
          {profile?.role}{profile?.domain && profile?.role === 'builder' ? ` · ${profile.domain.replace('-', ' ')}` : ''}
        </span>
        <span className="flex items-center gap-1.5 text-[12px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
          <Calendar className="w-3.5 h-3.5 text-slate-400" /> Joined {timeAgo(profile?.createdAt || '')}
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 px-2">
          <Users className="w-3 h-3 text-slate-400" />
          {profile?.followerCount || 0} followers · {profile?.followingCount || 0} following
        </span>
      </div>

      {/* Bio */}
      {profile?.bio && (
        <p className="text-[15px] text-slate-700 mt-4 leading-relaxed max-w-xl mx-auto md:mx-0 font-medium">
          {profile.bio}
        </p>
      )}

      {/* Social Links & Skills */}
      {(profile?.website || profile?.twitter || profile?.githubUrl || profile?.linkedinUrl || (profile?.skills && profile.skills.length > 0)) && (
        <div className="mt-5 space-y-3 max-w-xl mx-auto md:mx-0">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[12px] font-bold text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full transition-colors shadow-sm">
                <Globe className="w-3.5 h-3.5" /> Website
              </a>
            )}
            {profile.twitter && (
              <a href={`https://twitter.com/${profile.twitter.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[12px] font-bold text-white bg-[#1DA1F2] hover:bg-[#1a91da] px-3 py-1.5 rounded-full transition-colors shadow-sm">
                <Twitter className="w-3.5 h-3.5" /> Twitter
              </a>
            )}
            {profile.githubUrl && (
              <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[12px] font-bold text-white bg-slate-900 hover:bg-black px-3 py-1.5 rounded-full transition-colors shadow-sm">
                <Github className="w-3.5 h-3.5" /> GitHub
              </a>
            )}
            {profile.linkedinUrl && (
              <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[12px] font-bold text-white bg-[#0A66C2] hover:bg-[#0958a8] px-3 py-1.5 rounded-full transition-colors shadow-sm">
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn
              </a>
            )}
          </div>
          {profile.skills && profile.skills.length > 0 && (
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              {profile.skills.map((skill: string) => (
                <span key={skill} className="px-2.5 py-1 rounded-full bg-primary-50 border border-primary-200/60 text-primary-700 text-[11px] font-bold uppercase tracking-wider">
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
