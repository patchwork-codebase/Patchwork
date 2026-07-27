import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useRoadmapItems, useDependencies, useCreateDependency } from '../../hooks/useRoadmap';
import { Loader2, Link as LinkIcon, ShieldAlert, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../auth/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'motion/react';

export function DependencyMap() {
  const { user } = useAuth();
  const builderId = user?.id || '';
  const queryClient = useQueryClient();
  
  const { data: items, isLoading: itemsLoading } = useRoadmapItems(builderId);
  const { data: dependencies, isLoading: depsLoading } = useDependencies(builderId);
  const { mutateAsync: createDependency } = useCreateDependency();

  const [selectedItem, setSelectedItem] = useState<string>('');
  const [selectedBlocker, setSelectedBlocker] = useState<string>('');

  const isLoading = itemsLoading || depsLoading;

  const handleAddDependency = async () => {
    if (!selectedItem || !selectedBlocker) return;
    if (selectedItem === selectedBlocker) {
      toast.error('An item cannot block itself');
      return;
    }

    try {
      await createDependency({
        item_id: selectedItem,
        depends_on_item_id: selectedBlocker
      });
      setSelectedItem('');
      setSelectedBlocker('');
      toast.success('Dependency added');
    } catch (err) {
      toast.error('Failed to add dependency. It might already exist.');
    }
  };

  const removeDependency = async (id: string) => {
    try {
      const { error } = await supabase.from('roadmap_dependencies').delete().eq('id', id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['roadmap_dependencies'] });
      toast.success('Dependency removed');
    } catch (err) {
      toast.error('Failed to remove dependency');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>;
  }

  // Find items that have dependencies (they are blocked)
  const blockedItems = items?.filter(item => dependencies?.some(d => d.item_id === item.id)) || [];

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* Create Dependency Form */}
      <div className="relative overflow-hidden bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <div className="relative z-10">
          <h3 className="font-bold text-slate-900 text-[16px] mb-6 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 shadow-sm">
              <LinkIcon className="w-4 h-4" />
            </div>
            Create a New Link
          </h3>
          
          <div className="flex flex-col sm:flex-row items-end gap-5">
            <div className="flex-1 w-full">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 ml-1">This Task</label>
              <div className="relative">
                <select 
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full appearance-none p-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-[14px] font-medium text-slate-700 outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 focus:bg-white transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  <option value="" className="text-slate-400">Select the blocked task...</option>
                  {items?.map(item => (
                    <option key={item.id} value={item.id}>{item.title}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
            </div>
            
            <div className="shrink-0 pb-4 hidden sm:flex items-center justify-center w-8 text-slate-300">
              <ArrowRight className="w-5 h-5" />
            </div>
            
            <div className="flex-1 w-full">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 ml-1">Is Blocked By</label>
              <div className="relative">
                <select 
                  value={selectedBlocker}
                  onChange={(e) => setSelectedBlocker(e.target.value)}
                  className="w-full appearance-none p-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-[14px] font-medium text-slate-700 outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-400 focus:bg-white transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  <option value="" className="text-slate-400">Select a blocker...</option>
                  {items?.map(item => (
                    <option key={item.id} value={item.id} disabled={item.id === selectedItem}>{item.title}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleAddDependency}
              disabled={!selectedItem || !selectedBlocker}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl text-[14px] font-bold shadow-lg shadow-primary-500/25 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              Link Tasks
            </button>
          </div>
        </div>
      </div>

      {/* Dependency List View */}
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-slate-900 text-[18px]">Current Blockers</h3>
          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[12px] font-bold">
            {blockedItems.length}
          </span>
        </div>
        
        {blockedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 border border-dashed border-slate-200/80 rounded-3xl bg-slate-50/50">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-300 mb-4 border border-slate-100">
              <LinkIcon className="w-8 h-8" />
            </div>
            <p className="text-slate-500 text-[14px] font-medium max-w-[250px] text-center">No dependencies mapped yet. Linking tasks helps you identify bottlenecks.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {blockedItems.map(item => {
              const itemDeps = dependencies?.filter(d => d.item_id === item.id) || [];
              return (
                <motion.div whileHover={{ scale: 1.01, y: -2 }} key={item.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-transparent flex items-center justify-between">
                    <div className="font-bold text-slate-900 text-[15px]">{item.title}</div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[12px] font-bold border border-rose-100/50">
                      <ShieldAlert className="w-4 h-4" />
                      Blocked by {itemDeps.length} {itemDeps.length === 1 ? 'item' : 'items'}
                    </div>
                  </div>
                  <div className="p-3 bg-white">
                    {itemDeps.map(dep => {
                      const blocker = items?.find(i => i.id === dep.depends_on_item_id);
                      if (!blocker) return null;
                      return (
                        <div key={dep.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all group hover:pl-4">
                          <div className="flex items-center gap-3.5">
                            <span className={`w-2 h-2 rounded-full shadow-sm ${blocker.status === 'completed' ? 'bg-primary-500 shadow-primary-500/40' : blocker.status === 'now' ? 'bg-emerald-500 shadow-emerald-500/40' : blocker.status === 'next' ? 'bg-amber-500 shadow-amber-500/40' : 'bg-slate-300 shadow-slate-300/40'}`} />
                            <span className={`text-[14px] font-medium transition-colors ${blocker.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-700 group-hover:text-slate-900'}`}>
                              {blocker.title}
                            </span>
                          </div>
                          <button 
                            onClick={() => removeDependency(dep.id)}
                            className="text-[12px] font-bold text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg"
                          >
                            Unlink
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
