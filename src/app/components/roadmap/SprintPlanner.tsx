import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useSprints, useCreateSprint, useRoadmapItems, useUpdateRoadmapItem, useDeleteRoadmapItem } from '../../hooks/useRoadmap';
import { Loader2, Plus, Calendar as CalendarIcon, MoreVertical, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function SprintPlanner() {
  const { user } = useAuth();
  const builderId = user?.id || '';
  
  const { data: sprints, isLoading: sprintsLoading } = useSprints(builderId);
  const { data: items, isLoading: itemsLoading } = useRoadmapItems(builderId);
  const { mutateAsync: createSprint } = useCreateSprint();
  const { mutateAsync: updateItem } = useUpdateRoadmapItem();
  const { mutateAsync: deleteItem } = useDeleteRoadmapItem();

  const [isCreating, setIsCreating] = useState(false);
  const [newSprintName, setNewSprintName] = useState('');
  
  const isLoading = sprintsLoading || itemsLoading;

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSprintName.trim()) return;

    try {
      await createSprint({
        builder_id: builderId,
        name: newSprintName,
        status: 'planned'
      });
      setNewSprintName('');
      setIsCreating(false);
      toast.success('Sprint created');
    } catch (err) {
      toast.error('Failed to create sprint');
    }
  };

  const assignItemToSprint = async (itemId: string, sprintId: string | null) => {
    try {
      await updateItem({ id: itemId, updates: { sprint_id: sprintId } });
      toast.success(sprintId ? 'Item assigned to sprint' : 'Item removed from sprint');
    } catch (err) {
      toast.error('Failed to update item sprint');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteItem({ id: itemId });
      toast.success('Task deleted');
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>;
  }

  const backlogItems = items?.filter(i => !i.sprint_id) || [];

  return (
    <div className="flex gap-6 h-full flex-col lg:flex-row items-start">
      {/* Sprints List */}
      <div className="flex-1 w-full space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-slate-900">Your Sprints</h2>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-500 hover:bg-[#5b4ed6] text-white rounded-lg text-[12px] font-bold transition-all focus-ring"
          >
            <Plus className="w-4 h-4" /> New Sprint
          </button>
        </div>

        {isCreating && (
          <form onSubmit={handleCreateSprint} className="bg-white p-4 rounded-xl border border-primary-200 shadow-sm flex items-center gap-3">
            <input
              autoFocus
              type="text"
              placeholder="e.g. Sprint 1 - Core Features"
              value={newSprintName}
              onChange={(e) => setNewSprintName(e.target.value)}
              className="flex-1 text-[13px] font-medium outline-none placeholder:text-slate-400 bg-transparent"
            />
            <button type="button" onClick={() => setIsCreating(false)} className="px-3 py-1.5 text-slate-500 hover:bg-slate-50 rounded-lg text-[12px] font-bold">Cancel</button>
            <button type="submit" className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[12px] font-bold">Save</button>
          </form>
        )}

        <div className="space-y-4">
          {sprints?.length === 0 && !isCreating ? (
            <div className="text-center p-8 border border-dashed border-slate-200 rounded-2xl">
              <p className="text-slate-500 text-[13px]">No sprints created yet. Sprints help you group tasks for focused development.</p>
            </div>
          ) : (
            sprints?.map(sprint => {
              const sprintItems = items?.filter(i => i.sprint_id === sprint.id) || [];
              return (
                <div key={sprint.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                        <CalendarIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-[14px]">{sprint.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] font-medium text-slate-500">
                          <span className={`px-2 py-0.5 rounded-full capitalize ${
                            sprint.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                            sprint.status === 'completed' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {sprint.status}
                          </span>
                          {sprintItems.length} items
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-50 min-h-[100px]">
                    {sprintItems.length === 0 ? (
                      <p className="text-[12px] text-slate-400 text-center py-4">No items assigned to this sprint.</p>
                    ) : (
                      <div className="space-y-2">
                        {sprintItems.map(item => (
                          <div key={item.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <span className={`w-2 h-2 rounded-full ${item.status === 'completed' ? 'bg-purple-500' : item.status === 'now' ? 'bg-emerald-500' : item.status === 'next' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                              <span className="text-[13px] font-medium text-slate-700">{item.title}</span>
                            </div>
                            <button 
                              onClick={() => assignItemToSprint(item.id, null)}
                              className="text-[11px] font-bold text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Backlog Sidebar */}
      <div className="w-full lg:w-[320px] shrink-0">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-[100px]">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-[14px]">Backlog</h3>
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[11px] font-bold">
              {backlogItems.length}
            </span>
          </div>
          <div className="p-3 bg-slate-50 min-h-[300px] max-h-[600px] overflow-y-auto custom-scrollbar space-y-2">
            {backlogItems.length === 0 ? (
              <p className="text-[12px] text-slate-400 text-center py-4">No unassigned items.</p>
            ) : (
              backlogItems.map(item => (
                <div key={item.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm group">
                  <div className="flex items-start justify-between">
                    <span className="text-[13px] font-medium text-slate-700 leading-tight pr-2">{item.title}</span>
                    <div className="relative group/menu">
                      <button className="text-slate-400 hover:text-slate-600"><MoreVertical className="w-4 h-4" /></button>
                      <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl py-1 w-40 z-10 hidden group-hover/menu:block">
                        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assign to</div>
                        {sprints?.length === 0 ? (
                          <div className="px-3 py-1.5 text-[12px] text-slate-500">No sprints available</div>
                        ) : (
                          sprints?.map(sprint => (
                            <button
                              key={sprint.id}
                              onClick={() => assignItemToSprint(item.id, sprint.id)}
                              className="w-full text-left px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
                            >
                              {sprint.name}
                            </button>
                          ))
                        )}
                        <div className="h-px bg-slate-100 my-1 mx-2" />
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="w-full flex items-center gap-2 text-left px-3 py-1.5 text-[12px] font-medium text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Task
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
