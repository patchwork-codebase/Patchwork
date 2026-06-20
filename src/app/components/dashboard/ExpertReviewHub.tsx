import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { CheckCircle, Clock, XCircle, Inbox, Activity, Calendar, FileText, ChevronRight } from 'lucide-react';
import { ReviewTemplateForm } from './ReviewTemplateForm';

// Mock Data
const MOCK_REQUESTS = [
  {
    id: 'req-1',
    builderName: 'Jordan Lee',
    roomTitle: 'Redesigning the onboarding flow',
    priority: 'high',
    status: 'pending',
    deadline: '2026-06-18T00:00:00Z',
    buildSummary: 'We are completely overhauling the onboarding to increase activation.',
  },
  {
    id: 'req-2',
    builderName: 'Sam Smith',
    roomTitle: 'New AI features',
    priority: 'medium',
    status: 'accepted',
    deadline: '2026-06-20T00:00:00Z',
    buildSummary: 'Adding generative AI text to our editor.',
  },
  {
    id: 'req-3',
    builderName: 'Alex Johnson',
    roomTitle: 'Mobile App V2',
    priority: 'low',
    status: 'completed',
    deadline: '2026-06-10T00:00:00Z',
    buildSummary: 'React Native rewrite.',
  }
];

export default function ExpertReviewHub() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'incoming' | 'accepted' | 'completed'>('incoming');
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  // Mock capacity data
  const capacity = {
    active: 2,
    activeLimit: 5,
    monthly: 12,
    monthlyLimit: 20
  };

  const isAvailable = capacity.active < capacity.activeLimit && capacity.monthly < capacity.monthlyLimit;

  const filteredRequests = MOCK_REQUESTS.filter(req => {
    if (activeTab === 'incoming') return req.status === 'pending';
    if (activeTab === 'accepted') return req.status === 'accepted';
    if (activeTab === 'completed') return req.status === 'completed';
    return true;
  });

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        
        {/* Main Content */}
        <div className="flex-1 w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-white font-display flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-primary" /> Review Hub
            </h1>
            <p className="text-slate-400 mt-2">Manage your incoming review requests and provide structured feedback.</p>
          </div>

          <div className="flex gap-4 mb-6 border-b border-white/10">
            <button
              onClick={() => { setActiveTab('incoming'); setSelectedRequest(null); }}
              className={`pb-3 font-bold text-sm px-2 ${activeTab === 'incoming' ? 'text-white border-b-2 border-primary' : 'text-slate-400 hover:text-white'}`}
            >
              Incoming Requests
            </button>
            <button
              onClick={() => { setActiveTab('accepted'); setSelectedRequest(null); }}
              className={`pb-3 font-bold text-sm px-2 ${activeTab === 'accepted' ? 'text-white border-b-2 border-primary' : 'text-slate-400 hover:text-white'}`}
            >
              Accepted
            </button>
            <button
              onClick={() => { setActiveTab('completed'); setSelectedRequest(null); }}
              className={`pb-3 font-bold text-sm px-2 ${activeTab === 'completed' ? 'text-white border-b-2 border-primary' : 'text-slate-400 hover:text-white'}`}
            >
              Completed
            </button>
          </div>

          {selectedRequest ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button 
                onClick={() => setSelectedRequest(null)}
                className="mb-4 text-sm font-bold text-slate-400 hover:text-white flex items-center gap-1"
              >
                ← Back to list
              </button>
              <ReviewTemplateForm 
                requestId={selectedRequest} 
                onClose={() => setSelectedRequest(null)}
                onSubmitSuccess={() => setSelectedRequest(null)}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
                  <Inbox className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-white font-bold text-lg">No {activeTab} requests</h3>
                  <p className="text-slate-400 text-sm">You're all caught up!</p>
                </div>
              ) : (
                filteredRequests.map(req => (
                  <div key={req.id} className="bg-white/[0.02] border border-white/[0.08] hover:border-white/20 transition-all rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                          req.priority === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                          req.priority === 'medium' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 
                          'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {req.priority} Priority
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Due {new Date(req.deadline).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-1">{req.roomTitle}</h3>
                      <p className="text-sm text-slate-400">Requested by <span className="text-slate-300 font-medium">{req.builderName}</span></p>
                      <p className="text-sm text-slate-500 mt-3 line-clamp-2">{req.buildSummary}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {activeTab === 'incoming' && (
                        <>
                          <button className="px-4 py-2 rounded-xl text-sm font-bold text-slate-300 hover:bg-white/10 transition-colors">
                            Decline
                          </button>
                          <button 
                            className="px-4 py-2 rounded-xl text-sm font-bold bg-white text-black hover:bg-slate-200 transition-all shadow-lg"
                          >
                            Accept Request
                          </button>
                        </>
                      )}
                      {activeTab === 'accepted' && (
                        <button 
                          onClick={() => setSelectedRequest(req.id)}
                          className="px-5 py-2.5 rounded-xl text-sm font-bold bg-primary hover:bg-primary/90 text-white transition-all shadow-lg flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" /> Start Review
                        </button>
                      )}
                      {activeTab === 'completed' && (
                        <button className="px-4 py-2 rounded-xl text-sm font-bold bg-white/5 text-slate-300 hover:bg-white/10 transition-colors flex items-center gap-2">
                          View Report <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Capacity Sidebar */}
        <div className="w-full md:w-[320px] shrink-0">
          <div className="bg-[#1C1A24] border border-white/[0.08] rounded-2xl p-6 sticky top-8">
            <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Capacity Management
            </h3>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-sm text-slate-400 font-medium">Active Reviews</p>
                    <p className="text-2xl font-bold text-white">{capacity.active} <span className="text-slate-500 text-lg">/ {capacity.activeLimit}</span></p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 px-2 py-1 bg-emerald-400/10 rounded-md">
                    Available
                  </span>
                </div>
                <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${(capacity.active / capacity.activeLimit) * 100}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-sm text-slate-400 font-medium flex items-center gap-1.5"><Calendar className="w-4 h-4" /> This Month</p>
                    <p className="text-2xl font-bold text-white">{capacity.monthly} <span className="text-slate-500 text-lg">/ {capacity.monthlyLimit}</span></p>
                  </div>
                </div>
                <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(capacity.monthly / capacity.monthlyLimit) * 100}%` }} />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/[0.08]">
              <p className="text-xs text-slate-500 mb-3">Builders see you as:</p>
              <div className={`p-3 rounded-xl border ${isAvailable ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'} flex items-center gap-3`}>
                {isAvailable ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                <span className="font-bold">{isAvailable ? 'Available for requests' : 'Currently unavailable'}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Temporary icon to avoid importing errors if not present
function ShieldCheck(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}
