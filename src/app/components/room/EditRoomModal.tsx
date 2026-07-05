import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronDown, Image as ImageIcon, Sparkles, Save } from "lucide-react";
import type { Room } from "../../types";
import { toast } from "sonner";
import { supabase } from "../auth/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { SmartImage } from "../ui/SmartImage";

const SUGGESTED_TAGS = ['design', 'engineering', 'product', 'research', 'writing', 'growth'];

function CustomSelect({ value, onChange, options, label }: { value: string, onChange: (v: string) => void, options: {value: string, label: string}[], label: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
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

interface EditRoomModalProps {
  open: boolean;
  onClose: () => void;
  room: Room;
}

export function EditRoomModal({ open, onClose, room }: EditRoomModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    tagInput: '',
    coverImage: null as string | null,
    primaryLink: '',
    projectStage: '',
    primaryGoal: '',
    visibility: 'public' as 'public' | 'unlisted' | 'private' | 'org_only' | 'nda_protected',
    disableDownloads: false,
    disableCopy: false,
    watermark: false,
  });
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && room) {
      setForm({
        title: room.title || '',
        description: room.description || '',
        tagInput: '',
        coverImage: room.coverImage || null,
        primaryLink: room.primaryLink || '',
        projectStage: room.projectStage || 'Ideation',
        primaryGoal: room.primaryGoal || '',
        visibility: room.visibility ?? (room.isPrivate ? 'private' : 'public'),
        disableDownloads: room.protectionFlags?.disableDownloads ?? false,
        disableCopy: room.protectionFlags?.disableCopy ?? false,
        watermark: room.protectionFlags?.watermark ?? false,
      });
      setTags(room.tags || []);
    }
  }, [open, room?.id]);

  if (!open) return null;

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
    if (!form.title.trim()) return;

    setLoading(true);
    try {
      let coverImageUrl = form.coverImage;
      if (form.coverImage && form.coverImage.startsWith('data:')) {
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

          const response = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error?.message || "Upload failed");
          coverImageUrl = result.secure_url;
          toast.dismiss("upload");
        } catch (error: unknown) {
          toast.dismiss("upload");
          throw new Error(`Image upload failed: ${(error instanceof Error ? error.message : String(error))}`);
        }
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        tags,
        updated_at: new Date().toISOString(),
        cover_image: coverImageUrl,
        primary_link: form.primaryLink.trim() || null,
        project_stage: form.projectStage,
        primary_goal: form.primaryGoal,
        visibility: form.visibility,
        is_private: ['private', 'org_only', 'nda_protected'].includes(form.visibility),
        protection_flags: {
          disableDownloads: form.disableDownloads,
          disableCopy: form.disableCopy,
          watermark: form.watermark,
        },
      };

      const { error } = await supabase.from('rooms').update(payload).eq('id', room.id);
      if (error) throw error;
      
      toast.success('Room updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['room-details', room.id] });
      queryClient.invalidateQueries({ queryKey: ['user-rooms'] });
      onClose();
    } catch (err: unknown) {
      toast.error(`Failed to update room: ${(err instanceof Error ? err.message : String(err))}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-ink/80 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-[#1A1825] border border-white/[0.08] rounded-[24px] w-full max-w-[700px] shadow-2xl relative z-10 my-auto flex flex-col max-h-[90vh]"
        >
          <div className="p-6 border-b border-white/[0.08] flex items-center justify-between shrink-0">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-400" /> Edit Room Details
            </h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar">
            <form id="edit-room-form" onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[13px] font-bold text-slate-300 mb-2">Cover Image (Optional)</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 rounded-xl border-2 border-dashed border-white/[0.1] hover:border-primary-500/50 bg-ink/50 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group"
                >
                  {form.coverImage ? (
                    <>
                      <SmartImage src={form.coverImage} alt="Cover preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm font-bold flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Change Image</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-500 flex flex-col items-center gap-2">
                      <ImageIcon className="w-8 h-8 opacity-50" />
                      <span className="text-[13px] font-bold">Click to upload cover image</span>
                    </div>
                  )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleImageUpload} />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-300 mb-2">Room Title</label>
                <input
                  type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  required maxLength={100}
                  placeholder="e.g., Redesigning the onboarding flow"
                  className="w-full px-5 py-4 bg-ink/50 border border-white/[0.08] rounded-xl text-[15px] text-white placeholder-slate-600 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-300 mb-2">Description</label>
                <textarea
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3} maxLength={500}
                  placeholder="What's the goal of this room? What are you trying to accomplish?"
                  className="w-full px-5 py-4 bg-ink/50 border border-white/[0.08] rounded-xl text-[15px] text-white placeholder-slate-600 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all font-medium resize-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-300 mb-2">Primary Project Link</label>
                <input
                  type="url" value={form.primaryLink} onChange={e => setForm(f => ({ ...f, primaryLink: e.target.value }))}
                  placeholder="https://figma.com/... or https://github.com/..."
                  className="w-full px-5 py-4 bg-ink/50 border border-white/[0.08] rounded-xl text-[15px] text-white placeholder-slate-600 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/50 transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CustomSelect
                  label="Project Stage" value={form.projectStage} onChange={(val) => setForm(f => ({ ...f, projectStage: val }))}
                  options={[
                    { value: "Ideation", label: "Ideation (Research & Concepts)" },
                    { value: "Drafting", label: "Drafting (Wireframes & Planning)" },
                    { value: "Prototyping", label: "Prototyping" },
                    { value: "Building", label: "Building (Development)" },
                    { value: "Review", label: "Review & QA" },
                    { value: "Launched", label: "Launched (Live)" },
                  ]}
                />
                <CustomSelect
                  label="Primary Goal" value={form.primaryGoal} onChange={(val) => setForm(f => ({ ...f, primaryGoal: val }))}
                  options={[
                    { value: "Seeking technical feedback", label: "Seeking technical feedback" },
                    { value: "Seeking design critique", label: "Seeking design critique" },
                    { value: "Just sharing my journey", label: "Just sharing my journey" },
                  ]}
                />
              </div>

              {/* Visibility Selector */}
              <div>
                <label className="block text-[13px] font-bold text-slate-300 mb-3">Room Visibility</label>
                <div className="grid grid-cols-1 gap-2">
                  {([
                    { value: 'public', icon: '🌍', label: 'Public', desc: 'Visible to everyone. In feed.' },
                    { value: 'unlisted', icon: '🔗', label: 'Unlisted', desc: 'Direct link only. Not listed.' },
                    { value: 'private', icon: '🔒', label: 'Private', desc: 'Invitation only. Hidden.' },
                    { value: 'org_only', icon: '🏢', label: 'Org Only', desc: 'Verified org members only.' },
                    { value: 'nda_protected', icon: '📜', label: 'NDA Protected', desc: 'NDA required. Access is recorded.' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, visibility: opt.value }))}
                      className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        form.visibility === opt.value
                          ? 'border-primary-400 bg-primary-400/10'
                          : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className="text-lg shrink-0">{opt.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-white">{opt.label}</span>
                          {form.visibility === opt.value && (
                            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary-400/20 text-primary-400">Selected</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Protection Flags */}
              <div>
                <label className="block text-[13px] font-bold text-slate-300 mb-3">Content Protection</label>
                <div className="space-y-2">
                  {([
                    { key: 'disableDownloads', label: 'Disable Downloads', desc: 'Prevent observers from downloading files', icon: '🛇' },
                    { key: 'disableCopy', label: 'Disable Copy', desc: 'Prevent text selection and copying', icon: '📋' },
                    { key: 'watermark', label: 'Watermark Files', desc: 'Add watermarks with name, timestamp, and room ID', icon: '🌊' },
                  ] as const).map(flag => (
                    <div
                      key={flag.key}
                      onClick={() => setForm(f => ({ ...f, [flag.key]: !f[flag.key as keyof typeof f] }))}
                      className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 cursor-pointer transition-all ${
                        form[flag.key as keyof typeof form]
                          ? 'border-primary-400/40 bg-primary-400/10'
                          : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg">{flag.icon}</span>
                        <div>
                          <p className="text-[13px] font-bold text-white">{flag.label}</p>
                          <p className="text-[11px] text-slate-500 font-medium">{flag.desc}</p>
                        </div>
                      </div>
                      <div className={`relative shrink-0 inline-flex h-5 w-9 rounded-full border-2 border-transparent transition-colors ${
                        form[flag.key as keyof typeof form] ? 'bg-primary-400' : 'bg-slate-700'
                      }`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                          form[flag.key as keyof typeof form] ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-300 mb-3">Tags <span className="text-slate-500 font-normal ml-1">(up to 5)</span></label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1.5 bg-primary-500/15 border border-primary-500/30 text-primary-400 text-[11px] px-3 py-1.5 rounded-md font-bold uppercase tracking-wider font-mono">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-white transition-colors"><X className="w-3.5 h-3.5" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-3 mb-4">
                  <input
                    type="text" value={form.tagInput} onChange={e => setForm(f => ({ ...f, tagInput: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(form.tagInput); } }}
                    placeholder="Add a tag..."
                    className="flex-1 px-5 py-3.5 bg-ink/50 border border-white/[0.08] rounded-xl text-[14px] text-white placeholder-slate-600 focus:outline-none focus:border-primary-500/50 transition-all font-medium"
                  />
                  <button
                    type="button" onClick={() => addTag(form.tagInput)} disabled={!form.tagInput.trim() || tags.length >= 5}
                    className="px-5 py-3.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-white hover:bg-white/[0.1] hover:border-white/[0.15] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    + Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_TAGS.filter(t => !tags.includes(t)).map(tag => (
                    <button key={tag} type="button" onClick={() => addTag(tag)} disabled={tags.length >= 5} className="text-[11px] px-3 py-1.5 border border-dashed border-white/20 rounded-md text-slate-400 hover:border-white/40 hover:text-white transition-colors disabled:opacity-30 uppercase tracking-wider font-bold font-mono">
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>

          <div className="p-6 border-t border-white/[0.08] flex justify-end gap-3 shrink-0">
            <button onClick={onClose} className="px-5 py-2.5 text-slate-400 hover:text-white rounded-xl text-[14px] font-bold transition-colors">Cancel</button>
            <button form="edit-room-form" type="submit" disabled={loading || !form.title.trim()} className="flex items-center gap-2 px-6 py-2.5 bg-primary-400 hover:bg-[#7b6ce8] text-white rounded-xl text-[14px] font-bold transition-all disabled:opacity-50 shadow-lg shadow-primary-400/20">
              <Save className="w-4 h-4" /> {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
