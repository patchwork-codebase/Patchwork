import React, { useState } from 'react';
import { useDiscoveryInterviews, useMutateInterview, useDeleteDiscoveryEntity } from '../../hooks/useDiscovery';
import { DiscoveryInterview } from '../../types/discovery';
import { Plus, Trash2, Edit2, FileText, ExternalLink, Calendar, User, MessageSquare, ChevronRight, X } from 'lucide-react';

interface CustomerInterviewsProps {
  projectId: string;
}

export default function CustomerInterviews({ projectId }: CustomerInterviewsProps) {
  const { data: interviews, isLoading } = useDiscoveryInterviews(projectId);
  const mutateInterview = useMutateInterview();
  const deleteEntity = useDeleteDiscoveryEntity();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<DiscoveryInterview | null>(null);

  // Form states
  const [interviewId, setInterviewId] = useState<string | undefined>(undefined);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [insights, setInsights] = useState('');
  const [recordingUrl, setRecordingUrl] = useState('');
  const [summary, setSummary] = useState('');

  const openNewForm = () => {
    setInterviewId(undefined);
    setName('');
    setRole('');
    setCompany('');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setInsights('');
    setRecordingUrl('');
    setSummary('');
    setIsFormOpen(true);
    setSelectedInterview(null);
  };

  const openEditForm = (i: DiscoveryInterview) => {
    setInterviewId(i.id);
    setName(i.interviewee_name || '');
    setRole(i.interviewee_role || '');
    setCompany(i.interviewee_company || '');
    setDate(i.interview_date ? new Date(i.interview_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setNotes(i.notes || '');
    setInsights(i.key_insights || '');
    setRecordingUrl(i.recording_url || '');
    setSummary(i.summary || '');
    setIsFormOpen(true);
    setSelectedInterview(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await mutateInterview.mutateAsync({
        id: interviewId,
        project_id: projectId,
        interviewee_name: name.trim(),
        interviewee_role: role.trim() || undefined,
        interviewee_company: company.trim() || undefined,
        interview_date: new Date(date).toISOString(),
        notes: notes.trim() || undefined,
        key_insights: insights.trim() || undefined,
        recording_url: recordingUrl.trim() || undefined,
        summary: summary.trim() || undefined,
      });
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this interview record?')) return;
    try {
      await deleteEntity.mutateAsync({
        table: 'discovery_interviews',
        id,
      });
      if (selectedInterview?.id === id) {
        setSelectedInterview(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Customer Interviews</h2>
          <p className="text-sm text-slate-500">Record insights, pain points, and feedback directly from user research sessions.</p>
        </div>
        {!isFormOpen && (
          <button 
            onClick={openNewForm}
            className="bg-[#8B7CF8] hover:bg-[#7a6aeb] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm transition-colors w-full sm:w-auto justify-center whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Add Interview
          </button>
        )}
      </div>

      {isFormOpen ? (
        <form onSubmit={handleSave} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 md:p-8 space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center border-b border-slate-200 pb-4">
            <h3 className="text-lg font-bold text-slate-900">{interviewId ? 'Edit Interview Record' : 'Record Customer Interview'}</h3>
            <button 
              type="button" 
              onClick={() => setIsFormOpen(false)}
              className="text-slate-400 hover:text-slate-600 font-bold text-sm"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Interviewee Name *</label>
              <input 
                type="text" required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7CF8]/50 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Interview Date</label>
              <input 
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7CF8]/50 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Role / Title</label>
              <input 
                type="text"
                value={role}
                onChange={e => setRole(e.target.value)}
                placeholder="e.g. Senior PM"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7CF8]/50 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Company</label>
              <input 
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="e.g. Stripe"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7CF8]/50 font-medium"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Recording Link (Optional)</label>
              <input 
                type="url"
                value={recordingUrl}
                onChange={e => setRecordingUrl(e.target.value)}
                placeholder="e.g. Loom, Grain, or Google Drive link"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7CF8]/50 font-medium"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">One-line Summary</label>
              <input 
                type="text"
                value={summary}
                onChange={e => setSummary(e.target.value)}
                placeholder="e.g. Struggles with validating target market, willing to pay for an automated signal tracking tool."
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7CF8]/50 font-medium"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Key Insights & Takeaways</label>
              <textarea 
                value={insights}
                onChange={e => setInsights(e.target.value)}
                placeholder="- Insight 1: Automating survey results is critical.&#10;- Insight 2: Prefers Slack integration over dashboard tools."
                rows={3}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7CF8]/50 font-medium"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Full Interview Notes</label>
              <textarea 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Raw conversation transcripts or detailed notes of the chat..."
                rows={6}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8B7CF8]/50 font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button 
              type="button" 
              onClick={() => setIsFormOpen(false)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-5 py-2.5 bg-[#8B7CF8] hover:bg-[#7a6aeb] text-white rounded-xl text-sm font-bold transition-colors"
            >
              Save Record
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List panel */}
          <div className={`${selectedInterview ? 'lg:col-span-1' : 'lg:col-span-3'} space-y-4`}>
            {isLoading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-slate-100 rounded-2xl" />
                ))}
              </div>
            ) : interviews?.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
                <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-1">No Interviews Yet</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">Talk to your customers first. Document qualitative learnings here.</p>
                <button 
                  onClick={openNewForm}
                  className="bg-[#8B7CF8] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#7a6aeb] transition-colors"
                >
                  Create First Record
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {interviews?.map(i => {
                  const isSelected = selectedInterview?.id === i.id;
                  return (
                    <div 
                      key={i.id}
                      onClick={() => setSelectedInterview(i)}
                      className={`group border rounded-2xl p-4 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-[#8B7CF8] bg-[#6C5CE7]/5 shadow-sm' 
                          : 'border-slate-200 bg-white hover:border-[#8B7CF8]/45 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-[15px] group-hover:text-[#8B7CF8] transition-colors">{i.interviewee_name}</h4>
                          <p className="text-xs text-slate-500 truncate">
                            {i.interviewee_role ? `${i.interviewee_role} ` : ''}
                            {i.interviewee_company ? `@ ${i.interviewee_company}` : ''}
                          </p>
                        </div>
                        <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => { e.stopPropagation(); openEditForm(i); }}
                            className="p-1 text-slate-400 hover:text-[#8B7CF8] rounded hover:bg-slate-100"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={(e) => handleDelete(i.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-slate-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                        {i.summary || "No summary provided."}
                      </p>

                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {i.interview_date ? new Date(i.interview_date).toLocaleDateString() : 'N/A'}
                        </span>
                        {!selectedInterview && <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:translate-x-0.5 transition-transform" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Details panel */}
          {selectedInterview && (
            <div className="lg:col-span-2 bg-slate-50/50 border border-slate-200/80 rounded-2xl p-6 relative overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
              <button 
                onClick={() => setSelectedInterview(null)}
                className="absolute top-4 right-4 p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-lg">{selectedInterview.interviewee_name}</h3>
                      <p className="text-xs text-slate-500">
                        {selectedInterview.interviewee_role || 'No Role'}
                        {selectedInterview.interviewee_company ? ` at ${selectedInterview.interviewee_company}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 mt-3 pt-3 border-t border-slate-200/60">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/> {selectedInterview.interview_date ? new Date(selectedInterview.interview_date).toLocaleDateString() : 'N/A'}</span>
                    {selectedInterview.recording_url && (
                      <a 
                        href={selectedInterview.recording_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[#8B7CF8] hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Recording link
                      </a>
                    )}
                  </div>
                </div>

                {selectedInterview.summary && (
                  <div className="bg-white p-4 rounded-xl border border-slate-100">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">One-line Summary</h4>
                    <p className="text-slate-800 text-sm font-medium">{selectedInterview.summary}</p>
                  </div>
                )}

                {selectedInterview.key_insights && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#8B7CF8]" /> Key Insights
                    </h4>
                    <div className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed bg-white/50 border border-slate-150 p-4 rounded-xl">
                      {selectedInterview.key_insights}
                    </div>
                  </div>
                )}

                {selectedInterview.notes && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Full Notes</h4>
                    <div className="bg-white text-slate-700 text-sm p-5 rounded-xl border border-slate-200/60 max-h-[300px] overflow-y-auto whitespace-pre-wrap leading-relaxed font-sans">
                      {selectedInterview.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
