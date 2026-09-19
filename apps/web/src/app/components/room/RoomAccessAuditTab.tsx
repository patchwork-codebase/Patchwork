import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Eye,
  UserPlus,
  Download,
  FileText,
  Link2,
  FileCheck,
  UserMinus,
  RefreshCw,
  ShieldCheck,
  ShieldX,
  Mail,
  Clock,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
} from 'lucide-react';
import { useRoomAccessLog } from '../../hooks/useRoomAccessLog';
import type { AccessLogEntry, AccessLogAction } from '../../types';
import { timeAgo } from '../../utils/helpers';

interface RoomAccessAuditTabProps {
  roomId: string;
}

const ACTION_CONFIG: Record<AccessLogAction, { icon: React.ReactNode; label: string; color: string }> = {
  viewed: { icon: <Eye className="w-3.5 h-3.5" />, label: 'Viewed room', color: 'bg-slate-100 text-slate-600' },
  joined: { icon: <UserPlus className="w-3.5 h-3.5" />, label: 'Joined', color: 'bg-emerald-50 text-emerald-600' },
  left: { icon: <UserMinus className="w-3.5 h-3.5" />, label: 'Left', color: 'bg-slate-100 text-slate-500' },
  downloaded_file: { icon: <Download className="w-3.5 h-3.5" />, label: 'Downloaded file', color: 'bg-orange-50 text-orange-600' },
  exported_doc: { icon: <FileText className="w-3.5 h-3.5" />, label: 'Exported doc', color: 'bg-orange-50 text-orange-600' },
  copied_invite_link: { icon: <Link2 className="w-3.5 h-3.5" />, label: 'Copied invite link', color: 'bg-blue-50 text-blue-600' },
  nda_accepted: { icon: <ShieldCheck className="w-3.5 h-3.5" />, label: 'Accepted NDA', color: 'bg-emerald-50 text-emerald-600' },
  nda_declined: { icon: <ShieldX className="w-3.5 h-3.5" />, label: 'Declined NDA', color: 'bg-rose-50 text-rose-600' },
  invited: { icon: <Mail className="w-3.5 h-3.5" />, label: 'Invited', color: 'bg-primary-400/10 text-primary-400' },
  invitation_accepted: { icon: <FileCheck className="w-3.5 h-3.5" />, label: 'Invitation accepted', color: 'bg-emerald-50 text-emerald-600' },
  invitation_declined: { icon: <ShieldX className="w-3.5 h-3.5" />, label: 'Invitation declined', color: 'bg-rose-50 text-rose-600' },
  invitation_revoked: { icon: <ShieldX className="w-3.5 h-3.5" />, label: 'Invitation revoked', color: 'bg-slate-100 text-slate-500' },
  removed: { icon: <UserMinus className="w-3.5 h-3.5" />, label: 'Removed', color: 'bg-rose-50 text-rose-600' },
  role_changed: { icon: <RefreshCw className="w-3.5 h-3.5" />, label: 'Role changed', color: 'bg-indigo-50 text-indigo-600' },
};

const FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Events' },
  { value: 'viewed', label: 'Views' },
  { value: 'joined', label: 'Joins' },
  { value: 'downloaded_file', label: 'Downloads' },
  { value: 'nda_accepted', label: 'NDA Acceptances' },
  { value: 'invited', label: 'Invitations' },
];

