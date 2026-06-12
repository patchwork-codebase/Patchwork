import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth, apiCall, supabase } from "../auth/AuthContext";
import { ArrowLeft, Plus, X, ArrowRight, Sparkles, Image as ImageIcon, ChevronDown, Lock } from "lucide-react";
import { toast } from "sonner";

const SUGGESTED_TAGS = ['design', 'engineering', 'product', 'research', 'writing', 'growth'];

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
      <label className="block text-[13px] font-bold text-slate-300 mb-2">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-5 py-4 bg-[#0A0910]/50 border ${isOpen ? 'border-[#6C5CE7]/50 ring-1 ring-[#6C5CE7]/50' : 'border-white/[0.08]'} rounded-xl text-[15px] text-white focus:outline-none transition-all font-medium flex items-center justify-between`}
      >
        <span>{selectedOption ? selectedOption.label : 'Select...'}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-[#1A1825] border border-white/[0.08] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden py-1">
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
                  ? 'bg-[#6C5CE7]/20 text-[#8B7CF8] font-bold' 
                  : 'text-slate-300 hover:bg-white/[0.06] hover:text-white font-medium'
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
  const { token, profile, withVerification } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ 
    title: '', 
    slug: '', 
    description: '', 
    tagInput: '',
    coverImage: null as string | null,
    primaryLink: '',
    projectStage: 'Ideation',
    primaryGoal: 'Just sharing my journey'
  });
  const [tags, setTags] = useState<string[]>([]);
  const [slugError, setSlugError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'active' | 'draft'>('active');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (profile?.role !== 'builder') {
    return (
      <div className="max-w-[1100px] mx-auto px-6 py-20 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-[32px] p-12 text-center backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-[#6C5CE7]/10 rounded-full blur-[80px] pointer-events-none" />
          <h2 className="text-[32px] font-extrabold text-white mb-3 font-display">Builders Only</h2>
          <p className="text-slate-400 mb-8 max-w-sm mx-auto font-medium">Only builders can create rooms. Update your profile role to get started.</p>
          <Link to="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] rounded-full text-white font-bold transition-all">
            <ArrowLeft size={16} /> Back to dashboard
          </Link>
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
            const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dfqvoc8dz/image/upload";
            const CLOUDINARY_API_KEY = "566318394499849";
            const CLOUDINARY_API_SECRET = "wyljhM7EMezYpd5iNFrmqNV3J_I";

            const timestamp = Math.floor(Date.now() / 1000).toString();
            const strToSign = `timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
            
            const encoder = new TextEncoder();
            const data = encoder.encode(strToSign);
            const hashBuffer = await window.crypto.subtle.digest("SHA-1", data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const signature = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

            const formData = new FormData();
            formData.append("file", form.coverImage);
            formData.append("api_key", CLOUDINARY_API_KEY);
            formData.append("timestamp", timestamp);
            formData.append("signature", signature);

            const response = await fetch(CLOUDINARY_URL, {
              method: "POST",
              body: formData,
            });

            const result = await response.json();
            if (!response.ok) {
              throw new Error(result.error?.message || "Cloudinary upload failed");
            }
            coverImageUrl = result.secure_url;
            toast.dismiss("upload");
          } catch (error: any) {
            toast.dismiss("upload");
            throw new Error(`Image upload failed: ${error.message}`);
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
          primary_goal: form.primaryGoal
        };

        const { error } = await supabase
          .from('rooms')
          .insert(payload);
          
        if (error) throw error;
        
        toast.success('Room created successfully!');
        navigate(`/dashboard/room/${roomId}`);
      } catch (err: any) {
        toast.error(`Failed to create room: ${err.message}`);
      } finally {
        setLoading(false);
      }
    });
  }

  return (
    <div className="max-w-[800px] mx-auto px-6 py-12 relative">
      <div className="absolute top-20 left-0 w-96 h-96 bg-[#6C5CE7]/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <Link to="/dashboard" className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-400 hover:text-white mb-8 transition-colors group">
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to Dashboard
      </Link>

      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#6C5CE7]/10 border border-[#6C5CE7]/20 rounded-full mb-4">
          <Sparkles className="w-3.5 h-3.5 text-[#8B7CF8]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#8B7CF8]">New Project</span>
        </div>
        <h1 className="text-[40px] font-extrabold text-white font-display tracking-tight leading-tight mb-2">Create a Build Room</h1>
        <p className="text-[15px] text-slate-400 font-medium">Initialize a dedicated space to share your work-in-progress.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white/[0.02] border border-white/[0.06] rounded-[32px] p-8 md:p-10 shadow-xl backdrop-blur-md relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
        
        <div className="space-y-8 relative z-10">
          {/* Cover Image Upload */}
          <div>
            <label className="block text-[13px] font-bold text-slate-300 mb-2">Cover Image (Optional)</label>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 md:h-48 rounded-xl border-2 border-dashed border-white/[0.1] hover:border-[#6C5CE7]/50 bg-[#0A0910]/50 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group"
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
                <div className="text-slate-500 flex flex-col items-center gap-2">
                  <ImageIcon className="w-8 h-8 opacity-50" />
                  <span className="text-[13px] font-medium">Click to upload cover image</span>
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
              <label className="block text-[13px] font-bold text-slate-300 mb-2">
                Room title <span className="text-rose-400">*</span>
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
                className="w-full px-5 py-4 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[15px] text-white placeholder-slate-600 focus:outline-none focus:border-[#6C5CE7]/50 focus:ring-1 focus:ring-[#6C5CE7]/50 transition-all font-medium"
              />
              <div className="flex justify-end mt-1.5">
                <span className="text-[11px] font-mono text-slate-500">{form.title.length}/100</span>
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-bold text-slate-300 mb-2">
                URL Slug <span className="text-rose-400">*</span>
              </label>
              <div className="flex items-center">
                <span className="px-4 py-4 bg-white/5 border border-r-0 border-white/[0.08] rounded-l-xl text-slate-500 text-[14px] font-mono">patchwork.sh/</span>
                <input
                  type="text" required
                  value={form.slug}
                  onChange={e => {
                    setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }));
                    setSlugError('');
                  }}
                  placeholder="room-slug"
                  maxLength={50}
                  className={`w-full px-4 py-4 bg-[#0A0910]/50 border rounded-r-xl text-[14px] font-mono text-white placeholder-slate-600 focus:outline-none transition-all ${
                    slugError ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-white/[0.08] focus:border-[#6C5CE7]/50 focus:ring-1 focus:ring-[#6C5CE7]/50'
                  }`}
                />
              </div>
              {slugError ? (
                <div className="mt-1.5 text-[12px] font-bold text-rose-400">{slugError}</div>
              ) : (
                <div className="mt-1.5 text-[12px] font-medium text-slate-500">Must be unique to you</div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-slate-300 mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What are you building? Give observers context."
              rows={4}
              maxLength={500}
              className="w-full px-5 py-4 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[15px] text-white placeholder-slate-600 focus:outline-none focus:border-[#6C5CE7]/50 focus:ring-1 focus:ring-[#6C5CE7]/50 transition-all resize-none font-medium leading-relaxed"
            />
            <div className="flex justify-end mt-1.5">
              <span className="text-[11px] font-mono text-slate-500">{form.description.length}/500</span>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-slate-300 mb-2">Primary Link (Optional)</label>
            <input
              type="text"
              value={form.primaryLink}
              onChange={e => setForm(f => ({ ...f, primaryLink: e.target.value }))}
              placeholder="https://github.com/your/repo or your live site"
              className="w-full px-5 py-4 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[15px] text-white placeholder-slate-600 focus:outline-none focus:border-[#6C5CE7]/50 transition-all font-medium"
            />
          </div>

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

          <div>
            <label className="block text-[13px] font-bold text-slate-300 mb-3">
              Tags <span className="text-slate-500 font-normal ml-1">(up to 5)</span>
            </label>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1.5 bg-[#6C5CE7]/15 border border-[#6C5CE7]/30 text-[#8B7CF8] text-[11px] px-3 py-1.5 rounded-md font-bold uppercase tracking-wider font-mono">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-white transition-colors">
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
                className="flex-1 px-5 py-3.5 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-[#6C5CE7]/50 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => addTag(form.tagInput)}
                disabled={!form.tagInput.trim() || tags.length >= 5}
                className="px-5 py-3.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white hover:bg-white/[0.1] hover:border-white/[0.15] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
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
                  className="text-[11px] px-3 py-1.5 border border-dashed border-white/20 rounded-md text-slate-400 hover:border-white/40 hover:text-white transition-colors disabled:opacity-30 uppercase tracking-wider font-bold font-mono"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-white/[0.06]">
            <div className="flex gap-3 ml-auto items-center">
              <Link
                to="/dashboard"
                className="px-6 py-3 text-slate-400 hover:text-white rounded-full text-[14px] font-bold transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                onClick={() => setSubmitStatus('draft')}
                disabled={loading || !form.title.trim()}
                className="px-6 py-3 border border-white/[0.08] hover:bg-white/[0.05] text-white rounded-full text-[14px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && submitStatus === 'draft' ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                type="submit"
                onClick={() => setSubmitStatus('active')}
                disabled={loading || !form.title.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-white text-[#0A0910] rounded-full text-[14px] font-bold hover:bg-slate-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && submitStatus === 'active' ? 'Creating...' : <>{(!profile || !profile.emailVerified) && <Lock className="w-4 h-4 opacity-70" />}<ArrowRight className="w-4 h-4" /> Publish Room</>}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
