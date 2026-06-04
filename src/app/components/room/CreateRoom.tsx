import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth, apiCall } from "../auth/AuthContext";
import { ArrowLeft, Plus, X, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

const SUGGESTED_TAGS = ['design', 'engineering', 'product', 'research', 'writing', 'growth'];

export default function CreateRoom() {
  const { token, profile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', tagInput: '' });
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      const room = await apiCall('/rooms', {
        method: 'POST',
        body: JSON.stringify({ title: form.title.trim(), description: form.description.trim(), tags }),
      }, token!);
      toast.success('Room created successfully!');
      navigate(`/dashboard/room/${room.id}`);
    } catch (err: any) {
      toast.error(`Failed to create room: ${err.message}`);
    } finally {
      setLoading(false);
    }
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
          <div>
            <label className="block text-[13px] font-bold text-slate-300 mb-2">
              Room title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text" required
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Redesigning merchant onboarding flow"
              maxLength={100}
              className="w-full px-5 py-4 bg-[#0A0910]/50 border border-white/[0.08] rounded-xl text-[15px] text-white placeholder-slate-600 focus:outline-none focus:border-[#6C5CE7]/50 focus:ring-1 focus:ring-[#6C5CE7]/50 transition-all font-medium"
            />
            <div className="flex justify-end mt-1.5">
              <span className="text-[11px] font-mono text-slate-500">{form.title.length}/100</span>
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

          <div className="flex justify-end gap-3 pt-6 border-t border-white/[0.06]">
            <Link
              to="/dashboard"
              className="px-6 py-3 border border-white/[0.08] hover:bg-white/[0.05] text-white rounded-full text-[14px] font-bold transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit" disabled={loading || !form.title.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-white text-[#0A0910] rounded-full text-[14px] font-bold hover:bg-slate-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : <><ArrowRight className="w-4 h-4" /> Initialize Room</>}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
