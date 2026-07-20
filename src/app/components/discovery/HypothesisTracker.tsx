import React, { useState } from 'react';
import { useDiscoveryHypotheses, useMutateHypothesis, useDeleteDiscoveryEntity } from '../../hooks/useDiscovery';
import { DiscoveryHypothesis } from '../../types/discovery';
import { Plus, Trash2, Edit2, Check, X, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';

interface HypothesisTrackerProps {
  projectId: string;
  isObserver?: boolean;
}

export default function HypothesisTracker({ projectId, isObserver = false }: HypothesisTrackerProps) {
  const { data: hypotheses, isLoading } = useDiscoveryHypotheses(projectId);
  const mutateHypothesis = useMutateHypothesis();
  const deleteEntity = useDeleteDiscoveryEntity();

  const [statement, setStatement] = useState('');
  const [successIndicators, setSuccessIndicators] = useState('');
  const [failureIndicators, setFailureIndicators] = useState('');

  const [editingHypothesis, setEditingHypothesis] = useState<DiscoveryHypothesis | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statement.trim()) return;

    try {
      await mutateHypothesis.mutateAsync({
        project_id: projectId,
        statement: statement.trim(),
        success_indicators: successIndicators.trim() || undefined,
        failure_indicators: failureIndicators.trim() || undefined,
      });
      setStatement('');
      setSuccessIndicators('');
      setFailureIndicators('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHypothesis || !editingHypothesis.statement.trim()) return;

    try {
      await mutateHypothesis.mutateAsync({
        id: editingHypothesis.id,
        project_id: projectId,
        statement: editingHypothesis.statement.trim(),
        success_indicators: editingHypothesis.success_indicators?.trim() || undefined,
        failure_indicators: editingHypothesis.failure_indicators?.trim() || undefined,
      } as any);
      setEditingHypothesis(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hypothesis?')) return;
    try {
      await deleteEntity.mutateAsync({
        table: 'discovery_hypotheses',
        id,
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Create / Edit Form */}
      {!isObserver && (
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-6 shadow-sm">
            {editingHypothesis ? (
              <form onSubmit={handleEditSave} className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-md font-bold text-slate-900 flex items-center gap-1.5">
                    <Edit2 className="w-4 h-4 text-primary-400" /> Edit Hypothesis
                  </h3>
                  <button 
                    type="button" 
                    onClick={() => setEditingHypothesis(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                  >
                    Cancel
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">If-Then Statement</label>
                  <textarea
                    required
                    value={editingHypothesis.statement}
                    onChange={e => setEditingHypothesis({ ...editingHypothesis, statement: e.target.value })}
                    placeholder="If we [do X], then [Y will happen]..."
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Success Indicators</label>
                  <textarea
                    value={editingHypothesis.success_indicators || ''}
                    onChange={e => setEditingHypothesis({ ...editingHypothesis, success_indicators: e.target.value })}
                    placeholder="What proves this is true? (e.g. 5 conversions)"
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Failure Indicators</label>
                  <textarea
                    value={editingHypothesis.failure_indicators || ''}
                    onChange={e => setEditingHypothesis({ ...editingHypothesis, failure_indicators: e.target.value })}
                    placeholder="What disproves this? (e.g. 0 interviews)"
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary-400 hover:bg-[#7a6aeb] text-white font-bold py-2 rounded-xl text-sm transition-colors"
                >
                  Save Changes
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-md font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary-400" /> New Hypothesis
                </h3>
                <p className="text-xs text-slate-500">Draft a clear statement along with concrete metrics to measure validity.</p>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Hypothesis Statement</label>
                  <textarea
                    required
                    value={statement}
                    onChange={e => setStatement(e.target.value)}
                    placeholder="e.g. We believe solo builders will pay $10/mo for structured discovery tools because it saves hours of wasted build time."
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Success Indicators</label>
                  <textarea
                    value={successIndicators}
                    onChange={e => setSuccessIndicators(e.target.value)}
                    placeholder="e.g. At least 5 out of 10 interviewees express intent to purchase."
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Failure Indicators</label>
                  <textarea
                    value={failureIndicators}
                    onChange={e => setFailureIndicators(e.target.value)}
                    placeholder="e.g. Builders say they prefer simple notes/Notion docs for everything."
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 bg-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!statement.trim()}
                  className="w-full bg-primary-400 hover:bg-[#7a6aeb] disabled:opacity-50 text-white font-bold py-2 rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Hypothesis
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Hypothesis List */}
      <div className={`${isObserver ? 'lg:col-span-3' : 'lg:col-span-2'} space-y-4`}>
        <h3 className="text-lg font-bold text-slate-900">Project Hypotheses</h3>
        
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2].map(i => (
              <div key={i} className="h-28 bg-slate-100 rounded-2xl" />
            ))}
          </div>
        ) : hypotheses?.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h4 className="text-md font-bold text-slate-900 mb-1">No Hypotheses Formulated</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Formulate a hypothesis statements on the left to start validating.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {hypotheses?.map((h, idx) => (
              <div key={h.id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-sm transition-all flex flex-col sm:flex-row justify-between items-start gap-4">
                <div className="space-y-4 flex-1 w-full">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center bg-slate-100 text-slate-600 text-xs font-bold rounded-full w-5 h-5">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Hypothesis</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 leading-relaxed">{h.statement}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                    <div className="space-y-1">
                      <div className="text-[11px] font-bold text-emerald-600 uppercase flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Success Indicators
                      </div>
                      <p className="text-xs text-slate-600 leading-normal">{h.success_indicators || 'Not defined.'}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[11px] font-bold text-rose-500 uppercase flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" /> Failure Indicators
                      </div>
                      <p className="text-xs text-slate-600 leading-normal">{h.failure_indicators || 'Not defined.'}</p>
                    </div>
                  </div>
                </div>

                {!isObserver && (
                  <div className="flex gap-1.5 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0 sm:border-l sm:pl-4 shrink-0 w-full sm:w-auto justify-end">
                    <button 
                      onClick={() => setEditingHypothesis(h)}
                      className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-primary-400 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(h.id)}
                      className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
