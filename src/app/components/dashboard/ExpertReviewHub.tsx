import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { CheckCircle, Clock, XCircle, Inbox, Activity, Calendar, FileText, ChevronRight, Loader2 } from 'lucide-react';
import { ReviewTemplateForm } from './ReviewTemplateForm';
import { useExpertRequests } from '../../hooks/useExpertRequests';
import { getAvatarUrl } from '../../utils/helpers';
import { UserAvatar } from '../ui/UserAvatar';

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

  const { data: requests = [], isLoading } = useExpertRequests(profile?.id);

  const filteredRequests = requests.filter(req => {
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
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-display flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-primary" /> Review Hub
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your incoming review requests and provide structured feedback.</p>
          </div>

          <div className="flex gap-4 mb-6 border-b border-slate-100 dark:border-white/10">
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
                className="mb-4 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white flex items-center gap-1"
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
            <div className="flex-1 bg-white border border-slate-100 rounded-[24px] flex flex-col overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)] relative min-h-[500px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center flex-1 text-slate-500 dark:text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary-400" />
                <p>Loading requests...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 text-slate-500 dark:text-slate-400 p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100 shadow-sm dark:shadow-none">
                  <Inbox className="w-8 h-8 text-slate-600 dark:text-slate-300" />
                </div>
                <h3 className="text-[16px] font-bold text-slate-700 mb-1">No {activeTab} requests</h3>
                <p className="text-[13px]">You're all caught up! When a builder requests your expertise, it will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 overflow-y-auto">
                {filteredRequests.map(req => {
                  const builderName = req.users?.name || 'Builder';
                  const roomTitle = req.rooms?.title || 'Unknown Room';
                  return (
                    <div key={req.id} className="w-full text-left p-5 sm:p-6 transition-all border-l-4 bg-white border-transparent hover:bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                            req.priority === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                            req.priority === 'medium' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 
                            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {req.priority} Priority
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Due {new Date(req.deadline).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">{roomTitle}</h3>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-100 overflow-hidden shrink-0 relative">
                            <UserAvatar userId={req.builder_id} name={builderName} avatarUrl={req.users?.avatar} />
                          </div>
                          <p className="text-sm text-slate-500">Requested by <span className="text-slate-700 font-medium">{builderName}</span></p>
                        </div>
                        <p className="text-sm text-slate-500 line-clamp-2">{req.build_summary}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {activeTab === 'incoming' && (
                          <>
                            <button className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                              Decline
                            </button>
                            <button className="px-4 py-2 rounded-xl text-sm font-bold bg-white text-slate-900 hover:bg-slate-50 transition-all shadow-sm border border-slate-100">
                              Accept Request
                            </button>
                          </>
                        )}
                        {activeTab === 'accepted' && (
                          <button 
                            onClick={() => setSelectedRequest(req.id)}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-primary-500 hover:bg-primary-600 text-white transition-all shadow-sm flex items-center gap-2"
                          >
                            <FileText className="w-4 h-4" /> Start Review
                          </button>
                        )}
                        {activeTab === 'completed' && (
                          <button className="px-4 py-2 rounded-xl text-sm font-bold bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100 transition-colors flex items-center gap-2 shadow-sm dark:shadow-none">
                            View Report <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        </div>
        {/* Capacity Sidebar */}
        <div className="w-full md:w-[320px] shrink-0">
          <div className="bg-ink-80 border border-white/[0.08] rounded-2xl p-6 sticky top-8">
            <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> Capacity Management
            </h3>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Active Reviews</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{capacity.active} <span className="text-slate-500 text-lg">/ {capacity.activeLimit}</span></p>
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
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5"><Calendar className="w-4 h-4" /> This Month</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{capacity.monthly} <span className="text-slate-500 text-lg">/ {capacity.monthlyLimit}</span></p>
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
