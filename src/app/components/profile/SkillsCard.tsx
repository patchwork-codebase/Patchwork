import React, { useState } from "react";
import { Wrench, Save, X } from "lucide-react";
import { supabase } from "../auth/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface SkillsCardProps {
  profile: any;
}

export function SkillsCard({ profile }: SkillsCardProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [skills, setSkills] = useState<string[]>(profile?.skills || []);
  const [skillInput, setSkillInput] = useState('');
  const queryClient = useQueryClient();

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          skills
        })
        .eq('id', profile.id);

      if (error) throw error;
      
      toast.success('Skills updated!');
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ['profile', profile.id] });
    } catch (error: any) {
      toast.error(`Failed to update: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const hasSkills = profile?.skills && profile.skills.length > 0;

  if (!editing) {
    return (
      <div className="bg-white border border-slate-200 rounded-[24px] p-6 mb-6 shadow-sm flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="w-5 h-5 text-slate-400" />
            <h3 className="font-bold text-[15px] text-slate-900">Tech Stack / Skills</h3>
          </div>
          
          {hasSkills ? (
            <div className="flex flex-wrap gap-2 mt-4">
              {profile.skills.map((skill: string) => (
                <span key={skill} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-[13px] font-medium">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
             <p className="text-[13px] text-slate-500">Add your technical skills and tools</p>
          )}
        </div>
        <button
          onClick={() => setEditing(true)}
          className="px-4 py-2 border border-slate-200 rounded-full text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          {hasSkills ? 'Edit' : 'Add Skills'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-[24px] p-6 mb-6 shadow-sm">
      <div className="flex items-center gap-3 mb-5">
        <Wrench className="w-5 h-5 text-primary-400" />
        <h3 className="font-bold text-[16px] text-slate-900">Tech Stack / Skills</h3>
      </div>
      
      <div className="flex gap-2 mb-3">
        <input
          value={skillInput}
          onChange={e => setSkillInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (skillInput.trim() && !skills.includes(skillInput.trim())) {
                setSkills([...skills, skillInput.trim()]);
                setSkillInput('');
              }
            }
          }}
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:outline-none focus:border-primary-500/50"
          placeholder="Add a skill (e.g. React) and press Enter"
        />
        <button
          type="button"
          onClick={() => {
            if (skillInput.trim() && !skills.includes(skillInput.trim())) {
              setSkills([...skills, skillInput.trim()]);
              setSkillInput('');
            }
          }}
          className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 text-[13px] font-bold rounded-xl transition-colors"
        >
          Add
        </button>
      </div>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {skills.map(skill => (
            <span key={skill} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-[13px] font-medium">
              {skill}
              <button
                type="button"
                onClick={() => setSkills(skills.filter(s => s !== skill))}
                className="text-slate-400 hover:text-red-400 transition-colors ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
        <button
          onClick={() => {
            setEditing(false);
            setSkills(profile?.skills || []); // Reset on cancel
          }}
          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 rounded-full text-[13px] font-bold text-slate-600 transition-colors"
        >
          <X className="w-4 h-4" /> Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white rounded-full text-[13px] font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
