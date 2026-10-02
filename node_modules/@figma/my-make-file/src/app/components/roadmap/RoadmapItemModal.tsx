import React, { useState } from 'react';
import { RoadmapItem, useUpdateRoadmapItem, useAddRoadmapComment, useRoadmapComments, useAssignRoadmapItem, useUnassignRoadmapItem, useDeleteRoadmapComment } from '../../hooks/useRoadmap';
import { AssigneeSelector } from './AssigneeSelector';
import { UserAvatar } from '../ui/UserAvatar';
import { useAuth } from '../auth/AuthContext';
import { useRoomTeam } from '../../hooks/useRoomTeam';
import { motion } from 'motion/react';
import { X, Calendar, Tag, Flag, MessageSquare, Send, Check, Save, Lock, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
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
  const { data: comments } = useRoadmapComments(item.id);
  const { mutateAsync: addComment } = useAddRoadmapComment();
  const { mutateAsync: deleteComment } = useDeleteRoadmapComment();

  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description || '');
  const [dueDate, setDueDate] = useState(item.due_date || '');
  const [priority, setPriority] = useState(item.priority || '');
  const [labels, setLabels] = useState<string[]>(item.labels || []);
  const [newComment, setNewComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const hasUnsavedChanges = title !== item.title || description !== (item.description || '');

  // Check role-based permissions
  const { data: teamData } = useRoomTeam(item.room_id || undefined);
  const assignedUserIds = item.roadmap_assignees?.map(a => a.user_id) || [];
  const isAssignedToMe = !!user?.id && assignedUserIds.includes(user.id);
  const isRoomOwner = !!user?.id && user.id === item.builder_id;
  const isTeamMember = isRoomOwner || (teamData?.members || []).some(m => m.id === user?.id && ['team_member', 'collaborator', 'co_founder', 'org_member', 'expert'].includes(m.role));
  const canEdit = isRoomOwner || isAssignedToMe || isTeamMember;

  // Handle saving changes
  const handleSaveField = async (field: Partial<RoadmapItem>) => {
    setIsSaving(true);
    try {
      await updateItem({ id: item.id, updates: field });
      toast.success('Changes saved');
    } catch (error) {
      console.error('Failed to update field', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
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
          <button onClick={onClose} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-8">
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {!canEdit && (
              <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl flex items-center gap-2 text-xs font-semibold text-amber-800">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Read-only view for Observers. Join as a Team Member to edit tickets and manage tasks.</span>
              </div>
            )}
            <div>
              <input
                type="text"
                value={title}
                readOnly={!canEdit}
                onChange={(e) => canEdit && setTitle(e.target.value)}
                onBlur={() => { if (canEdit && title !== item.title) handleSaveField({ title }); }}
                className={cn(
                  "w-full text-2xl font-bold text-slate-900 border-none outline-none focus:ring-0 p-0 mb-3 placeholder:text-slate-300",
                  !canEdit && "cursor-default"
                )}
                placeholder="Task title..."
              />

              {/* Template Quick Insert Bar */}
              <div className="mb-3 flex items-center gap-2 flex-wrap text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium mr-1 text-[11px] uppercase tracking-wider">Templates:</span>
                <button
                  type="button"
                  onClick={() => {
                    const template = `### User Story\n**As a** [user/role]\n**I want to** [action/feature]\n**So that** [benefit/value]\n\n`;
                    setDescription(prev => prev ? `${prev.trim()}\n\n${template}` : template);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-100 transition-all active:scale-95 cursor-pointer"
                >
                  + User Story
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const template = `### Acceptance Criteria\n- [ ] **Given** [context], **When** [action], **Then** [expected outcome]\n- [ ] **Given** [context], **When** [action], **Then** [expected outcome]\n\n`;
                    setDescription(prev => prev ? `${prev.trim()}\n\n${template}` : template);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-100 transition-all active:scale-95 cursor-pointer"
                >
                  + Acceptance Criteria
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const template = `### Use Cases\n#### Scenario 1: [Name]\n1. **Actor**: [User/System]\n2. **Preconditions**: [State before]\n3. **Main Flow**: [Steps]\n4. **Postconditions**: [Outcome]\n\n`;
                    setDescription(prev => prev ? `${prev.trim()}\n\n${template}` : template);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-100 transition-all active:scale-95 cursor-pointer"
                >
                  + Use Cases
                </button>
              </div>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => { if (description !== item.description) handleSaveField({ description }); }}
                placeholder="Write your description, User Story, Acceptance Criteria, or Use Cases here..."
                className="w-full min-h-[160px] text-slate-700 border border-slate-100 hover:border-slate-300 focus:border-primary-400 focus:ring-1 focus:ring-primary-400 rounded-xl p-3.5 resize-y bg-slate-50 focus:bg-white transition-all text-sm outline-none font-mono leading-relaxed shadow-sm dark:shadow-none"
              />
              <div className="mt-2.5 flex items-center justify-between gap-3">
                <span className="text-[12px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                  {hasUnsavedChanges ? (
                    <span className="text-amber-600 font-semibold">• Unsaved changes</span>
                  ) : (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> All changes saved</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => handleSaveField({ title, description })}
                  disabled={isSaving || !hasUnsavedChanges}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 disabled:opacity-40 text-slate-900 dark:text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                Comments {comments && comments.length > 0 ? `(${comments.length})` : ''}
              </h3>
              
              <div className="space-y-4 mb-6">
                {comments?.map(comment => {
                  const isAuthor = user?.id === comment.user_id;
                  const isOwner = isRoomOwner || user?.id === item.builder_id;
                  const canDeleteComment = isAuthor || isOwner;

                  return (
                    <div key={comment.id} className="flex gap-3 group/comment relative">
                      <div className="w-8 h-8 shrink-0">
                        <UserAvatar userId={comment.user_id} avatarUrl={comment.users.avatar} name={comment.users.name} className="w-8 h-8 rounded-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{comment.users.name}</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{format(new Date(comment.created_at), 'MMM d, h:mm a')}</span>
                          </div>
                          {canDeleteComment && (
                            <button
                              type="button"
                              onClick={() => deleteComment({ commentId: comment.id, itemId: item.id })}
                              className="opacity-0 group-hover/comment:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                              title="Delete comment"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-xl rounded-tl-none inline-block max-w-full leading-relaxed border border-slate-100/80 shadow-sm dark:shadow-none">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  );
                })}
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
                    className="w-full min-h-[80px] text-sm text-slate-900 border border-slate-100 focus:border-primary-400 focus:ring-1 focus:ring-primary-400 rounded-lg p-3 pr-12 resize-y outline-none"
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
                onAssign={(userId) => canEdit && assignUser({ item_id: item.id, user_id: userId })} 
                onUnassign={(userId) => canEdit && unassignUser({ item_id: item.id, user_id: userId })} 
                readonly={!canEdit}
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
