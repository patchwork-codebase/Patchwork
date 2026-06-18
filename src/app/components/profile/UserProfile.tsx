import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useAuth, supabase } from "../auth/AuthContext";
import { apiCall } from "../../../utils/api";
import { Hammer, Eye, Zap, Calendar, Edit2, Save, X, ArrowLeft, Globe, Twitter, Github, Linkedin, Share, UserPlus, UserMinus, Users, ChevronDown, ShieldCheck, Star, Clock, CheckCircle, TrendingUp, Check } from "lucide-react";
import { VerifiedTick } from "../ui/VerifiedTick";
import { getAvatarUrl, getObserverCount, timeAgo } from "../../utils/helpers";
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
import { useUserRooms } from "../../hooks/useRooms";
import { useQueryClient } from "@tanstack/react-query";
import Integrations from "./Integrations";

function CustomSelect({ value, onChange, options, label }: { value: string, onChange: (v: string) => void, options: {value: string, label: string}[], label: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <label className="block text-[13px] font-bold text-slate-700 mb-2">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-5 py-4 bg-slate-50 border ${isOpen ? 'border-[#8B7CF8]/50 ring-1 ring-[#8B7CF8]/50' : 'border-slate-200'} rounded-xl text-[15px] text-slate-900 focus:outline-none transition-all font-medium flex items-center justify-between`}
      >
        <span>{selectedOption ? selectedOption.label : 'Select...'}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden py-1">
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-5 py-3 text-[14px] transition-colors ${
                value === option.value 
                  ? 'bg-slate-50 text-[#8B7CF8] font-bold' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const { user, token, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: expertApp } = useExpertApplication(user?.id);
  
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
  const [editForm, setEditForm] = useState({ 
    name: '', 
    bio: '', 
    role: '',
    domain: '',
    website: '',
    twitter: '',
    github_url: '',
    linkedin_url: '',
    skills: [] as string[],
    expert_available: true,
    expert_open_slots: 3,
    expert_avg_response_hours: 48
  });
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const loading = profileLoading || roomsLoading;
  const isOwn = user?.id === id;

  useEffect(() => {
    if (profile) {
      setIsFollowing(profile.isFollowing || false);
      setEditForm({ 
        name: profile.name || '', 
        bio: profile.bio || '', 
        role: profile.role || '',
        domain: profile.domain || '',
        website: profile.website || '',
        twitter: profile.twitter || '',
        github_url: profile.github_url || '',
        linkedin_url: profile.linkedin_url || '',
        skills: profile.skills || [],
        expert_available: (profile as any).expertAvailable ?? true,
        expert_open_slots: (profile as any).expertOpenSlots ?? 3,
        expert_avg_response_hours: (profile as any).expertAvgResponseHours ?? 48
      });
    }
  }, [profile]);

  const handleFollowToggle = async () => {
    if (!id || !user || isOwn) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({ follower_id: user.id, following_id: id });
        if (error) throw error;
      }
      setIsFollowing(!isFollowing);
      queryClient.invalidateQueries({ queryKey: ['profile', id] });
      toast.success(isFollowing ? 'Unfollowed successfully' : 'Followed successfully');
    } catch (err: any) {
      toast.error(`Failed to update follow status: ${err.message}`);
    } finally {
      setFollowLoading(false);
    }
  };

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
    } catch (err: any) {
      toast.error(`Failed to update: ${err.message}`);
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
        <Link to="/dashboard" className="text-[#8B7CF8] hover:text-white transition-colors text-sm mt-4 inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6 sm:py-10 relative">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#6C5CE7]/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <Link to="/dashboard" className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-500 hover:text-slate-900 mb-6 sm:mb-8 transition-colors group">
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to Dashboard
      </Link>

      {/* Profile card */}
      <div className="bg-white border border-slate-200 rounded-[24px] sm:rounded-[32px] p-5 sm:p-8 md:p-10 mb-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#6C5CE7]/50 to-transparent opacity-50" />
        
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 flex-wrap relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 sm:gap-6 w-full md:w-auto flex-1">
            <div className="w-24 h-24 rounded-[24px] bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-[0_0_0_4px_rgba(108,92,231,0.15)] relative">
              <img
                src={getAvatarUrl(profile.id || profile.name)}
                alt={profile.name}
                className="w-full h-full object-cover scale-110"
                onError={e => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.classList.add('bg-gradient-to-br', 'from-[#6C5CE7]', 'to-[#8B7CF8]', 'flex', 'items-center', 'justify-center');
                    parent.innerHTML = `<span style="color:white;font-size:32px;font-weight:800">${profile.name?.[0]?.toUpperCase() ?? '?'}</span>`;
                  }
                }}
              />
            </div>
            <div className="flex-1 min-w-0 w-full">
              {editing ? (
                <div className="space-y-4 max-w-md mx-auto sm:mx-0 text-left">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Name</label>
                    <input
                      value={editForm.name}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-900 w-full focus:outline-none focus:border-[#6C5CE7]/50 focus:ring-1 focus:ring-[#6C5CE7]/50 transition-all font-medium"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Bio</label>
                    <textarea
                      value={editForm.bio}
                      onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                      rows={3}
                      placeholder="Tell observers about yourself..."
                      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-900 w-full focus:outline-none focus:border-[#6C5CE7]/50 focus:ring-1 focus:ring-[#6C5CE7]/50 transition-all resize-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-2">Role</label>
                    <div className="flex justify-center sm:justify-start gap-3">
                      {['builder', 'observer'].map(r => (
                        <button
                          key={r} type="button"
                          onClick={() => setEditForm(f => ({ ...f, role: r }))}
                          className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-[13px] font-bold capitalize transition-all ${
                            editForm.role === r 
                              ? 'border-[#6C5CE7]/50 bg-[#6C5CE7]/10 text-slate-900 shadow-[0_0_15px_rgba(108,92,231,0.15)]' 
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {r === 'builder' ? <Hammer className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {editForm.role === 'builder' && (
                    <div className="relative z-50">
                      <CustomSelect
                        label="User Type"
                        value={editForm.domain}
                        onChange={val => setEditForm(f => ({ ...f, domain: val }))}
                        options={[
                          { value: "product-manager", label: "📋 Product Manager" },
                          { value: "engineer", label: "⚙️ Engineer" },
                          { value: "product-designer", label: "🎨 Product Designer" },
                          { value: "founder", label: "🚀 Founder" },
                          { value: "writer", label: "✍️ Writer" },
                          { value: "growth", label: "📈 Growth" },
                          { value: "research", label: "🔬 Research" },
                          { value: "other", label: "✦ Other" },
                        ]}
                      />
                    </div>
                  )}

                  {/* Social Links Form */}
                  <div className="pt-6 mt-2 border-t border-slate-200 space-y-5">
                    <div>
                      <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-widest mb-1">Social Links</h3>
                      <p className="text-[12px] text-slate-600">Connect your profiles to build your network.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Website URL</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Globe className="w-4 h-4 text-slate-500 group-focus-within:text-[#6C5CE7] transition-colors" />
                          </div>
                          <input
                            value={editForm.website}
                            onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))}
                            className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-900 w-full focus:outline-none focus:border-[#6C5CE7]/50 focus:ring-1 focus:ring-[#6C5CE7]/50 transition-all placeholder:text-slate-500 shadow-sm"
                            placeholder="https://yourwebsite.com"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Twitter</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Twitter className="w-4 h-4 text-slate-500 group-focus-within:text-[#1DA1F2] transition-colors" />
                          </div>
                          <input
                            value={editForm.twitter}
                            onChange={e => setEditForm(f => ({ ...f, twitter: e.target.value }))}
                            className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-900 w-full focus:outline-none focus:border-[#1DA1F2]/50 focus:ring-1 focus:ring-[#1DA1F2]/50 transition-all placeholder:text-slate-500 shadow-sm"
                            placeholder="@username"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">GitHub</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Github className="w-4 h-4 text-slate-500 group-focus-within:text-slate-900 transition-colors" />
                          </div>
                          <input
                            value={editForm.github_url}
                            onChange={e => setEditForm(f => ({ ...f, github_url: e.target.value }))}
                            className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-900 w-full focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all placeholder:text-slate-500 shadow-sm"
                            placeholder="https://github.com/..."
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">LinkedIn</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Linkedin className="w-4 h-4 text-slate-500 group-focus-within:text-[#0A66C2] transition-colors" />
                          </div>
                          <input
                            value={editForm.linkedin_url}
                            onChange={e => setEditForm(f => ({ ...f, linkedin_url: e.target.value }))}
                            className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-900 w-full focus:outline-none focus:border-[#0A66C2]/50 focus:ring-1 focus:ring-[#0A66C2]/50 transition-all placeholder:text-slate-500 shadow-sm"
                            placeholder="https://linkedin.com/in/..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expert Settings Form */}
                  {(profile as any).isVerifiedExpert && (
                    <div className="pt-6 mt-2 border-t border-slate-200 space-y-5">
                      <div>
                        <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-widest mb-1">Expert Availability</h3>
                        <p className="text-[12px] text-slate-600">Manage your review capacity and response times.</p>
                      </div>
                      
                      <div className="flex items-center gap-3 mb-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={editForm.expert_available}
                            onChange={(e) => setEditForm(f => ({ ...f, expert_available: e.target.checked }))}
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                        <span className="text-[13px] font-bold text-slate-900">{editForm.expert_available ? 'Available for requests' : 'Currently unavailable'}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Open Slots (Active)</label>
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={editForm.expert_open_slots}
                            onChange={e => setEditForm(f => ({ ...f, expert_open_slots: parseInt(e.target.value) || 0 }))}
                            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-900 w-full focus:outline-none focus:border-[#6C5CE7]/50 focus:ring-1 focus:ring-[#6C5CE7]/50 transition-all shadow-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Avg Response Time (Hours)</label>
                          <input
                            type="number"
                            min="1"
                            max="168"
                            value={editForm.expert_avg_response_hours}
                            onChange={e => setEditForm(f => ({ ...f, expert_avg_response_hours: parseInt(e.target.value) || 24 }))}
                            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-900 w-full focus:outline-none focus:border-[#6C5CE7]/50 focus:ring-1 focus:ring-[#6C5CE7]/50 transition-all shadow-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Skills Form */}
                  <div className="pt-4 border-t border-slate-200">
                    <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-widest mb-3">Tech Stack / Skills</h3>
                    <div className="flex gap-2 mb-3">
                      <input
                        value={skillInput}
                        onChange={e => setSkillInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (skillInput.trim() && !editForm.skills.includes(skillInput.trim())) {
                              setEditForm(f => ({ ...f, skills: [...f.skills, skillInput.trim()] }));
                              setSkillInput('');
                            }
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:outline-none focus:border-[#6C5CE7]/50"
                        placeholder="Add a skill (e.g. React) and press Enter"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (skillInput.trim() && !editForm.skills.includes(skillInput.trim())) {
                            setEditForm(f => ({ ...f, skills: [...f.skills, skillInput.trim()] }));
                            setSkillInput('');
                          }
                        }}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 text-[13px] font-bold rounded-xl transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    {editForm.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {editForm.skills.map(skill => (
                          <span key={skill} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-800 text-[12px] font-medium">
                            {skill}
                            <button
                              type="button"
                              onClick={() => setEditForm(f => ({ ...f, skills: f.skills.filter(s => s !== skill) }))}
                              className="text-slate-400 hover:text-red-400 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-2">
                    <h1 className="text-[28px] sm:text-[32px] font-extrabold text-slate-900 font-display tracking-tight leading-tight sm:leading-none break-words">
                      {profile.name}
                      <span className="inline-block ml-2 align-middle">
                        <VerifiedTick isVerified={!!(profile as any).isVerifiedExpert} className="w-6 h-6" />
                      </span>
                    </h1>
                    {(profile as any).isVerifiedExpert && (
                      <ExpertBadge tier={(profile as any).expertLevel || "bronze"} size="md" />
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-3">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#8B7CF8] bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full capitalize tracking-wide">
                      {profile.role === 'builder' ? <Hammer className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {profile.role} {(profile as any).domain && profile.role === 'builder' ? ` • ${(profile as any).domain.replace('-', ' ')}` : ''}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-500 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full tracking-wide">
                      <Zap className="w-3 h-3" /> {profile.reputation} rep
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full tracking-wide">
                      <Calendar className="w-3 h-3" /> Joined {timeAgo(profile.createdAt || '')}
                    </span>
                    <div className="w-px h-4 bg-slate-300 hidden sm:block mx-1"></div>
                    <span className="flex items-center gap-1.5 text-[12px] font-bold text-slate-900 tracking-wide">
                      {profile.followers && profile.followers.length > 0 ? (
                        <div className="flex items-center group/followers cursor-pointer">
                          {profile.followers.slice(0, 4).map((followerId, i) => (
                            <div
                              key={followerId}
                              className="w-5 h-5 rounded-full bg-slate-200 border-2 border-white overflow-hidden transition-all duration-300 -ml-1.5 first:ml-0 group-hover/followers:-ml-0.5 group-hover/followers:shadow-sm shrink-0"
                              style={{ zIndex: 10 - i }}
                            >
                              <img
                                src={getAvatarUrl(followerId)}
                                alt="Follower"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span className="ml-0.5">
                        {profile.followerCount || 0} <span className="text-slate-600 font-medium">followers</span>
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 text-[12px] font-bold text-slate-900 tracking-wide">
                      {profile.followingCount || 0} <span className="text-slate-600 font-medium">following</span>
                    </span>
                  </div>
                  {profile.bio && <p className="text-[14px] text-slate-700 mt-4 leading-relaxed max-w-xl mx-auto sm:mx-0 font-medium">{profile.bio}</p>}
                  
                  {/* Social Links & Skills */}
                  {(profile.website || profile.twitter || profile.github_url || profile.linkedin_url || (profile.skills && profile.skills.length > 0)) && (
                    <div className="mt-5 space-y-4 max-w-xl mx-auto sm:mx-0">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                        {profile.website && (
                          <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[12px] font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full transition-colors">
                            <Globe className="w-3.5 h-3.5" /> Website
                          </a>
                        )}
                        {profile.twitter && (
                          <a href={`https://twitter.com/${profile.twitter.replace('@', '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[12px] font-bold text-slate-600 hover:text-[#1DA1F2] bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full transition-colors">
                            <Twitter className="w-3.5 h-3.5" /> Twitter
                          </a>
                        )}
                        {profile.github_url && (
                          <a href={profile.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[12px] font-bold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full transition-colors">
                            <Github className="w-3.5 h-3.5" /> GitHub
                          </a>
                        )}
                        {profile.linkedin_url && (
                          <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[12px] font-bold text-slate-600 hover:text-[#0A66C2] bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-full transition-colors">
                            <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                          </a>
                        )}
                      </div>
                      
                      {profile.skills && profile.skills.length > 0 && (
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          {profile.skills.map(skill => (
                            <span key={skill} className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto justify-center md:justify-end mt-4 md:mt-0 flex-wrap">
            <button
              onClick={handleShare}
              className="flex items-center justify-center w-full sm:w-auto gap-2 px-5 py-2.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-full text-[13px] font-bold text-slate-700 transition-colors"
            >
              <Share className="w-4 h-4" /> Share
            </button>
            {isOwn && !(profile as any).isVerifiedExpert && !expertApp && (
              <Link
                to="/dashboard/expert-apply"
                className="flex items-center justify-center w-full sm:w-auto gap-2 px-5 py-2.5 border border-[#8B7CF8]/30 bg-[#6C5CE7]/10 hover:bg-[#6C5CE7]/20 rounded-full text-[13px] font-bold text-[#8B7CF8] transition-colors"
              >
                <ShieldCheck className="w-4 h-4" /> Become Verified Expert
              </Link>
            )}
            {isOwn && expertApp?.status === "pending" && (
              <span className="flex items-center gap-2 px-5 py-2.5 border border-amber-500/20 bg-amber-500/5 rounded-full text-[13px] font-bold text-amber-400">
                <Clock className="w-4 h-4" /> Application under review
              </span>
            )}
            {isOwn ? (
              editing ? (
                <>
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
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center justify-center w-full sm:w-auto gap-2 px-5 py-2.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-full text-[13px] font-bold text-slate-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4" /> Edit Profile
                </button>
              )
            ) : (
              <button
                onClick={handleFollowToggle}
                disabled={followLoading || !user}
                className={`flex items-center justify-center w-full sm:w-auto gap-2 px-5 py-2.5 rounded-full text-[13px] font-bold transition-all disabled:opacity-50 ${
                  isFollowing 
                    ? 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-red-500/50 hover:text-red-400 group' 
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserMinus className="w-4 h-4 hidden group-hover:block" />
                    <span className="hidden group-hover:block">Unfollow</span>
                    <span className="group-hover:hidden flex items-center gap-2"><Check className="w-4 h-4" /> Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" /> Follow
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expert card */}
      {(profile as any).isVerifiedExpert && (
        <div className="mb-8 bg-gradient-to-br from-[#6C5CE7]/10 to-[#8B7CF8]/5 border border-[#6C5CE7]/20 rounded-[24px] p-6">
          <div className="flex items-center gap-3 mb-5">
            <ExpertBadge tier={(profile as any).expertLevel || "bronze"} size="lg" />
            <div className="ml-auto flex items-center gap-2">
              {(profile as any).expertAvailable ? (
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Available
                </span>
              ) : (
                <span className="text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">Unavailable</span>
              )}
            </div>
          </div>
          {(profile as any).expertDomains?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {((profile as any).expertDomains as string[]).map((d: string) => (
                <span key={d} className="px-2.5 py-1 rounded-full bg-[#8B7CF8]/10 border border-[#8B7CF8]/20 text-[#8B7CF8] text-[11px] font-bold">{d}</span>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { icon: Star, label: "Review score", value: (profile as any).expertReviewScore ? `${(profile as any).expertReviewScore}/5.0` : "—" },
              { icon: CheckCircle, label: "Reviews done", value: (profile as any).expertReviewsCompleted || 0 },
              { icon: TrendingUp, label: "Acceptance rate", value: (profile as any).expertAcceptanceRate ? `${(profile as any).expertAcceptanceRate}%` : "—" },
              { icon: Clock, label: "Avg. response", value: (profile as any).expertAvgResponseHours ? `${(profile as any).expertAvgResponseHours}h` : "—" },
              { icon: ShieldCheck, label: "Open slots", value: (profile as any).expertOpenSlots ?? 3 },
              { icon: Users, label: "Followers", value: profile.followerCount || 0 },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
                <Icon className="w-4 h-4 text-[#8B7CF8] mx-auto mb-1" />
                <div className="text-[16px] font-extrabold text-slate-900">{value}</div>
                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-10">
        {[
          { label: 'Rooms', value: rooms.length, color: 'text-emerald-400', bg: 'bg-emerald-400/5', border: 'border-emerald-400/10' },
          { label: 'Reputation', value: profile.reputation, color: 'text-amber-400', bg: 'bg-amber-400/5', border: 'border-amber-400/10' },
          { label: 'Role', value: profile.role, color: 'text-[#8B7CF8]', bg: 'bg-[#6C5CE7]/5', border: 'border-[#6C5CE7]/10', capitalize: true },
        ].map((s, idx) => (
          <div key={s.label} className={`border ${s.border} ${s.bg} rounded-[16px] md:rounded-[20px] p-4 md:p-6 text-center backdrop-blur-sm ${idx === 2 ? 'col-span-2 md:col-span-1' : ''}`}>
            <div className={`text-[28px] md:text-[32px] font-black ${s.color} capitalize font-display leading-none mb-2`}>{s.value}</div>
            <div className="text-[10px] md:text-[11px] font-bold text-slate-600 uppercase tracking-widest">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Integrations (Only visible to the owner if they are a builder) */}
      {isOwn && profile.role === 'builder' && (
        <Integrations userId={id!} />
      )}

      {/* Rooms */}
      <div>
        <h2 className="text-[20px] font-extrabold text-slate-900 mb-6 font-display">
          {isOwn ? 'My Rooms' : `${profile.name}'s Rooms`}
        </h2>
        {rooms.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[24px]">
            <Hammer className="w-12 h-12 mx-auto mb-4 text-slate-600" />
            <p className="text-[15px] font-bold text-slate-600 mb-2">No rooms yet</p>
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
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-[20px] p-5 hover:border-[#6C5CE7]/50 hover:bg-slate-50 transition-all group backdrop-blur-sm hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-[16px] text-slate-900 group-hover:text-[#8B7CF8] transition-colors font-display mb-2 truncate">{room.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-[12px] font-medium text-slate-600">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-widest font-mono ${room.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200'}`}>
                      {room.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                      {room.status}
                    </span>
                    <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-slate-300"/> {room.updateCount} updates</span>
                    <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-slate-300"/> <ObserverAvatarStack room={room as any} /></span>
                    <span className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-slate-300"/> {timeAgo(room.updatedAt)}</span>
                  </div>
                </div>
                {room.status !== 'active' && (
                  <button
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(`/dashboard/build-logs/${room.id}`);
                    }}
                    className="shrink-0 text-[12px] font-bold px-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all whitespace-nowrap"
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
  );
}
