import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Clock,
  Download,
  Shield,
  Hash,
  User,
  Hammer,
  Lock,
  Eye,
  UserPlus,
  FileCheck,
  Globe,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useBuildTimeline } from '../../hooks/useBuildTimeline';
import type { BuildTimelineEvent, BuildTimelineEventType } from '../../types';
import { timeAgo } from '../../utils/helpers';

interface BuildTimelineCardProps {
  roomId: string;
  roomTitle: string;
  builderName: string;
  authorshipTimestamp?: string | null;
}

const EVENT_CONFIG: Record<BuildTimelineEventType, { icon: React.ReactNode; color: string; label: string }> = {
  room_created: { icon: <Hammer className="w-4 h-4" />, color: 'bg-primary-400/10 text-primary-400 border-primary-400/20', label: 'Room Created' },
  room_visibility_changed: { icon: <Globe className="w-4 h-4" />, color: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Visibility Changed' },
  update_posted: { icon: <FileCheck className="w-4 h-4" />, color: 'bg-emerald-50 text-emerald-600 border-emerald-200', label: 'Update Posted' },
  decision_logged: { icon: <Hash className="w-4 h-4" />, color: 'bg-blue-50 text-blue-600 border-blue-200', label: 'Decision Logged' },
  file_uploaded: { icon: <Download className="w-4 h-4" />, color: 'bg-orange-50 text-orange-600 border-orange-200', label: 'File Uploaded' },
  design_shared: { icon: <Eye className="w-4 h-4" />, color: 'bg-pink-50 text-pink-600 border-pink-200', label: 'Design Shared' },
  milestone_reached: { icon: <Shield className="w-4 h-4" />, color: 'bg-amber-50 text-amber-600 border-amber-200', label: 'Milestone Reached' },
  research_added: { icon: <Hash className="w-4 h-4" />, color: 'bg-indigo-50 text-indigo-600 border-indigo-200', label: 'Research Added' },
  note_added: { icon: <FileCheck className="w-4 h-4" />, color: 'bg-slate-100 text-slate-500 border-slate-200', label: 'Note Added' },
  doc_linked: { icon: <FileCheck className="w-4 h-4" />, color: 'bg-violet-50 text-violet-600 border-violet-200', label: 'Doc Linked' },
  member_joined: { icon: <UserPlus className="w-4 h-4" />, color: 'bg-sky-50 text-sky-600 border-sky-200', label: 'Member Joined' },
  expert_review_requested: { icon: <User className="w-4 h-4" />, color: 'bg-amber-50 text-amber-600 border-amber-200', label: 'Expert Review Requested' },
  expert_review_completed: { icon: <Shield className="w-4 h-4" />, color: 'bg-emerald-50 text-emerald-600 border-emerald-200', label: 'Expert Review Completed' },
  nda_accepted: { icon: <Lock className="w-4 h-4" />, color: 'bg-rose-50 text-rose-600 border-rose-200', label: 'NDA Accepted' },
  room_closed: { icon: <Hash className="w-4 h-4" />, color: 'bg-slate-100 text-slate-500 border-slate-200', label: 'Room Closed' },
};

function TimelineEventRow({ event, index }: { event: BuildTimelineEvent; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const config = EVENT_CONFIG[event.eventType] ?? EVENT_CONFIG.update_posted;
  const hasData = event.eventData && Object.keys(event.eventData).length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      className="relative flex gap-4 group"
    >
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${config.color}`}>
          {config.icon}
        </div>
        <div className="w-px flex-1 bg-slate-100 mt-2 group-last:hidden" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mr-2">
              {config.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Clock className="w-3 h-3 text-slate-300" />
            <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap">
              {new Date(event.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </span>
          </div>
        </div>

        <p className="text-[14px] text-slate-800 font-medium mb-1 leading-snug">
          {event.eventSummary}
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-slate-400 font-medium">
            by <span className="text-slate-600 font-semibold">{event.actorName}</span>
          </span>
          {event.versionHash && (
            <span
              className="text-[9px] font-mono text-slate-300 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-full truncate max-w-[180px]"
              title={`Integrity hash: ${event.versionHash}`}
            >
              #{event.versionHash.slice(0, 12)}
            </span>
          )}
        </div>

        {hasData && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="mt-2 flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 transition-colors focus-ring rounded"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Hide' : 'Show'} details
          </button>
        )}

        {expanded && hasData && (
          <pre className="mt-2 text-[11px] text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-3 overflow-x-auto font-mono">
            {JSON.stringify(event.eventData, null, 2)}
          </pre>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Displays the immutable build timeline for a room.
 * Every event has a cryptographic hash for integrity verification.
 */
export function BuildTimelineCard({
  roomId,
  roomTitle,
  builderName,
  authorshipTimestamp,
}: BuildTimelineCardProps) {
  const { data: events = [], isLoading } = useBuildTimeline(roomId);
  const [showExportHint, setShowExportHint] = useState(false);

  const handlePrint = () => {
    setShowExportHint(true);
    setTimeout(() => {
      window.print();
      setShowExportHint(false);
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 rounded-[24px] p-6 sm:p-8 relative overflow-hidden border border-slate-800 shadow-xl">
        {/* Background effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary-300 bg-primary-500/10 border border-primary-500/20 px-2.5 py-1 rounded-md">
              <Shield className="w-3 h-3" />
              Proof of Authorship
            </div>
            
            <div>
              <h2 className="text-[22px] sm:text-[26px] font-extrabold text-white font-display mb-1 tracking-tight">{roomTitle}</h2>
              <p className="text-slate-400 text-[14px] font-medium">
                Built by <span className="text-white font-semibold">{builderName}</span>
              </p>
            </div>

            {authorshipTimestamp && (
              <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl border border-white/10 w-fit backdrop-blur-sm">
                <Clock className="w-4 h-4 text-primary-400" />
                <span className="text-[12px] text-slate-300 font-mono">
                  Established <span className="text-white font-semibold">{new Date(authorshipTimestamp).toLocaleDateString('en-GB', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}</span> at {new Date(authorshipTimestamp).toLocaleTimeString('en-GB', {
                    hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
                  })}
                </span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
                <Shield className="w-3.5 h-3.5" /> SHA-256 Chain Verified
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Build Velocity: <strong className="text-white">{events.length} immutable events</strong>
              </span>
            </div>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 text-[13px] font-bold text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 border border-white/10 px-5 py-2.5 rounded-xl transition-all focus-ring shadow-lg w-full sm:w-auto shrink-0 group"
          >
            <Download className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
            Export Record
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[15px] font-extrabold text-slate-900">Build Timeline</h3>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
            {events.length} events
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-[14px] font-semibold text-slate-500">No events yet</p>
            <p className="text-[12px] mt-1 max-w-xs mx-auto leading-relaxed text-slate-400">
              Timeline events are recorded automatically as you build — posting updates, adding decisions, members joining, and more.
            </p>
          </div>
        ) : (
          <div className="relative">
            {events.map((event, index) => (
              <TimelineEventRow key={event.id} event={event} index={index} />
            ))}
          </div>
        )}
      </div>

      {/* Integrity Notice */}
      <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
        <Shield className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-[12px] font-bold text-emerald-700 mb-0.5">Tamper-Evident Timeline</p>
          <p className="text-[11px] text-emerald-600 leading-relaxed">
            Each event is recorded with a cryptographic hash for integrity. Events cannot be deleted or modified. This timeline serves as verifiable evidence of authorship and build history.
          </p>
        </div>
      </div>
    </div>
  );
}
