import React, { useState, useEffect } from 'react';
import { RoadmapItem, useUpdateRoadmapItem, useAddRoadmapComment, useRoadmapComments, useAssignRoadmapItem, useUnassignRoadmapItem } from '../../hooks/useRoadmap';
import { AssigneeSelector } from './AssigneeSelector';
import { UserAvatar } from '../ui/UserAvatar';
import { useAuth } from '../auth/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Tag, Flag, MessageSquare, Clock, Send } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../ui/utils';

interface RoadmapItemModalProps {
  item: RoadmapItem;
  onClose: () => void;
}

const PREDEFINED_LABELS = ['frontend', 'backend', 'design', 'bug', 'feature', 'planning', 'marketing'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

export function RoadmapItemModal({ item, onClose }: RoadmapItemModalProps) {
  const { user } = useAuth();
  const { mutateAsync: updateItem } = useUpdateRoadmapItem();
  const { mutateAsync: assignUser } = useAssignRoadmapItem();
  const { mutateAsync: unassignUser } = useUnassignRoadmapItem();
  const { data: comments, isLoading: loadingComments } = useRoadmapComments(item.id);
  const { mutateAsync: addComment } = useAddRoadmapComment();

  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description || '');
  const [dueDate, setDueDate] = useState(item.due_date || '');
  const [priority, setPriority] = useState(item.priority || '');
  const [labels, setLabels] = useState<string[]>(item.labels || []);
  const [newComment, setNewComment] = useState('');

  // Handle saving changes
  const handleSaveField = async (field: Partial<RoadmapItem>) => {
    try {
      await updateItem({ id: item.id, updates: field });
    } catch (error) {
      console.error('Failed to update field', error);
    }
  };

  const handleLabelToggle = (label: string) => {
    const newLabels = labels.includes(label) 
      ? labels.filter(l => l !== label) 
      : [...labels, label];
    setLabels(newLabels);
    handleSaveField({ labels: newLabels });
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    try {
      await addComment({ item_id: item.id, user_id: user.id, content: newComment });
      setNewComment('');
    } catch (error) {
      console.error('Failed to post comment', error);
    }
  };

  const assignedUserIds = item.roadmap_assignees?.map(a => a.user_id) || [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex flex-col">
             <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
               {item.status} / {item.sprint_id ? 'Sprint' : 'Unplanned'}
             </span>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => { if (title !== item.title) handleSaveField({ title }); }}
                className="w-full text-2xl font-bold text-slate-900 border-none outline-none focus:ring-0 p-0 mb-2 placeholder:text-slate-300"
                placeholder="Task title..."
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => { if (description !== item.description) handleSaveField({ description }); }}
                placeholder="Add a description..."
                className="w-full min-h-[120px] text-slate-600 border border-transparent hover:border-slate-200 focus:border-primary-400 focus:ring-1 focus:ring-primary-400 rounded-lg p-3 resize-y bg-slate-50 focus:bg-white transition-all text-sm outline-none"
              />
            </div>

            {/* Comments Section */}
            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                Comments
              </h3>
              
              <div className="space-y-4 mb-6">
                {comments?.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 shrink-0">
                      <UserAvatar userId={comment.user_id} avatarUrl={comment.users.avatar} name={comment.users.name} className="w-8 h-8 rounded-full object-cover" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-900">{comment.users.name}</span>
                        <span className="text-xs text-slate-400">{format(new Date(comment.created_at), 'MMM d, h:mm a')}</span>
                      </div>
                      <p className="text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-xl rounded-tl-none inline-block">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
                {comments?.length === 0 && (
                  <p className="text-sm text-slate-500 italic">No comments yet. Be the first to start the discussion!</p>
                )}
              </div>

              <form onSubmit={handlePostComment} className="flex gap-3 items-start">
                <div className="w-8 h-8 shrink-0">
                  <UserAvatar userId={user?.id || ''} avatarUrl={user?.user_metadata?.avatar_url} name={user?.user_metadata?.name || 'User'} className="w-8 h-8 rounded-full object-cover" />
                </div>
                <div className="flex-1 relative">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Ask a question or share an update..."
                    className="w-full min-h-[80px] text-sm text-slate-900 border border-slate-200 focus:border-primary-400 focus:ring-1 focus:ring-primary-400 rounded-lg p-3 pr-12 resize-y outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handlePostComment(e);
                      }
                    }}
                  />
                  <button 
                    type="submit" 
                    disabled={!newComment.trim()}
                    className="absolute bottom-3 right-3 p-1.5 bg-primary-500 text-white rounded-md disabled:opacity-50 disabled:bg-slate-300 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full md:w-64 space-y-6 flex-shrink-0">
            {/* Assignees */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Assignees</h4>
              <AssigneeSelector 
                roomId={item.room_id} 
                assignedUserIds={assignedUserIds} 
                onAssign={(userId) => assignUser({ item_id: item.id, user_id: userId })} 
                onUnassign={(userId) => unassignUser({ item_id: item.id, user_id: userId })} 
              />
            </div>

            {/* Priority */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5" /> Priority
              </h4>
              <select
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  handleSaveField({ priority: e.target.value as any });
                }}
                className="w-full text-sm bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all py-2 outline-none"
              >
                <option value="">None</option>
                {PRIORITIES.map(p => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Due Date
              </h4>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  handleSaveField({ due_date: e.target.value || null });
                }}
                className="w-full text-sm bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-primary-400 focus:bg-white transition-all py-2 outline-none"
              />
            </div>

            {/* Labels */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Labels
              </h4>
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_LABELS.map(label => {
                  const isActive = labels.includes(label);
                  return (
                    <button
                      key={label}
                      onClick={() => handleLabelToggle(label)}
                      className={cn(
                        "text-[11px] font-bold px-2.5 py-1 rounded-full transition-colors border",
                        isActive 
                          ? "bg-primary-100 text-primary-700 border-primary-200" 
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
