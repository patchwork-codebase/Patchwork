import React, { useState } from 'react';
import { useDiscoveryAssumptions, useMutateAssumption, useUpdateDiscoveryProject, useDeleteDiscoveryEntity } from '../../hooks/useDiscovery';
import { DiscoveryProject } from '../../types/discovery';
import { Edit2, Save, X, Plus, Trash2, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

interface ProblemStatementFormProps {
  project: DiscoveryProject;
  isObserver?: boolean;
}

export default function ProblemStatementForm({ project, isObserver = false }: ProblemStatementFormProps) {
  const { data: assumptions, isLoading: loadingAssumptions } = useDiscoveryAssumptions(project.id);
  const updateProject = useUpdateDiscoveryProject();
  const mutateAssumption = useMutateAssumption();
  const deleteEntity = useDeleteDiscoveryEntity();

  const [isEditing, setIsEditing] = useState(false);
  const [problem, setProblem] = useState(project.problem_statement || '');
  const [audience, setAudience] = useState(project.audience || '');
  const [market, setMarket] = useState(project.market || '');
  const [painLevel, setPainLevel] = useState(project.pain_level || 'Medium');

  const [newAssumption, setNewAssumption] = useState('');

  const handleSave = async () => {
    try {
      await updateProject.mutateAsync({
        id: project.id,
        problem_statement: problem,
        audience,
        market,
        pain_level: painLevel,
      });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAssumption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssumption.trim()) return;
    try {
      await mutateAssumption.mutateAsync({
        project_id: project.id,
        assumption: newAssumption.trim(),
        status: 'untested',
      });
      setNewAssumption('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (assumptionId: string, newStatus: 'untested' | 'validated' | 'invalidated') => {
    try {
      await mutateAssumption.mutateAsync({
        id: assumptionId,
        project_id: project.id,
        status: newStatus,
      } as any);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAssumption = async (assumptionId: string) => {
    if (!confirm('Are you sure you want to delete this assumption?')) return;
    try {
      await deleteEntity.mutateAsync({
        table: 'discovery_assumptions',
        id: assumptionId,
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Problem Statement Card */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-slate-50 border border-slate-100/60 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Define the Problem</h3>
            {isEditing ? (
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleSave}
                  className="bg-primary-400 text-white px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-[#7a6aeb] transition-colors"
                >
                  <Save className="w-3.5 h-3.5" /> Save
                </button>
              </div>
            ) : (
              !isObserver && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="text-slate-500 hover:text-primary-400 p-1.5 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Problem Statement</label>
                <textarea 
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  placeholder="What pain point are you validating?"
                  rows={4}
                  className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 shadow-sm dark:shadow-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Target Audience</label>
                  <input 
                    type="text"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="Who has this problem? (e.g. Solo SaaS Builders)"
                    className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 shadow-sm dark:shadow-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Market Opportunity</label>
                  <input 
                    type="text"
                    value={market}
                    onChange={(e) => setMarket(e.target.value)}
                    placeholder="Industry or niche segment"
                    className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 shadow-sm dark:shadow-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Customer Pain Level</label>
                <select 
                  value={painLevel} 
                  onChange={(e) => setPainLevel(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 font-medium shadow-sm dark:shadow-none"
                >
                  <option value="High">High (Must-solve / hair-on-fire)</option>
                  <option value="Medium">Medium (Nice-to-have / inconvenience)</option>
                  <option value="Low">Low (Minor annoyance)</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Problem Statement</h4>
                <p className="text-slate-800 leading-relaxed text-[15px] whitespace-pre-wrap">
                  {project.problem_statement || (isObserver ? "No problem statement defined yet." : "Not defined yet. Click edit to add a problem statement.")}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100/60">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Target Audience</h4>
                  <p className="text-slate-800 font-medium text-sm">{project.audience || "Not defined"}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Market Segment</h4>
                  <p className="text-slate-800 font-medium text-sm">{project.market || "Not defined"}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Pain Level</h4>
                  <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    project.pain_level === 'High' ? 'bg-rose-100 text-rose-600' :
                    project.pain_level === 'Medium' ? 'bg-amber-100 text-amber-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {project.pain_level || 'Medium'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Assumptions List Card */}
      <div className="space-y-6">
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Assumptions</h3>
          <p className="text-xs text-slate-500 mb-4">List leap-of-faith assumptions that must be true for this project to succeed.</p>

          {!isObserver && (
            <form onSubmit={handleAddAssumption} className="flex gap-2 mb-6">
              <input 
                type="text"
                placeholder="e.g. Builders care about validation..."
                value={newAssumption}
                onChange={(e) => setNewAssumption(e.target.value)}
                className="flex-1 px-3.5 py-2 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50"
              />
              <button 
                type="submit" 
                disabled={!newAssumption.trim()}
                className="bg-primary-400 hover:bg-[#7a6aeb] text-white p-2 rounded-xl disabled:opacity-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          )}

          {loadingAssumptions ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2].map(i => (
                <div key={i} className="h-10 bg-slate-100 rounded-xl" />
              ))}
            </div>
          ) : assumptions?.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50 shadow-sm dark:shadow-none">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No assumptions added yet.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {assumptions?.map(a => (
                <div key={a.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100/50 flex justify-between items-start gap-2 shadow-sm dark:shadow-none">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-800 leading-normal break-words">{a.assumption}</p>
                    <div className="flex gap-1.5 mt-2">
                      {isObserver ? (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-0.5 ${
                          a.status === 'untested' ? 'bg-slate-200 text-slate-700' :
                          a.status === 'validated' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {a.status === 'untested' && <HelpCircle className="w-3 h-3" />}
                          {a.status === 'validated' && <CheckCircle2 className="w-3 h-3" />}
                          {a.status === 'invalidated' && <AlertCircle className="w-3 h-3" />}
                          {a.status === 'untested' ? 'Untested' : a.status === 'validated' ? 'Valid' : 'Invalid'}
                        </span>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleStatusChange(a.id, 'untested')}
                            className={`p-1 rounded text-[10px] font-bold uppercase transition-colors flex items-center gap-0.5 ${
                              a.status === 'untested' ? 'bg-slate-200 text-slate-700' : 'text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            <HelpCircle className="w-3 h-3" /> Untested
                          </button>
                          <button 
                            onClick={() => handleStatusChange(a.id, 'validated')}
                            className={`p-1 rounded text-[10px] font-bold uppercase transition-colors flex items-center gap-0.5 ${
                              a.status === 'validated' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" /> Valid
                          </button>
                          <button 
                            onClick={() => handleStatusChange(a.id, 'invalidated')}
                            className={`p-1 rounded text-[10px] font-bold uppercase transition-colors flex items-center gap-0.5 ${
                              a.status === 'invalidated' ? 'bg-rose-100 text-rose-700' : 'text-slate-400 hover:bg-slate-100'
                            }`}
                          >
                            <AlertCircle className="w-3 h-3" /> Invalid
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {!isObserver && (
                    <button 
                      onClick={() => handleDeleteAssumption(a.id)}
                      className="text-slate-600 dark:text-slate-300 hover:text-rose-500 p-1 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
