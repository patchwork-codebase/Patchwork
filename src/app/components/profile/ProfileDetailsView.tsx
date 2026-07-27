import React, { useRef, useState } from "react";
import { Hammer, Eye, Calendar, Users, Globe, Twitter, Github, Linkedin, Camera, Link as LinkIcon, Trophy, Edit2, ShieldCheck, Share2 } from "lucide-react";
import { VerifiedTick } from "../ui/VerifiedTick";
import { timeAgo, registerAvatarUrl, optimizeCloudinaryUrl } from "../../utils/helpers";
import { UserAvatar } from "../ui/UserAvatar";
import { uploadImage } from "../../utils/uploadImage";
import { supabase } from "../auth/AuthContext";
import { toast } from "sonner";
import { FollowersListModal } from "./FollowersListModal";

interface ProfileDetailsViewProps {
  profile: any;
  isOwn?: boolean;
  onProfileUpdate?: () => void;
  roomsCount?: number;
}

export function ProfileDetailsView({ profile, isOwn, onProfileUpdate, roomsCount = 0 }: ProfileDetailsViewProps) {
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'followers' | 'following'>('followers');

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
      let dbError = null;
      
      const { error: err1 } = await supabase.from('users').update({ avatar: url }).eq('id', profile.id);
      
      if (err1) {
         const { error: err2 } = await supabase.from('users').update({ avatar_url: url }).eq('id', profile.id);
         if (err2) dbError = err2;
      }

      if (dbError) throw dbError;
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

  return (
    <>
      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

      <div className="relative pt-6 px-4 pb-8 sm:px-8 sm:pb-10 text-center">
        {/* Wavy Banner Background */}
        <div className="absolute top-0 left-0 right-0 h-[180px] sm:h-[220px] rounded-t-[24px] sm:rounded-t-[32px] overflow-hidden -z-10 bg-gradient-to-br from-primary-900/40 via-[#111111] to-[#0a0a0a]">
          <img
            src={profile?.coverUrl ? optimizeCloudinaryUrl(profile.coverUrl, 1200) : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop"}
            alt="Cover Background"
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-30"
          />
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 120" fill="none" preserveAspectRatio="none">
            <path d="M0,0 C320,100 420,-40 720,20 C1020,80 1120,0 1440,60 L1440,120 L0,120 Z" fill="#0a0a0a"/>
          </svg>
        </div>

        {/* Verified Expert Tag top right inside banner */}
        {profile?.isVerifiedExpert && (
            <div className="absolute top-5 right-5 bg-black/40 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 text-[12px] font-bold text-primary-400 shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Expert
            </div>
        )}

        {/* Avatar */}
        <div className="relative mx-auto mt-4 sm:mt-8 group w-fit">
          <div className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] rounded-full ring-[4px] sm:ring-[6px] ring-[#0a0a0a] shadow-sm overflow-hidden relative bg-[#111111]">
            <UserAvatar 
              userId={profile?.id} 
              name={profile?.name} 
              avatarUrl={profile?.avatar || profile?.avatarUrl || profile?.avatar_url} 
              className="w-full h-full object-cover scale-110" 
              lazy={false}
            />
          </div>
          
          {isOwn && (
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 sm:translate-x-0 sm:translate-y-0 sm:-right-2 sm:bottom-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary-500 border-[3px] border-[#0a0a0a] flex items-center justify-center text-white shadow-md hover:bg-primary-600 active:scale-95 transition-all z-10"
            >
              {uploadingAvatar ? (
                <span className="w-3.5 h-3.5 sm:w-5 sm:h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
            </button>
          )}
        </div>

        {/* Name & Role */}
        <h1 className="text-[26px] sm:text-[30px] font-extrabold text-white tracking-tight leading-tight mt-5 font-display">
          {profile?.name}
        </h1>
        <div className="flex items-center justify-center gap-2 mt-1.5 mb-5 text-slate-400 font-medium text-[14px]">
          <span className="font-bold text-white">Patchwork</span> <VerifiedTick isVerified={true} className="w-4 h-4 text-primary-400" /> <span className="text-slate-600">•</span> <span className="capitalize">{profile?.role || 'Member'}</span>
        </div>

        {/* Bio */}
        <p className="text-slate-300 text-[15px] leading-relaxed max-w-sm sm:max-w-md mx-auto mb-7 font-medium">
          {profile?.bio || "Building better products that solve real problems and create meaningful impact."}
        </p>

        {/* Stats Pill */}
        <div className="flex justify-between items-center bg-white/5 backdrop-blur-sm rounded-full p-2.5 sm:p-3 max-w-sm mx-auto border border-white/10 mb-8 shadow-md">
          <div 
            className="flex flex-col items-center flex-1 relative cursor-pointer hover:bg-white/10 rounded-xl transition-colors py-1"
            onClick={() => {
              setModalType('followers');
              setModalOpen(true);
            }}
          >
            <div className="flex items-center gap-1.5 text-white font-extrabold text-[16px] sm:text-[18px] mb-0.5"><Users className="w-4 h-4 text-primary-400"/> {profile?.followerCount || 0}</div>
            <span className="text-[11px] sm:text-[12px] text-slate-400 font-medium">Followers</span>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-8 bg-white/10" />
          </div>
          <div 
            className="flex flex-col items-center flex-1 relative cursor-pointer hover:bg-white/10 rounded-xl transition-colors py-1"
            onClick={() => {
              setModalType('following');
              setModalOpen(true);
            }}
          >
            <div className="flex items-center gap-1.5 text-white font-extrabold text-[16px] sm:text-[18px] mb-0.5"><Users className="w-4 h-4 text-primary-400"/> {profile?.followingCount || 0}</div>
            <span className="text-[11px] sm:text-[12px] text-slate-400 font-medium">Following</span>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-8 bg-white/10" />
          </div>
          <div className="flex flex-col items-center flex-1 py-1">
            <div className="flex items-center gap-1.5 text-white font-extrabold text-[16px] sm:text-[18px] mb-0.5"><Trophy className="w-4 h-4 text-primary-400"/> {roomsCount}</div>
            <span className="text-[11px] sm:text-[12px] text-slate-400 font-medium">Projects</span>
          </div>
        </div>

        {/* Proof of Work Showcase Card */}
        <div className="bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 border border-primary-500/20 rounded-2xl p-4 max-w-sm sm:max-w-md mx-auto mb-8 shadow-md text-white text-center relative overflow-hidden">
          <div className="flex items-center justify-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 font-mono">
              Verified Proof-of-Work Credential
            </span>
          </div>
          <p className="text-[12px] text-slate-300 font-medium">
            {roomsCount} Build {roomsCount === 1 ? 'Room' : 'Rooms'} &amp; SHA-256 Proof of Authorship verified on Patchwork
          </p>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Proof-of-Work portfolio link copied!");
            }}
            className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-primary-300 hover:text-white bg-white/10 hover:bg-white/20 border border-white/10 px-3 py-1.5 rounded-full transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" /> Copy Credential Link
          </button>
        </div>

        {/* Social Links */}
        <div className="flex flex-col items-center">
            <div className="flex justify-center gap-3">
              <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shadow-sm">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              {profile?.linkedinUrl && (
                <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-[#0A66C2] hover:bg-white/10 transition-colors shadow-sm">
                  <Linkedin className="w-4 h-4" fill="currentColor" />
                </a>
              )}
              {profile?.twitter && (
                <a href={`https://twitter.com/${profile.twitter.replace('@', '')}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-[#1DA1F2] hover:bg-white/10 transition-colors shadow-sm">
                  <Twitter className="w-4 h-4" fill="currentColor" />
                </a>
              )}
              {profile?.githubUrl && (
                <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors shadow-sm">
                  <Github className="w-4 h-4" fill="currentColor" />
                </a>
              )}
              {profile?.website && (
                <a href={profile.website} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-primary-400 hover:bg-white/10 transition-colors shadow-sm">
                  <LinkIcon className="w-4 h-4" />
                </a>
              )}
            </div>
            <div className="text-[13px] text-slate-500 font-medium mt-4">Connect and showcase your work</div>
        </div>
      </div>

      <FollowersListModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        userId={profile?.id}
        type={modalType}
      />
    </>
  );
}

