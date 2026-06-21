import React from "react";
import { Hammer, Eye, Globe, Twitter, Github, Linkedin, X, ChevronDown } from "lucide-react";

function CustomSelect({ value, onChange, options, label }: { value: string, onChange: (v: string) => void, options: {value: string, label: string}[], label: string }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
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
        className={`w-full px-5 py-4 bg-slate-50 border ${isOpen ? 'border-primary-400/50 ring-1 ring-primary-400/50' : 'border-slate-200'} rounded-xl text-[15px] text-slate-900 focus:outline-none transition-all font-medium flex items-center justify-between`}
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
                  ? 'bg-slate-50 text-primary-400 font-bold' 
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

interface EditProfileFormProps {
  editForm: any;
  setEditForm: React.Dispatch<React.SetStateAction<any>>;
  skillInput: string;
  setSkillInput: React.Dispatch<React.SetStateAction<string>>;
  profile: any;
}

export function EditProfileForm({
  editForm,
  setEditForm,
  skillInput,
  setSkillInput,
  profile
}: EditProfileFormProps) {
  return (
                <div className="space-y-4 max-w-md mx-auto sm:mx-0 text-left">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Name</label>
                    <input
                      value={editForm.name}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-900 w-full focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all font-medium"
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
                      className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-900 w-full focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all resize-none font-medium"
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
                              ? 'border-primary-500/50 bg-primary-500/10 text-slate-900 shadow-[0_0_15px_rgba(108,92,231,0.15)]' 
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
                            <Globe className="w-4 h-4 text-slate-500 group-focus-within:text-primary-500 transition-colors" />
                          </div>
                          <input
                            value={editForm.website}
                            onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))}
                            className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-900 w-full focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all placeholder:text-slate-500 shadow-sm"
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
                            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-900 w-full focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all shadow-sm"
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
                            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-900 w-full focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all shadow-sm"
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
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-900 focus:outline-none focus:border-primary-500/50"
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
  );
}
