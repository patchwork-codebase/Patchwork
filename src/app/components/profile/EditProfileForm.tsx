import React, { useState } from "react";
import { Hammer, Eye, ChevronDown, Rocket, Check } from "lucide-react";
import { supabase } from "../auth/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
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
  profile
}: EditProfileFormProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeDomain, setUpgradeDomain] = useState("");
  const [isSubmittingUpgrade, setIsSubmittingUpgrade] = useState(false);
  const queryClient = useQueryClient();

  const handleUpgrade = async () => {
    if (!upgradeDomain) {
      toast.error("Please select a User Type to continue.");
      return;
    }
    
    setIsSubmittingUpgrade(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          role: 'builder',
          domain: upgradeDomain
        })
        .eq('id', profile.id);

      if (error) throw error;
      
      toast.success("Welcome to the Builder community! 🎉");
      setEditForm((f: any) => ({ ...f, role: 'builder', domain: upgradeDomain }));
      setIsUpgrading(false);
      
      // Invalidate both profile and auth state to ensure full sync
      queryClient.invalidateQueries({ queryKey: ['profile', profile.id] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    } catch (err: any) {
      toast.error(`Upgrade failed: ${err.message}`);
    } finally {
      setIsSubmittingUpgrade(false);
    }
  };

  return (
                <div className="space-y-4 w-full text-left">
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
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-slate-50 rounded-xl text-[13px] font-bold text-slate-900 w-fit capitalize">
                        {profile.role === 'builder' ? <Hammer className="w-4 h-4 text-primary-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
                        {profile.role}
                      </div>
                      
                      {profile.role === 'observer' && !isUpgrading && (
                        <button
                          type="button"
                          onClick={() => setIsUpgrading(true)}
                          className="flex items-center gap-2 w-fit px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-[13px] font-bold transition-all shadow-sm"
                        >
                          <Rocket className="w-4 h-4" /> Become a Builder
                        </button>
                      )}

                      {isUpgrading && (
                        <div className="p-5 border border-primary-500/30 bg-primary-500/5 rounded-2xl space-y-4">
                          <div>
                            <h4 className="text-[14px] font-bold text-slate-900 mb-1">Upgrade to Builder</h4>
                            <p className="text-[12px] text-slate-600">Select your primary user type to start creating and managing your own rooms.</p>
                          </div>
                          <div className="relative z-50">
                            <CustomSelect
                              label="User Type"
                              value={upgradeDomain}
                              onChange={setUpgradeDomain}
                              options={[
                                { value: "product-manager", label: "📋 Product Manager" },
                                { value: "founder", label: "🚀 Founder" },
                              ]}
                            />
                          </div>
                          <div className="flex items-center gap-3 pt-2">
                            <button
                              type="button"
                              onClick={handleUpgrade}
                              disabled={isSubmittingUpgrade || !upgradeDomain}
                              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[13px] font-bold transition-all shadow-sm disabled:opacity-50"
                            >
                              <Check className="w-4 h-4" /> {isSubmittingUpgrade ? 'Upgrading...' : 'Confirm Upgrade'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsUpgrading(false)}
                              disabled={isSubmittingUpgrade}
                              className="text-[13px] font-bold text-slate-500 hover:text-slate-900 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Existing User Type for current Builders (read-only or editable) */}
                  {profile.role === 'builder' && (
                    <div className="relative z-40">
                      <CustomSelect
                        label="User Type"
                        value={editForm.domain}
                        onChange={val => setEditForm((f: any) => ({ ...f, domain: val }))}
                        options={[
                          { value: "product-manager", label: "📋 Product Manager" },
                          { value: "founder", label: "🚀 Founder" },
                        ]}
                      />
                    </div>
                  )}

                  {/* Expert Settings Form */}
                  {profile.isVerifiedExpert && (
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

                  {/* Notification Settings Form */}
                  <div className="pt-6 mt-2 border-t border-slate-200 space-y-5">
                    <div>
                      <h3 className="text-[12px] font-bold text-slate-900 uppercase tracking-widest mb-1">Notification Preferences</h3>
                      <p className="text-[12px] text-slate-600">Choose how you want to be notified about activity.</p>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={editForm.email_notifications_enabled !== false}
                            onChange={(e) => setEditForm((f: any) => ({ ...f, email_notifications_enabled: e.target.checked }))}
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                        </label>
                        <span className="text-[13px] font-bold text-slate-900">Email Notifications</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={editForm.in_app_notifications_enabled !== false}
                            onChange={(e) => setEditForm((f: any) => ({ ...f, in_app_notifications_enabled: e.target.checked }))}
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                        </label>
                        <span className="text-[13px] font-bold text-slate-900">In-App Notifications</span>
                      </div>
                    </div>
                  </div>

                </div>
  );
}
