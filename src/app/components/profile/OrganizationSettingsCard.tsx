import React, { useState } from "react";
import { Building2, Save, X } from "lucide-react";
import { supabase } from "../auth/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface OrganizationSettingsCardProps {
  profile: any;
}

export function OrganizationSettingsCard({ profile }: OrganizationSettingsCardProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    organization_name: profile?.organizationName || '',
    organization_logo_url: profile?.organizationLogoUrl || ''
  });
  const queryClient = useQueryClient();

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          organization_name: form.organization_name,
          organization_logo_url: form.organization_logo_url
        })
        .eq('id', profile.id);

      if (error) throw error;
      
      toast.success('Organization branding updated!');
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ['profile', profile.id] });
    } catch (error: any) {
      toast.error(`Failed to update: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="bg-white dark:bg-[#111111]/80 backdrop-blur-xl border border-slate-100 dark:border-white/10 rounded-[24px] p-6 mb-6 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-sm dark:shadow-none">
            {profile?.organizationLogoUrl ? (
              <img loading="lazy" src={profile.organizationLogoUrl} alt={profile.organizationName} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-6 h-6 text-slate-500 dark:text-slate-400" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-[15px] text-slate-900 dark:text-white">{profile?.organizationName || 'No Organization'}</h3>
            <p className="text-[13px] text-slate-500 dark:text-slate-400">Add your company's branding to stand out</p>
          </div>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="px-4 py-2 border border-slate-100 dark:border-white/10 rounded-full text-[13px] font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:text-white hover:bg-white/10 transition-colors shadow-sm dark:shadow-none"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#111111]/80 backdrop-blur-xl border border-slate-100 dark:border-white/10 rounded-[24px] p-6 mb-6 shadow-2xl">
      <div className="flex items-center gap-3 mb-5">
        <Building2 className="w-5 h-5 text-primary-400" />
        <h3 className="font-bold text-[16px] text-slate-900 dark:text-white">Organization Branding</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Organization Name</label>
          <input
            value={form.organization_name}
            onChange={e => setForm(f => ({ ...f, organization_name: e.target.value }))}
            className="px-4 py-2.5 bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-[13px] text-slate-900 dark:text-white w-full focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all placeholder:text-slate-500 shadow-sm dark:shadow-none"
            placeholder="e.g. Acme Corp"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5">Organization Logo URL</label>
          <input
            value={form.organization_logo_url}
            onChange={e => setForm(f => ({ ...f, organization_logo_url: e.target.value }))}
            className="px-4 py-2.5 bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-[13px] text-slate-900 dark:text-white w-full focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all placeholder:text-slate-500 shadow-sm dark:shadow-none"
            placeholder="https://example.com/logo.png"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-white/10">
        <button
          onClick={() => setEditing(false)}
          className="flex items-center gap-2 px-4 py-2 hover:bg-white/10 rounded-full text-[13px] font-bold text-slate-600 dark:text-slate-300 transition-colors"
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
