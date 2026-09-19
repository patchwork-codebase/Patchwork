import React, { useState } from 'react';
import { useDiscoverySignals, useAddSignal, useDeleteDiscoveryEntity } from '../../hooks/useDiscovery';
import { Plus, Trash2, ShieldAlert, Award, TrendingUp, BarChart2 } from 'lucide-react';

interface SignalTrackerProps {
  projectId: string;
  isObserver?: boolean;
}

const SIGNAL_TYPES = [
  { value: 'interview', label: 'Customer Interview' },
  { value: 'survey', label: 'Survey Response' },
  { value: 'analytics', label: 'Product Analytics (CTR, Traffic)' },
  { value: 'competitor_research', label: 'Competitor Analysis' },
  { value: 'sales_call', label: 'Sales/Discovery Call' },
  { value: 'adviser_feedback', label: 'Advisor/Expert Feedback' },
  { value: 'other', label: 'Other Market Signal' },
];

export default function SignalTracker({ projectId, isObserver = false }: SignalTrackerProps) {
  const { data: signals, isLoading } = useDiscoverySignals(projectId);
  const addSignal = useAddSignal();
  const deleteEntity = useDeleteDiscoveryEntity();

  const [type, setType] = useState('survey');
  const [status, setStatus] = useState<'positive' | 'negative' | 'neutral'>('positive');
  const [description, setDescription] = useState('');
  const [weight, setWeight] = useState(10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    // Adjust weight sign based on status
    let finalWeight = Math.abs(weight);
    if (status === 'negative') finalWeight = -finalWeight;
    if (status === 'neutral') finalWeight = 0;

    try {
      await addSignal.mutateAsync({
        project_id: projectId,
        type,
        status,
        description: description.trim(),
        impact_weight: finalWeight,
      });
      setDescription('');
      setWeight(10);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this signal? This will recalculate the confidence score.')) return;
    try {
      await deleteEntity.mutateAsync({
        table: 'discovery_signals',
        id,
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form panel */}
      {!isObserver && (
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-100/60 rounded-2xl p-6 shadow-sm">
            <h3 className="text-md font-bold text-slate-900 flex items-center gap-1.5 mb-2">
              <Plus className="w-4 h-4 text-primary-400" /> Log Market Signal
            </h3>
            <p className="text-xs text-slate-500 mb-6">Record quantitative or qualitative evidence that supports or refutes your problem statement.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Signal Source Type</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 font-medium shadow-sm dark:shadow-none"
                >
                  {SIGNAL_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Signal Sentiment</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setStatus('positive'); if (weight === 0) setWeight(10); }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      status === 'positive'
                        ? 'bg-emerald-50 border-emerald-500/30 text-emerald-600'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Positive
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStatus('neutral'); setWeight(0); }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      status === 'neutral'
                        ? 'bg-slate-100 border-slate-400/30 text-slate-600'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Neutral
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStatus('negative'); if (weight === 0) setWeight(10); }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      status === 'negative'
                        ? 'bg-rose-50 border-rose-500/30 text-rose-600'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    Negative
                  </button>
                </div>
              </div>

              {status !== 'neutral' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Confidence Score Impact ({status === 'positive' ? '+' : '-'}{weight}%)
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={weight}
                    onChange={e => setWeight(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    <span>Weak (1%)</span>
                    <span>Strong (50%)</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Evidence Details</label>
                <textarea
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. 40 out of 100 landing page visitors clicked 'Join Waitlist'. Highly positive validation score."
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 leading-normal shadow-sm dark:shadow-none"
                />
              </div>

              <button
                type="submit"
                disabled={!description.trim()}
                className="w-full bg-primary-400 hover:bg-[#7a6aeb] disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
              >
                Add Signal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* List panel */}
      <div className={`${isObserver ? 'lg:col-span-3' : 'lg:col-span-2'} space-y-4`}>
        <h3 className="text-lg font-bold text-slate-900">Recorded Signals</h3>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-slate-100 rounded-2xl" />
            ))}
          </div>
        ) : signals?.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50 shadow-sm dark:shadow-none">
            <BarChart2 className="w-10 h-10 text-slate-500 dark:text-slate-400 mx-auto mb-3" />
            <h4 className="text-md font-bold text-slate-900 mb-1">No Signals Recorded</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">Market validation is based on signals. Log positive metrics or critical concerns to track project confidence.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {signals?.map(s => {
              const label = SIGNAL_TYPES.find(t => t.value === s.type)?.label || s.type;
              return (
                <div key={s.id} className="bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full uppercase tracking-wider ${
                        s.status === 'positive' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        s.status === 'negative' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-800 leading-normal font-medium">{s.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0 sm:border-l sm:pl-4 shrink-0 w-full sm:w-auto">
                    <div className={`text-left sm:text-right ${
                      s.impact_weight > 0 ? 'text-emerald-500 font-extrabold' :
                      s.impact_weight < 0 ? 'text-rose-500 font-extrabold' :
                      'text-slate-400 font-medium'
                    }`}>
                      <div className="text-[10px] sm:text-xs font-mono uppercase tracking-wide font-bold">Confidence</div>
                      <div className="text-sm font-black">
                        {s.impact_weight > 0 ? `+${s.impact_weight}%` : `${s.impact_weight}%`}
                      </div>
                    </div>

                    {!isObserver && (
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="text-slate-600 dark:text-slate-300 hover:text-rose-500 p-1.5 rounded-lg hover:bg-slate-50 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
