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
      <div className="flex-1 w-full space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-extrabold text-slate-900 tracking-tight">Your Sprints</h2>
            <p className="text-[13px] text-slate-500 mt-0.5">Organize tasks into focused development cycles.</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary-500 to-indigo-500 hover:from-primary-600 hover:to-indigo-600 shadow-md shadow-primary-500/20 text-white rounded-xl text-[13px] font-bold transition-all focus-ring active:scale-95"
          >
            <Plus className="w-4 h-4" /> New Sprint
          </button>
        </div>

        {isCreating && (
          <form onSubmit={handleCreateSprint} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-lg flex flex-wrap sm:flex-nowrap items-center gap-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary-400" />
            <div className="flex-1 w-full sm:w-auto">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Sprint Name</label>
              <input
                autoFocus
                type="text"
                placeholder="e.g. Beta Launch Phase 1"
                value={newSprintName}
                onChange={(e) => setNewSprintName(e.target.value)}
                className="w-full text-[14px] font-medium outline-none placeholder:text-slate-300 bg-transparent"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0">
              <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-xl text-[12px] font-bold transition-colors">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[12px] font-bold transition-colors shadow-sm">Save Sprint</button>
            </div>
          </form>
        )}

        <div className="space-y-6">
          {sprints?.length === 0 && !isCreating ? (
            <div className="text-center p-12 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
              <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-[14px] font-medium">No sprints created yet.</p>
              <p className="text-slate-400 text-[13px] mt-1">Sprints help you group tasks for focused development.</p>
            </div>
          ) : (
            sprints?.map(sprint => {
              const sprintItems = items?.filter(i => i.sprint_id === sprint.id) || [];
              const isActive = sprint.status === 'active';
              return (
                <div key={sprint.id} className={`bg-white rounded-3xl border ${isActive ? 'border-primary-200 shadow-primary-500/5' : 'border-slate-100 shadow-sm'} shadow-sm hover:shadow-md transition-all overflow-hidden`}>
                  <div className={`p-5 border-b border-slate-100 bg-gradient-to-b ${isActive ? 'from-primary-50/50 to-white' : 'from-slate-50/80 to-white'} flex flex-wrap items-center justify-between gap-4`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl ${isActive ? 'bg-primary-100 text-primary-600 shadow-inner' : 'bg-slate-100 text-slate-500'} flex items-center justify-center shrink-0`}>
                        <CalendarIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-[15px]">{sprint.name}</h3>
                        <div className="flex items-center gap-2.5 mt-1 text-[12px] font-semibold text-slate-500">
                          <span className={`px-2.5 py-0.5 rounded-full capitalize ${
                            sprint.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                            sprint.status === 'completed' ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {sprint.status}
                          </span>
                          <span className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-slate-300" /> {sprintItems.length} items</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5 bg-slate-50/50 min-h-[120px]">
                    {sprintItems.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-6">
                        <p className="text-[13px] font-medium text-slate-400">No items assigned to this sprint.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {sprintItems.map(item => (
                          <div key={item.id} className="bg-white p-3.5 rounded-xl border border-slate-100 shadow-sm hover:shadow hover:border-slate-200 flex items-center justify-between group transition-all">
                            <div className="flex items-center gap-3.5">
                              <span className={`w-2 h-2 rounded-full shadow-sm ${item.status === 'completed' ? 'bg-primary-500 shadow-primary-500/40' : item.status === 'now' ? 'bg-emerald-500 shadow-emerald-500/40' : item.status === 'next' ? 'bg-amber-500 shadow-amber-500/40' : 'bg-slate-400 shadow-slate-400/40'}`} />
                              <span className="text-[14px] font-semibold text-slate-700">{item.title}</span>
                            </div>
                            <button 
                              onClick={() => assignItemToSprint(item.id, null)}
                              className="text-[11px] font-bold text-rose-400 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
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
      <div className="w-full lg:w-[340px] shrink-0">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-md overflow-hidden sticky top-[100px]">
          <div className="p-5 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-[15px]">Backlog</h3>
            <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-inner">
              {backlogItems.length}
            </span>
          </div>
          <div className="p-4 bg-slate-50/50 min-h-[300px] max-h-[600px] overflow-y-auto custom-scrollbar space-y-3">
            {backlogItems.length === 0 ? (
              <p className="text-[13px] font-medium text-slate-400 text-center py-8">No unassigned items.</p>
            ) : (
              backlogItems.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow hover:border-slate-200 transition-all group">
                  <div className="flex items-start justify-between">
                    <span className="text-[13px] font-semibold text-slate-700 leading-snug pr-3">{item.title}</span>
                    <div className="relative group/menu shrink-0">
                      <button className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"><MoreVertical className="w-4 h-4" /></button>
                      <div className="absolute right-0 top-full mt-1 bg-white border border-slate-100 rounded-xl shadow-xl py-1.5 w-48 z-10 hidden group-hover/menu:block origin-top-right animate-in fade-in zoom-in-95 duration-100">
                        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assign to sprint</div>
                        {sprints?.length === 0 ? (
                          <div className="px-3 py-2 text-[12px] font-medium text-slate-500 italic">No sprints available</div>
                        ) : (
                          <div className="max-h-[160px] overflow-y-auto custom-scrollbar">
                            {sprints?.map(sprint => (
                              <button
                                key={sprint.id}
                                onClick={() => assignItemToSprint(item.id, sprint.id)}
                                className="w-full flex flex-col text-left px-3 py-2 text-[12px] text-slate-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                              >
                                <span className="font-bold truncate">{sprint.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="h-px bg-slate-100 my-1 mx-2" />
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="w-full flex items-center gap-2 text-left px-3 py-2 text-[12px] font-bold text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
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