function AccessLogRow({ entry }: { entry: AccessLogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const config = ACTION_CONFIG[entry.action] ?? ACTION_CONFIG.viewed;
  const hasMetadata = entry.metadata && Object.keys(entry.metadata).length > 0;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0 group">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${config.color}`}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[13px] font-semibold text-slate-900 truncate">
              {entry.userName || entry.userEmail || 'Anonymous'}
            </span>
            <span className="text-[12px] text-slate-500">{config.label}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Clock className="w-3 h-3 text-slate-600 dark:text-slate-300" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap" title={entry.createdAt}>
              {timeAgo(entry.createdAt)}
            </span>
          </div>
        </div>
        {entry.userEmail && entry.userName && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{entry.userEmail}</p>
        )}
        {hasMetadata && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="mt-1 flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-600 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Hide' : 'Show'} details
          </button>
        )}
        {expanded && hasMetadata && (
          <pre className="mt-2 text-[10px] text-slate-500 bg-slate-50 border border-slate-100 rounded-lg p-2.5 overflow-x-auto font-mono shadow-sm dark:shadow-none">
            {JSON.stringify(entry.metadata, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

/**
 * Access audit tab visible only to the builder.
 * Shows a complete log of who viewed, joined, downloaded, accepted NDAs, etc.
 */
export function RoomAccessAuditTab({ roomId }: RoomAccessAuditTabProps) {
  const { data: entries = [], isLoading } = useRoomAccessLog(roomId);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = entries.filter(entry => {
    const matchesSearch =
      !search ||
      entry.userName?.toLowerCase().includes(search.toLowerCase()) ||
      entry.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
      entry.action.includes(search.toLowerCase());

    const matchesFilter = filter === 'all' || entry.action === filter;

    return matchesSearch && matchesFilter;
  });

  // Stats summary
  const stats = {
    views: entries.filter(e => e.action === 'viewed').length,
    joins: entries.filter(e => e.action === 'joined').length,
    downloads: entries.filter(e => e.action === 'downloaded_file' || e.action === 'exported_doc').length,
    ndas: entries.filter(e => e.action === 'nda_accepted').length,
    uniqueUsers: new Set(entries.map(e => e.userId).filter(Boolean)).size,
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Views', value: stats.views, icon: <Eye className="w-4 h-4" />, color: 'text-slate-600 bg-slate-50 border-slate-200' },
          { label: 'Joins', value: stats.joins, icon: <UserPlus className="w-4 h-4" />, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
          { label: 'Downloads', value: stats.downloads, icon: <Download className="w-4 h-4" />, color: 'text-orange-600 bg-orange-50 border-orange-200' },
          { label: 'NDA Signed', value: stats.ndas, icon: <ShieldCheck className="w-4 h-4" />, color: 'text-primary-400 bg-primary-400/10 border-primary-400/20' },
          { label: 'Unique Users', value: stats.uniqueUsers, icon: <UserPlus className="w-4 h-4" />, color: 'text-blue-600 bg-blue-50 border-blue-200' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-2xl border p-4 flex flex-col items-center gap-1.5 ${stat.color}`}>
            <div>{stat.icon}</div>
            <span className="text-[20px] font-extrabold font-display">{stat.value}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-center opacity-70">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-100 rounded-[24px] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-[13px] bg-slate-50 border border-slate-100 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400/50 placeholder:text-slate-500 dark:text-slate-400 shadow-sm dark:shadow-none"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="pl-9 pr-8 py-2.5 text-[13px] bg-slate-50 border border-slate-100 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-400/30 appearance-none cursor-pointer shadow-sm dark:shadow-none"
            >
              {FILTER_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Log Entries */}
        <div className="divide-y divide-slate-100 px-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Eye className="w-10 h-10 mx-auto mb-3 text-slate-600 dark:text-slate-300" />
              <p className="text-[14px] font-semibold text-slate-500 dark:text-slate-400">
                {entries.length === 0 ? 'No access events yet' : 'No events match your filters'}
              </p>
              <p className="text-[12px] text-slate-600 dark:text-slate-300 mt-1">
                Events are recorded as people interact with your room.
              </p>
            </div>
          ) : (
            filtered.map(entry => (
              <AccessLogRow key={entry.id} entry={entry} />
            ))
          )}
        </div>

        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 shadow-sm dark:shadow-none">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Showing {filtered.length} of {entries.length} events · All times in local timezone
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
