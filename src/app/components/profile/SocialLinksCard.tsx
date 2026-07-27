import React, { useState } from "react";
import { Globe, Twitter, Github, Linkedin, Save, X, Link as LinkIcon } from "lucide-react";
import { supabase } from "../auth/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface SocialLinksCardProps {
  profile: any;
}

export function SocialLinksCard({ profile }: SocialLinksCardProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    website: profile?.website || '',
    twitter: profile?.twitter || '',
    github_url: profile?.githubUrl || '',
    linkedin_url: profile?.linkedinUrl || ''
  });
  const queryClient = useQueryClient();

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          website: form.website,
          twitter: form.twitter,
          github_url: form.github_url,
          linkedin_url: form.linkedin_url
        })
        .eq('id', profile.id);

      if (error) throw error;
      
      toast.success('Social links updated!');
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ['profile', profile.id] });
    } catch (error: any) {
      toast.error(`Failed to update: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const hasLinks = profile?.website || profile?.twitter || profile?.githubUrl || profile?.linkedinUrl;

  if (!editing) {
    return (
      <div className="bg-[#111111]/80 backdrop-blur-xl border border-white/10 rounded-[24px] p-6 mb-6 shadow-2xl flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <LinkIcon className="w-5 h-5 text-slate-400" />
            <h3 className="font-bold text-[15px] text-white">Social Links</h3>
          </div>
          
          {hasLinks ? (
            <div className="flex flex-wrap items-center gap-3 mt-4">
              {profile.website && (
                <div className="flex items-center gap-2 text-[13px] font-bold text-slate-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                  <Globe className="w-4 h-4 text-slate-400" /> {profile.website.replace(/^https?:\/\//, '')}
                </div>
              )}
              {profile.twitter && (
                <div className="flex items-center gap-2 text-[13px] font-bold text-slate-300 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                  <Twitter className="w-4 h-4 text-[#1DA1F2]" /> {profile.twitter}
                </div>
              )}
              {profile.githubUrl && (
                <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[12px] font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full transition-colors">
                  <Github className="w-4 h-4" /> {profile.githubUrl.split('/').pop()}
                </a>
              )}
              {profile.linkedinUrl && (
                <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[12px] font-bold text-slate-300 hover:text-[#0A66C2] bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-full transition-colors">
                  <Linkedin className="w-4 h-4 text-[#0A66C2]" /> {profile.linkedinUrl.split('/in/')[1]?.replace(/\/$/, '') || 'LinkedIn'}
                </a>
              )}
            </div>
          ) : (
             <p className="text-[13px] text-slate-400">Connect your profiles to build your network</p>
          )}
        </div>
        <button
          onClick={() => setEditing(true)}
          className="px-4 py-2 border border-white/10 rounded-full text-[13px] font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          {hasLinks ? 'Edit' : 'Add Links'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#111111]/80 backdrop-blur-xl border border-white/10 rounded-[24px] p-6 mb-6 shadow-2xl">
      <div className="flex items-center gap-3 mb-5">
        <LinkIcon className="w-5 h-5 text-primary-400" />
        <h3 className="font-bold text-[16px] text-white">Social Links</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Website URL</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Globe className="w-4 h-4 text-slate-500 group-focus-within:text-primary-500 transition-colors" />
            </div>
            <input
              value={form.website}
              onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
              className="pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[13px] text-white w-full focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all placeholder:text-slate-500"
              placeholder="https://yourwebsite.com"
            />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Twitter</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Twitter className="w-4 h-4 text-slate-500 group-focus-within:text-[#1DA1F2] transition-colors" />
            </div>
            <input
              value={form.twitter}
              onChange={e => setForm(f => ({ ...f, twitter: e.target.value }))}
              className="pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[13px] text-white w-full focus:outline-none focus:border-[#1DA1F2]/50 focus:ring-1 focus:ring-[#1DA1F2]/50 transition-all placeholder:text-slate-500"
              placeholder="@username"
            />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">GitHub</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Github className="w-4 h-4 text-slate-500 group-focus-within:text-white transition-colors" />
            </div>
            <input
              value={form.github_url}
              onChange={e => setForm(f => ({ ...f, github_url: e.target.value }))}
              className="pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[13px] text-white w-full focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all placeholder:text-slate-500"
              placeholder="https://github.com/..."
            />
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">LinkedIn</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Linkedin className="w-4 h-4 text-slate-500 group-focus-within:text-[#0A66C2] transition-colors" />
            </div>
            <input
              value={form.linkedin_url}
              onChange={e => setForm(f => ({ ...f, linkedin_url: e.target.value }))}
              className="pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[13px] text-white w-full focus:outline-none focus:border-[#0A66C2]/50 focus:ring-1 focus:ring-[#0A66C2]/50 transition-all placeholder:text-slate-500"
              placeholder="https://linkedin.com/in/..."
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/10">
        <button
          onClick={() => setEditing(false)}
          className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-full text-[13px] font-bold text-slate-300 transition-colors"
        >
          <X className="w-4 h-4" /> Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-white text-black rounded-full text-[13px] font-bold hover:bg-slate-200 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
