import React, { useState, useRef } from 'react';
import { Bug, X, Upload, CheckCircle2, MessageSquare, Loader2 } from 'lucide-react';
import { useAuth, supabase } from '../auth/AuthContext';
import { uploadImage } from '../../utils/uploadImage';
import { toast } from 'sonner';

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<'bug' | 'feature'>('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  if (!user) return null; // Only show for logged in users

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Please provide a title and description');
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = null;
      if (imagePreview) {
        try {
          imageUrl = await uploadImage(imagePreview);
        } catch (err) {
          console.error("Image upload failed", err);
          toast.error("Failed to upload image, but continuing with submission...");
        }
      }

      const { error } = await supabase.from('platform_feedback').insert({
        user_id: user.id,
        type,
        title,
        description,
        image_url: imageUrl,
        url: window.location.href,
      });

      if (error) throw error;

      setIsSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        setTitle('');
        setDescription('');
        setImage(null);
        setImagePreview(null);
        setType('bug');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 bg-white border border-slate-200 rounded-2xl shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${
          isOpen ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'
        }`}
        title="Report an issue or suggest a feature"
      >
        <Bug className="w-6 h-6 text-slate-500" />
      </button>

      {/* Modal / Popover */}
      <div
        className={`absolute bottom-0 right-0 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl transition-all origin-bottom-right ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary-500" />
            Send Feedback
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-semibold text-slate-900 mb-1">Feedback Sent!</h4>
            <p className="text-sm text-slate-500">Thank you for helping us improve Patchwork.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Type Selector */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setType('bug')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                  type === 'bug' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Report Bug
              </button>
              <button
                type="button"
                onClick={() => setType('feature')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                  type === 'feature' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Feature Request
              </button>
            </div>

            <div>
              <input
                type="text"
                placeholder="Brief title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                required
              />
            </div>

            <div>
              <textarea
                placeholder={type === 'bug' ? "What went wrong?" : "What should we add?"}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors resize-none"
                required
              />
            </div>

            {/* Image Upload */}
            <div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageChange}
              />
              {imagePreview ? (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-slate-200" />
                  <button
                    type="button"
                    onClick={() => { setImage(null); setImagePreview(null); }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-sm"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Attach screenshot (optional)
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Feedback'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
