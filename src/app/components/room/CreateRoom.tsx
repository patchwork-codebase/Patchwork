import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth, supabase } from "../auth/AuthContext";
import { ArrowLeft, Plus, X, ArrowRight, Sparkles, Image as ImageIcon, ChevronDown, Lock, FileText, Users, Rocket, LayoutTemplate, Crosshair, Loader2, Check, Hammer } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

const SUGGESTED_TAGS = ['design', 'engineering', 'product', 'research', 'writing', 'growth'];

const BUILDER_TRACKS = [
  { value: 'product-manager', label: 'Product PM', emoji: '📋', desc: 'Define what gets built, align teams, and track milestones.' },
  { value: 'founder', label: 'Founder', emoji: '🚀', desc: 'Build the company, share traction, and scale operations.' },
  { value: 'engineer', label: 'Engineer', emoji: '⚙️', desc: 'Write code, design architectures, and share technical snippets.' },
  { value: 'product-designer', label: 'Designer', emoji: '🎨', desc: 'Craft customer experiences, test flows, and iterate in public.' },
  { value: 'researcher', label: 'Researcher', emoji: '🔬', desc: 'Interview customers, formulate hypotheses, and track signals.' },
  { value: 'growth', label: 'Growth', emoji: '📈', desc: 'Run growth experiments, track metrics, and optimize conversions.' },
];

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

