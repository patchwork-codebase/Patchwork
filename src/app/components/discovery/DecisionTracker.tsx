import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useSubmitDecision, useDiscoveryDecisions } from '../../hooks/useDiscovery';
import { DiscoveryProject } from '../../types/discovery';
import { supabase, useAuth } from '../auth/AuthContext';
import { toast } from 'sonner';
import { Award, ShieldAlert, RefreshCw, Eye, ArrowRight, CheckCircle2, Lock } from 'lucide-react';

interface DecisionTrackerProps {
  project: DiscoveryProject;
  isObserver?: boolean;
}

export default function DecisionTracker({ project, isObserver = false }: DecisionTrackerProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const submitDecision = useSubmitDecision();
  const { data: decisions, isLoading } = useDiscoveryDecisions(project.id);

  const [decisionType, setDecisionType] = useState<'proceed_to_build' | 'pivot' | 'kill_idea' | 'need_more_research'>('proceed_to_build');
  const [rationale, setRationale] = useState('');
  
  // Room creation states (only for proceed_to_build)
  const [roomTitle, setRoomTitle] = useState(project.title);
  const [roomDescription, setRoomDescription] = useState(project.problem_statement || '');
  const [roomSlug, setRoomSlug] = useState(project.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || isObserver) return;
    setIsSubmitting(true);

    try {
      if (decisionType === 'proceed_to_build') {
        // 1. Create the build room
        const roomId = window.crypto?.randomUUID?.() || `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();
        
        const roomPayload = {
          id: roomId,
          builder_id: profile.id,
          builder_name: profile.name || 'Builder',
          title: roomTitle.trim(),
          description: roomDescription.trim(),
          tags: ['discovery-validated'],
          status: 'active',
          update_count: 0,
          observer_count: 0,
          last_update: '',
          created_at: now,
          updated_at: now,
          cover_image: null,
          primary_link: null,
          project_stage: 'Ideation',
          primary_goal: 'Just sharing my journey'
        };

        const { error: roomError } = await supabase.from('rooms').insert(roomPayload);
        if (roomError) throw roomError;

        // 2. Submit decision & update discovery project state
        await submitDecision.mutateAsync({
          project_id: project.id,
          decision: 'proceed_to_build',
          rationale: rationale.trim() || 'Validated hypotheses and market signals.',
        });

        // 3. Link room back to discovery project
        await supabase
          .from('discovery_projects')
          .update({ 
            converted_room_id: roomId,
            status: 'converted' 
          })
          .eq('id', project.id);

        toast.success('Converted to Build Room successfully!');
        navigate(`/dashboard/room/${roomId}`);
      } else {
        // Other decisions (Pivot, Kill, Need More Research)
        await submitDecision.mutateAsync({
          project_id: project.id,
          decision: decisionType,
          rationale: rationale.trim(),
        });
        toast.success('Decision logged.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Error: ${err.message || 'Could not save decision'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentDecision = decisions?.[0];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {project.status !== 'active' || currentDecision ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-xl font-bold text-slate-900">Discovery Conclusion Logged</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            This project's discovery phase has been completed.
          </p>
          <div className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
            project.status === 'converted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
            project.status === 'killed' || project.status === 'kill_idea' ? 'bg-rose-50 text-rose-600 border-rose-100' :
            'bg-amber-50 text-amber-600 border-amber-100'
          }`}>
            Outcome: {project.status === 'converted' ? 'Proceeded to Build' : project.status.replace(/_/g, ' ')}
          </div>
          {currentDecision?.rationale && (
            <div className="max-w-lg mx-auto bg-white border border-slate-100 p-4 rounded-xl text-left text-xs text-slate-600">
              <span className="font-bold text-slate-400 block mb-1">DECISION RATIONALE</span>
              {currentDecision.rationale}
            </div>
          )}
          {project.converted_room_id && (
            <button
              onClick={() => navigate(`/dashboard/room/${project.converted_room_id}`)}
              className="mt-4 bg-primary-400 hover:bg-[#7a6aeb] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors inline-flex items-center gap-2"
            >
              Go to Build Room <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : isObserver ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center space-y-4">
          <Lock className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-xl font-bold text-slate-900">No Decision Logged</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            The project builders have not logged a final discovery verdict yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Decision selection */}
          <div className="lg:col-span-1 bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Log Discovery Outcome</h3>
            <p className="text-xs text-slate-500">Based on your customer conversations and market confidence, what is the next step?</p>
            
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setDecisionType('proceed_to_build')}
                className={`w-full flex items-center gap-3 p-3.5 border rounded-xl text-left transition-all ${
                  decisionType === 'proceed_to_build'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Award className={`w-5 h-5 shrink-0 ${decisionType === 'proceed_to_build' ? 'text-emerald-500' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-bold">Proceed to Build</div>
                  <div className="text-[10px] opacity-75 mt-0.5">High confidence. Initialize a Build Room.</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDecisionType('pivot')}
                className={`w-full flex items-center gap-3 p-3.5 border rounded-xl text-left transition-all ${
                  decisionType === 'pivot'
                    ? 'border-amber-500 bg-amber-50/50 text-amber-900 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <RefreshCw className={`w-5 h-5 shrink-0 ${decisionType === 'pivot' ? 'text-amber-500 animate-spin-slow' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-bold">Pivot Idea</div>
                  <div className="text-[10px] opacity-75 mt-0.5">Problem/solution mismatch. Refocus direction.</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDecisionType('need_more_research')}
                className={`w-full flex items-center gap-3 p-3.5 border rounded-xl text-left transition-all ${
                  decisionType === 'need_more_research'
                    ? 'border-primary-400 bg-[#FF5B22]/5 text-primary-400 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Eye className={`w-5 h-5 shrink-0 ${decisionType === 'need_more_research' ? 'text-primary-400' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-bold">Need More Research</div>
                  <div className="text-[10px] opacity-75 mt-0.5">Inconclusive evidence. Gather more signals.</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDecisionType('kill_idea')}
                className={`w-full flex items-center gap-3 p-3.5 border rounded-xl text-left transition-all ${
                  decisionType === 'kill_idea'
                    ? 'border-rose-500 bg-rose-50/50 text-rose-900 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ShieldAlert className={`w-5 h-5 shrink-0 ${decisionType === 'kill_idea' ? 'text-rose-500' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-bold">Kill the Idea</div>
                  <div className="text-[10px] opacity-75 mt-0.5">Assumptions disproven. Archive project.</div>
                </div>
              </button>
            </div>
          </div>

          {/* Form details */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6">
            <h3 className="text-lg font-bold text-slate-900">
              {decisionType === 'proceed_to_build' ? 'Configure Build Room' : 'Outcome Details'}
            </h3>

            <form onSubmit={handleDecision} className="space-y-6">
              {decisionType === 'proceed_to_build' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Room Title</label>
                    <input
                      type="text" required
                      value={roomTitle}
                      onChange={e => {
                        setRoomTitle(e.target.value);
                        setRoomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
                      }}
                      placeholder="Room Title"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">URL Slug</label>
                    <div className="flex">
                      <span className="px-3 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-slate-500 text-xs flex items-center font-mono">patchwork.sh/</span>
                      <input
                        type="text" required
                        value={roomSlug}
                        onChange={e => setRoomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="room-slug"
                        className="w-full px-4 py-3 border border-slate-200 rounded-r-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Description / Goal</label>
                    <textarea
                      value={roomDescription}
                      onChange={e => setRoomDescription(e.target.value)}
                      placeholder="What will this room focus on?"
                      rows={3}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 font-medium"
                    />
                  </div>
                </div>
              ) : null}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Decision Rationale *
                </label>
                <textarea
                  required
                  value={rationale}
                  onChange={e => setRationale(e.target.value)}
                  placeholder={
                    decisionType === 'proceed_to_build'
                      ? 'What are the main findings that give you confidence to build?'
                      : decisionType === 'pivot'
                      ? 'What are you pivoting from and to? What did customer signals reveal?'
                      : 'Provide a final explanation for logging this state...'
                  }
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !rationale.trim() || (decisionType === 'proceed_to_build' && (!roomTitle.trim() || !roomSlug.trim()))}
                className="w-full bg-primary-400 hover:bg-[#7a6aeb] disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                ) : decisionType === 'proceed_to_build' ? (
                  <>Create Build Room & Conclude Discovery</>
                ) : (
                  <>Log Decision</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
