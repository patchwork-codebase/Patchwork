import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { apiCall, supabase } from "../auth/AuthContext";
import { Hammer, Users, Clock, ArrowLeft, Share2, BookOpen, Zap, MessageCircle } from "lucide-react";
import { toast } from "sonner";

interface Update {
  id: string;
  content: string;
  authorName: string;
  createdAt: string;
}

interface Reaction {
  id: string;
  type: 'sharp' | 'pushback' | 'tellmemore';
  text: string;
  updateId: string | null;
  observerName: string;
  createdAt: string;
}

interface LogData {
  room: {
    id: string;
    title: string;
    description: string;
    tags: string[];
    builderName: string;
    status: string;
    observerCount: number;
    createdAt: string;
    updatedAt: string;
  };
  updates: Update[];
  reactions: Reaction[];
  builder: { name: string; bio: string; reputation: number } | null;
}

function toCamelCase(key: string) {
  return key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

function normalizeRow(row: any): any {
  if (!row || typeof row !== 'object') return row;
  return Object.entries(row).reduce((result: any, [key, value]) => {
    const camelKey = toCamelCase(key);
    if (Array.isArray(value)) {
      result[camelKey] = value.map(item => (typeof item === 'object' && item !== null ? normalizeRow(item) : item));
    } else if (value && typeof value === 'object') {
      result[camelKey] = normalizeRow(value);
    } else {
      result[camelKey] = value;
    }
    return result;
  }, {});
}

const REACTION_CONFIG = {
  sharp: { emoji: '⚡', label: 'Sharp', color: 'bg-amber-50 border-amber-200 text-amber-800', badge: 'bg-amber-100 text-amber-700' },
  pushback: { emoji: '🔄', label: 'Push back', color: 'bg-red-50 border-red-200 text-red-800', badge: 'bg-red-100 text-red-700' },
  tellmemore: { emoji: '💬', label: 'Tell me more', color: 'bg-blue-50 border-blue-200 text-blue-800', badge: 'bg-blue-100 text-blue-700' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function BuildLog() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<LogData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        // 1. Fetch room details
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (roomError) throw roomError;
        if (!roomData) {
          setData(null);
          return;
        }

        // 2. Fetch updates
        const { data: updatesData, error: updatesError } = await supabase
          .from('updates')
          .select('*')
          .eq('room_id', id)
          .order('created_at', { ascending: false });

        if (updatesError) throw updatesError;

        // 3. Fetch reactions
        const { data: reactionsData, error: reactionsError } = await supabase
          .from('reactions')
          .select('*')
          .eq('room_id', id)
          .order('created_at', { ascending: false });

        if (reactionsError) throw reactionsError;

        // 4. Fetch builder details
        const { data: builderData, error: builderError } = await supabase
          .from('users')
          .select('name, bio, reputation')
          .eq('id', roomData.builder_id)
          .maybeSingle();

        if (builderError) throw builderError;

        setData({
          room: normalizeRow(roomData),
          updates: (updatesData || []).map(normalizeRow),
          reactions: (reactionsData || []).map(normalizeRow),
          builder: builderData ? normalizeRow(builderData) : null
        });
      } catch (err: any) {
        console.log('Load log error:', err);
        toast.error("Failed to load Build Log details");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied!');
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse space-y-4">
        <div className="h-8 bg-secondary rounded w-1/2" />
        <div className="h-4 bg-secondary rounded w-3/4" />
        <div className="h-48 bg-secondary rounded" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-lg font-medium text-foreground">Build Log not found</p>
        <Link to="/dashboard" className="text-primary hover:underline text-sm mt-2 inline-block">← Back to dashboard</Link>
      </div>
    );
  }

  const { room, updates, reactions, builder } = data;
  const reactionsByUpdate = reactions.reduce((acc, r) => {
    const key = r.updateId || '__room__';
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {} as Record<string, Reaction[]>);

  const reactionCounts = {
    sharp: reactions.filter(r => r.type === 'sharp').length,
    pushback: reactions.filter(r => r.type === 'pushback').length,
    tellmemore: reactions.filter(r => r.type === 'tellmemore').length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header bar */}
      <header className="border-b border-border/80 bg-card sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-6 h-6 bg-foreground rounded-sm flex items-center justify-center">
                <Hammer className="w-3 h-3 text-background" />
              </div>
              <span className="flex items-center gap-2 font-semibold text-sm hidden sm:block group">
                <span>patch<span className="inline-block text-primary group-hover:animate-[spin_2s_linear_infinite]">·</span>work</span>
                <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">Beta</span>
              </span>
            </Link>
            <span className="text-border">·</span>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-mono">
              <BookOpen className="w-3.5 h-3.5" /> Build Log
            </div>
          </div>
          <button
            onClick={copyLink}
            className="flex items-center gap-2 px-4 py-1.5 border border-border rounded-full text-sm hover:bg-secondary transition-all font-bold"
          >
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Room header */}
        <div className="mb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            {room.tags.map(tag => (
              <span key={tag} className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{tag}</span>
            ))}
          </div>
          <h1 className="text-4xl font-extrabold text-foreground mb-3 font-display">{room.title}</h1>
          {room.description && <p className="text-lg text-muted-foreground mb-4 leading-relaxed">{room.description}</p>}

          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap font-mono">
            <span className="flex items-center gap-1.5"><Hammer className="w-4 h-4 text-primary" /> {room.builderName}</span>
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {room.observerCount} observers</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {formatDate(room.createdAt)} – {formatDate(room.updatedAt)}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10 p-5 bg-card border border-border rounded-2xl shadow-sm">
          <div className="text-center">
            <div className="text-3xl font-extrabold text-foreground font-display">{updates.length}</div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mt-1">Updates</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-amber-600 font-display">{reactionCounts.sharp}</div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mt-1">⚡ Sharp</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-red-600 font-display">{reactionCounts.pushback}</div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mt-1">🔄 Push back</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-blue-600 font-display">{reactionCounts.tellmemore}</div>
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground mt-1">💬 Tell me more</div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-10">
          <h2 className="text-2xl font-extrabold text-foreground mb-6 font-display">Build Timeline</h2>
          {updates.length === 0 ? (
            <p className="text-muted-foreground text-sm">No updates were posted.</p>
          ) : (
            <div className="relative pl-6 border-l-2 border-border space-y-8">
              {updates.map((update, i) => {
                const updateReactions = reactionsByUpdate[update.id] || [];
                return (
                  <div key={update.id} className="relative">
                    <div className="absolute -left-[2rem] w-6 h-6 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                      <span className="text-xs font-bold text-primary font-mono">{i + 1}</span>
                    </div>
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground font-mono">
                        <span className="font-bold text-foreground">{update.authorName}</span>
                        <span>·</span>
                        <span>{formatTime(update.createdAt)}</span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-serif italic border-l-2 border-primary/20 pl-4">{update.content}</p>

                      {updateReactions.length > 0 && (
                        <div className="mt-6 pt-5 border-t border-border/65 space-y-3">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono mb-2">
                            <MessageCircle className="w-4 h-4" />
                            {updateReactions.length} reaction{updateReactions.length !== 1 ? 's' : ''}
                          </div>
                          {updateReactions.map(r => {
                            const cfg = REACTION_CONFIG[r.type];
                            return (
                              <div key={r.id} className={`flex items-start gap-3 p-4 border rounded-xl ${cfg.color} shadow-sm`}>
                                <span className="text-base">{cfg.emoji}</span>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded ${cfg.badge}`}>{cfg.label}</span>
                                    <span className="text-xs opacity-70 font-mono">by {r.observerName}</span>
                                  </div>
                                  <p className="text-sm leading-relaxed">{r.text}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Room-level reactions */}
        {(reactionsByUpdate['__room__'] || []).length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-extrabold text-foreground mb-6 font-display">General Reactions</h2>
            <div className="space-y-4">
              {(reactionsByUpdate['__room__'] || []).map(r => {
                const cfg = REACTION_CONFIG[r.type];
                return (
                  <div key={r.id} className={`flex items-start gap-3 p-5 border rounded-2xl ${cfg.color} shadow-sm`}>
                    <span className="text-xl">{cfg.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                        <span className="text-xs opacity-70 font-mono">by {r.observerName} · {formatTime(r.createdAt)}</span>
                      </div>
                      <p className="text-sm leading-relaxed">{r.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-border/80 pt-8 text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
            <div className="w-6 h-6 bg-foreground rounded-sm flex items-center justify-center">
              <Hammer className="w-3 h-3 text-background" />
            </div>
            <span className="flex items-center gap-2 font-semibold font-display text-foreground group">
              <span>patch<span className="inline-block text-primary group-hover:animate-[spin_2s_linear_infinite]">·</span>work</span>
              <span className="rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">Beta</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground font-mono">Build Log generated automatically · Powered by Patchwork</p>
          <Link to="/login" className="text-primary hover:underline text-sm font-bold mt-3 inline-block">Join to start building →</Link>
        </div>
      </div>
    </div>
  );
}