export default function CreateRoom() {
  const { token, profile, withVerification, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [upgrading, setUpgrading] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState('');

  const handleUpgradeToBuilder = async () => {
    if (!user || !selectedTrack) return;
    setUpgrading(true);
    try {
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (fetchError) throw fetchError;

      const payload = {
        ...currentUser,
        role: 'builder',
        domain: selectedTrack,
        signup_completed_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('users')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;

      await supabase.auth.updateUser({
        data: { role: 'builder' }
      });

      await refreshProfile();
      toast.success(`Welcome to the builder track! You are now a Builder (${selectedTrack}).`);
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || 'Failed to update role.');
    } finally {
      setUpgrading(false);
    }
  };

  const [form, setForm] = useState({ 
    title: '', 
    slug: '', 
    description: '', 
    tagInput: '',
    coverImage: null as string | null,
    primaryLink: '',
    projectStage: 'Ideation',
    primaryGoal: 'Just sharing my journey',
    isPrivate: false
  });
  const [tags, setTags] = useState<string[]>([]);
  const [slugError, setSlugError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'active' | 'draft'>('active');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  const [currentStep, setCurrentStep] = useState(0);
  const steps = ['Basics', 'Context', 'Details'];

  useEffect(() => {
    async function loadTemplates() {
      try {
        const { data, error } = await supabase.from('room_templates').select('*').order('created_at', { ascending: true });
        if (!error && data) {
          const uniqueTemplates = data.filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i);
          setTemplates(uniqueTemplates);
        }
      } catch (e) {
        console.error("Failed to load templates", e);
      } finally {
        setLoadingTemplates(false);
      }
    }
    loadTemplates();
  }, []);

  if (profile?.role !== 'builder') {
    return (
      <div className="max-w-[1100px] mx-auto px-6 py-12 flex flex-col items-center justify-center min-h-[75vh]">
        <div className="bg-[#15131C] border border-white/[0.08] rounded-[32px] p-8 sm:p-12 text-center max-w-lg w-full backdrop-blur-md relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="absolute top-0 right-0 p-32 bg-primary-500/10 rounded-full blur-[80px] pointer-events-none -z-10" />
          
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-400/20 flex items-center justify-center text-purple-400 mx-auto mb-4 animate-pulse">
            <Hammer className="w-6 h-6" />
          </div>

          <h2 className="text-[28px] font-extrabold text-white mb-2 font-display">Upgrade to Builder</h2>
          <p className="text-slate-400 mb-6 text-[13.5px] leading-relaxed max-w-md mx-auto font-medium">
            Only builders can create rooms. Select a track below to activate your Builder status and get started.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6 text-left">
            {BUILDER_TRACKS.map(track => {
              const isSelected = selectedTrack === track.value;
              return (
                <button
                  key={track.value}
                  onClick={() => setSelectedTrack(track.value)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-purple-400 bg-purple-500/10 shadow-[0_0_10px_rgba(168,85,247,0.15)]'
                      : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="text-[14px] mr-1">{track.emoji}</span>
                  <span className="text-[13px] font-bold text-white leading-tight">{track.label}</span>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug font-medium line-clamp-1">{track.desc}</p>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/[0.06]">
            <Link to="/dashboard" className="flex-1 py-3 border border-white/[0.08] hover:bg-white/5 text-slate-300 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2">
              <ArrowLeft size={16} /> Back to dashboard
            </Link>
            <button
              onClick={handleUpgradeToBuilder}
              disabled={upgrading || !selectedTrack}
              className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-extrabold rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {upgrading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Upgrading...</>
              ) : (
                <><Check className="w-4 h-4" /> Activate Status</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  function addTag(tag: string) {
    const clean = tag.trim().toLowerCase().replace(/\s+/g, '-');
    if (clean && !tags.includes(clean) && tags.length < 5) {
      setTags(t => [...t, clean]);
    }
    setForm(f => ({ ...f, tagInput: '' }));
  }

  function removeTag(tag: string) {
    setTags(t => t.filter(x => x !== tag));
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setForm(f => ({ ...f, coverImage: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => {
    if (currentStep === 0) {
      if (!form.title.trim()) {
        toast.error("Please enter a room title.");
        return;
      }
      if (!form.slug.trim() || slugError) {
        toast.error("Please enter a valid, unique URL slug.");
        return;
      }
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(c => c + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(c => c - 1);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    withVerification(async () => {
      if (!form.title.trim() || !form.slug.trim() || !profile) return;

      if (form.slug === 'test' || form.slug === 'demo') {
        setSlugError('This slug is already taken. Please choose another.');
        return;
      }

      setLoading(true);
      try {
        const roomId = window.crypto?.randomUUID?.() || `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();
        
        let coverImageUrl = null;
        if (form.coverImage) {
          toast.loading("Uploading cover image...", { id: "upload" });
          
          try {
            const { data, error } = await supabase.functions.invoke('upload-image', {
              body: { image: form.coverImage }
            });
            if (error) throw error;
            coverImageUrl = data?.secure_url || null;
            toast.dismiss("upload");
          } catch (error: unknown) {
            toast.dismiss("upload");
            throw new Error(`Image upload failed: ${(error instanceof Error ? error.message : String(error))}`);
          }
        }

        const payload = {
          id: roomId,
          builder_id: profile.id,
          builder_name: profile.name || 'Builder',
          title: form.title.trim(),
          description: form.description.trim(),
          tags,
          status: submitStatus,
          update_count: 0,
          observer_count: 0,
          last_update: '',
          created_at: now,
          updated_at: now,
          cover_image: coverImageUrl,
          primary_link: form.primaryLink.trim() || null,
          project_stage: form.projectStage,
          primary_goal: form.primaryGoal,
          is_private: form.isPrivate
        };

        const { error } = await supabase
          .from('rooms')
          .insert(payload);
          
        if (error) throw error;
        
        toast.success('Room created successfully!');
        navigate(`/dashboard/room/${roomId}`);
      } catch (err: unknown) {
        toast.error(`Failed to create room: ${(err instanceof Error ? err.message : String(err))}`);
      } finally {
        setLoading(false);
      }
    });
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* Templates Section */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <h3 className="text-[14px] font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-400" /> Start from a template
              </h3>
              {loadingTemplates ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {templates.map(tpl => {
                    const IconMatch = {
                      FileText: FileText,
                      Users: Users,
                      Rocket: Rocket,
                      Sparkles: Sparkles,
                      LayoutTemplate: LayoutTemplate,
                      Crosshair: Crosshair
                    }[tpl.icon as string] || FileText;
                    
                    const isSelected = selectedTemplate === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => {
                          setSelectedTemplate(tpl.id);
                          setForm(f => ({ ...f, description: tpl.template_context.replace(/\\n/g, '\n') }));
                          setTags(tpl.recommended_tags || []);
                          toast.success(`Applied ${tpl.name} template!`);
                        }}
                        className={`text-left p-4 rounded-xl border transition-all ${isSelected ? 'border-primary-400 bg-primary-400/5 ring-1 ring-primary-400' : 'border-slate-200 bg-white hover:border-primary-400/50 hover:shadow-sm'}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <IconMatch className={`w-4 h-4 ${isSelected ? 'text-primary-400' : 'text-slate-500'}`} />
                          <span className={`text-[13px] font-bold ${isSelected ? 'text-primary-400' : 'text-slate-900'}`}>{tpl.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-medium line-clamp-2">{tpl.description}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cover Image Upload */}
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-2">Cover Image (Optional)</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 md:h-48 rounded-xl border-2 border-dashed border-slate-200 hover:border-primary-400/50 bg-slate-50 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group"
              >
                {form.coverImage ? (
                  <>
                    <img src={form.coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm font-bold flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" /> Change Image
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-slate-400 flex flex-col items-center gap-2">
                    <ImageIcon className="w-8 h-8 opacity-50" />
                    <span className="text-[13px] font-medium text-slate-500">Click to upload cover image</span>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-2">
                  Room title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text" required
                  value={form.title}
                  onChange={e => {
                    const newTitle = e.target.value;
                    const newSlug = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                    setForm(f => ({ ...f, title: newTitle, slug: newSlug }));
                    setSlugError('');
                  }}
                  placeholder="e.g. Redesigning merchant onboarding flow"
                  maxLength={100}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-[15px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-400/50 focus:ring-1 focus:ring-primary-400/50 transition-all font-medium"
                />
                <div className="flex justify-end mt-1.5">
                  <span className="text-[11px] font-mono text-slate-400">{form.title.length}/100</span>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-2">
                  URL Slug <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center">
                  <span className="px-4 py-4 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-slate-500 text-[14px] font-mono">patchwork.sh/</span>
                  <input
                    type="text" required
                    value={form.slug}
                    onChange={e => {
                      setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }));
                      setSlugError('');
                    }}
                    placeholder="room-slug"
                    maxLength={50}
                    className={`w-full px-4 py-4 bg-slate-50 border rounded-r-xl text-[14px] font-mono text-slate-900 placeholder-slate-400 focus:outline-none transition-all ${
                      slugError ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-slate-200 focus:border-primary-400/50 focus:ring-1 focus:ring-primary-400/50'
                    }`}
                  />
                </div>
                {slugError ? (
                  <div className="mt-1.5 text-[12px] font-bold text-rose-500">{slugError}</div>
                ) : (
                  <div className="mt-1.5 text-[12px] font-medium text-slate-400">Must be unique to you</div>
                )}
              </div>
            </div>
          </motion.div>
        );
      case 1:
        return (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-2">Description</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="What are you building? Give observers context."
                rows={4}
                maxLength={500}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-[15px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-400/50 focus:ring-1 focus:ring-primary-400/50 transition-all resize-none font-medium leading-relaxed"
              />
              <div className="flex justify-end mt-1.5">
                <span className="text-[11px] font-mono text-slate-400">{form.description.length}/500</span>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-2">Primary Link (Optional)</label>
              <input
                type="text"
                value={form.primaryLink}
                onChange={e => setForm(f => ({ ...f, primaryLink: e.target.value }))}
                placeholder="https://github.com/your/repo or your live site"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl text-[15px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-400/50 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-3">
                Tags <span className="text-slate-500 font-normal ml-1">(up to 5)</span>
              </label>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1.5 bg-primary-400/10 border border-primary-400/20 text-primary-400 text-[11px] px-3 py-1.5 rounded-md font-bold uppercase tracking-wider font-mono">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-slate-900 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={form.tagInput}
                  onChange={e => setForm(f => ({ ...f, tagInput: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(form.tagInput); } }}
                  placeholder="Add a tag..."
                  className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[14px] text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary-400/50 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => addTag(form.tagInput)}
                  disabled={!form.tagInput.trim() || tags.length >= 5}
                  className="px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {SUGGESTED_TAGS.filter(t => !tags.includes(t)).map(tag => (
                  <button
                    key={tag} type="button"
                    onClick={() => addTag(tag)}
                    disabled={tags.length >= 5}
                    className="text-[11px] px-3 py-1.5 border border-dashed border-slate-300 rounded-md text-slate-500 hover:border-slate-400 hover:text-slate-700 transition-colors disabled:opacity-30 uppercase tracking-wider font-bold font-mono"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CustomSelect
                label="Project Stage"
                value={form.projectStage}
                onChange={(val) => setForm(f => ({ ...f, projectStage: val }))}
                options={[
                  { value: "Ideation", label: "Ideation (Just starting)" },
                  { value: "Prototyping", label: "Prototyping (Building MVP)" },
                  { value: "Beta", label: "Beta (Ready for early testers)" },
                  { value: "Launched", label: "Launched (Live)" },
                ]}
              />
              <CustomSelect
                label="Primary Goal"
                value={form.primaryGoal}
                onChange={(val) => setForm(f => ({ ...f, primaryGoal: val }))}
                options={[
                  { value: "Seeking technical feedback", label: "Seeking technical feedback" },
                  { value: "Seeking design critique", label: "Seeking design critique" },
                  { value: "Just sharing my journey", label: "Just sharing my journey" },
                ]}
              />
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-start gap-4 transition-all">
              <div className="flex-1">
                <h4 className="text-[14px] font-bold text-slate-900 mb-1 flex items-center gap-2">
                  Room Visibility
                  {form.isPrivate ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600">Private</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">Public</span>
                  )}
                </h4>
                <p className="text-[13px] text-slate-500 font-medium">
                  {form.isPrivate 
                    ? "Only people with the direct link can view this room." 
                    : "This room will appear in the global Patchwork feed for anyone to discover."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, isPrivate: !f.isPrivate }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 ${form.isPrivate ? 'bg-slate-800' : 'bg-emerald-500'}`}
                role="switch"
                aria-checked={form.isPrivate}
              >
                <span className="sr-only">Toggle visibility</span>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${form.isPrivate ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-[800px] mx-auto px-6 py-12 relative">
      <div className="absolute top-20 left-0 w-96 h-96 bg-primary-400/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <Link to="/dashboard" className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-500 hover:text-slate-900 mb-8 transition-colors group">
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to Dashboard
      </Link>

      <div className="mb-10">
        <h1 className="text-[40px] font-extrabold text-slate-900 font-display tracking-tight leading-tight mb-2">Create a Build Room</h1>
        <p className="text-[15px] text-slate-600 font-medium mb-6">Initialize a dedicated space to share your work-in-progress.</p>
        
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-800">Still validating your idea?</h4>
            <p className="text-xs text-amber-700 font-medium leading-relaxed">
              Use <strong>Discovery Mode</strong> to define hypotheses, record customer interviews, and calculate validation confidence before writing code.
            </p>
          </div>
          <Link 
            to="/dashboard/discovery" 
            className="shrink-0 text-xs font-bold text-amber-800 bg-amber-500/20 hover:bg-amber-500/30 px-4 py-2 rounded-xl transition-all self-start sm:self-center"
          >
            Start Discovery Mode →
          </Link>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-6">
          {steps.map((step, idx) => (
            <div key={step} className="flex-1">
              <div className={`h-1.5 rounded-full transition-colors ${idx <= currentStep ? 'bg-primary-400' : 'bg-slate-200'}`} />
              <p className={`text-[11px] font-bold mt-2 uppercase tracking-wide ${idx <= currentStep ? 'text-primary-400' : 'text-slate-400'}`}>{step}</p>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-[32px] p-8 md:p-10 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col min-h-[400px]">
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>

          <div className="mt-auto pt-8 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
            {currentStep === 0 ? (
              <Link
                to="/dashboard"
                className="px-6 py-3 text-slate-500 hover:text-slate-900 rounded-full text-[14px] font-bold transition-colors text-center w-full sm:w-auto"
              >
                Cancel
              </Link>
            ) : (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-3 text-slate-500 hover:text-slate-900 rounded-full text-[14px] font-bold transition-colors text-center w-full sm:w-auto flex items-center gap-2 justify-center"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}

            <div className="flex gap-3 w-full sm:w-auto justify-end">
              {currentStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-3 bg-primary-400 text-white rounded-full text-[14px] font-bold hover:bg-[#7a6aeb] transition-colors shadow-sm flex items-center gap-2 justify-center w-full sm:w-auto"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    onClick={() => setSubmitStatus('draft')}
                    disabled={loading || !form.title.trim()}
                    className="px-6 py-3 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-full text-[14px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-center"
                  >
                    {loading && submitStatus === 'draft' ? 'Saving...' : 'Save as Draft'}
                  </button>
                  <button
                    type="submit"
                    onClick={() => setSubmitStatus('active')}
                    disabled={loading || !form.title.trim()}
                    className="flex justify-center items-center gap-2 px-6 py-3 bg-primary-400 text-white rounded-full text-[14px] font-bold hover:bg-[#7a6aeb] transition-colors shadow-sm hover:shadow-primary-400/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {loading && submitStatus === 'active' ? 'Creating...' : <>{(!profile || !profile.emailVerified) && <Lock className="w-4 h-4 opacity-70" />}<Check className="w-4 h-4" /> Publish</>}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
