import React, { useState } from 'react';
import { useParams, Link } from 'react-router';
import { useDiscoveryProject } from '../../hooks/useDiscovery';
import { ArrowLeft, Compass, AlertCircle, CheckCircle2, Award } from 'lucide-react';
import ProblemStatementForm from './ProblemStatementForm';
import HypothesisTracker from './HypothesisTracker';
import CustomerInterviews from './CustomerInterviews';
import SignalTracker from './SignalTracker';
import DecisionTracker from './DecisionTracker';
import LinkedInDeckGenerator from './LinkedInDeckGenerator';
import { useAuth } from '../auth/AuthContext';

export default function DiscoveryDashboard() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading } = useDiscoveryProject(id);
  const [activeTab, setActiveTab] = useState('overview');
  const { profile } = useAuth();
  const isObserver = profile?.role === 'observer';

  if (isLoading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-12 h-12 text-slate-500 dark:text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900">Project Not Found</h2>
        <Link to="/dashboard/discovery" className="text-primary-400 hover:underline mt-4 inline-block">Return to Hub</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <Link to="/dashboard/discovery" className="mt-1 p-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary-400/10 border border-primary-400/20 rounded-full">
                <Compass className="w-3.5 h-3.5 text-primary-400" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary-400">Discovery Mode</span>
              </div>
              {project.status === 'converted' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Converted to Build
                </span>
              )}
              {project.status === 'killed' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  <AlertCircle className="w-3.5 h-3.5" /> Idea Shelved
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 break-words leading-tight">{project.title}</h1>
          </div>
        </div>
        
        {/* Confidence Gauge & Share */}
        <div className="flex md:flex-col flex-row gap-3 shrink-0 items-center w-full md:w-auto justify-between md:justify-center">
          <div className="bg-white border border-slate-100 rounded-2xl p-4 flex md:flex-col flex-row items-center justify-between md:justify-center md:min-w-[150px] shadow-sm gap-2">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Confidence Score</div>
            <div className={`text-2xl sm:text-3xl font-black ${
              project.confidence_score >= 70 ? 'text-emerald-500' :
              project.confidence_score >= 40 ? 'text-amber-500' :
              'text-rose-500'
            }`}>
              {project.confidence_score}%
            </div>
          </div>
          {!isObserver && <LinkedInDeckGenerator project={project} />}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 mb-8 overflow-x-auto">
        {['overview', 'hypotheses', 'interviews', 'signals', 'decision'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-4 text-sm font-bold uppercase tracking-wider whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab 
                ? 'border-primary-400 text-primary-400' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white border border-slate-100 rounded-3xl p-4 sm:p-8 min-h-[400px] shadow-sm dark:shadow-none">
        {activeTab === 'overview' && (
          <ProblemStatementForm project={project} isObserver={isObserver} />
        )}
        
        {activeTab === 'hypotheses' && (
          <HypothesisTracker projectId={project.id} isObserver={isObserver} />
        )}

        {activeTab === 'interviews' && (
          <CustomerInterviews projectId={project.id} isObserver={isObserver} />
        )}

        {activeTab === 'signals' && (
          <SignalTracker projectId={project.id} isObserver={isObserver} />
        )}

        {activeTab === 'decision' && (
          <DecisionTracker project={project} isObserver={isObserver} />
        )}
      </div>
    </div>
  );
}


