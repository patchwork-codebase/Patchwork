import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, Target, CheckCircle2, XCircle, FileText, BadgeCheck } from "lucide-react";
import { supabase, useAuth } from "../auth/AuthContext";
import { toast } from "sonner";
import { UserAvatar } from "../ui/UserAvatar";
import { timeAgo } from "../../utils/helpers";

interface BountyApplication {
  id: string;
  update_id: string;
  builder_id: string;
  pitch_text: string;
  status: string;
  created_at: string;
  builder: {
    id: string;
    name: string;
    avatar: string;
    reputation: number;
    is_verified_expert: boolean;
  };
  update: {
    id: string;
    content: string;
  };
}

export default function BountyDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<BountyApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchApplications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('bounty_applications')
        .select(`
          *,
          builder:users!builder_id(id, name, avatar, reputation, is_verified_expert),
          update:updates!update_id(id, content)
        `)
        .eq('observer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load bounty pitches.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [user]);

  const handleAccept = async (appId: string) => {
    try {
      const { data, error } = await supabase.rpc('accept_bounty_application', {
        p_application_id: appId
      });

      if (error) throw error;
      
      toast.success("Match Accepted! Room created. 🚀");
      fetchApplications();
      
      if (data && data.room_id) {
        navigate(`/dashboard/room/${data.room_id}`);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to accept match: ${err.message}`);
    }
  };

  const handleReject = async (appId: string) => {
    try {
      const { error } = await supabase
        .from('bounty_applications')
        .update({ status: 'rejected' })
        .eq('id', appId);

      if (error) throw error;
      toast.success("Pitch declined.");
      fetchApplications();
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to reject match.");
    }
  };

  return (
    <div className="w-full max-w-[900px] mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link 
          to="/dashboard" 
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10"
        >
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Target className="w-6 h-6 text-cyan-400" /> Bounty Matches
          </h1>
          <p className="text-sm text-slate-400 mt-1">Review builders who want to build your RFBs.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-slate-400">Loading pitches...</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-[24px] border border-white/10">
          <Target className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No pitches yet</h2>
          <p className="text-slate-400 text-sm">When builders apply to your RFB posts, they'll show up here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div 
              key={app.id} 
              className={`p-6 rounded-[24px] border ${app.status === 'accepted' ? 'bg-green-500/5 border-green-500/20' : 'bg-[#1a1a1a] border-white/10'}`}
            >
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-4 uppercase tracking-wider font-bold">
                    <FileText className="w-3.5 h-3.5" />
                    <span className="truncate">{app.update?.content || 'Request For Builder'}</span>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <UserAvatar 
                      userId={app.builder?.id} 
                      name={app.builder?.name || 'Builder'} 
                      avatarUrl={app.builder?.avatar} 
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-white text-base">{app.builder?.name || 'Builder'}</h3>
                        {app.builder?.is_verified_expert && (
                          <BadgeCheck className="w-4 h-4 text-cyan-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span className="text-amber-400 font-bold">★ {app.builder?.reputation || 0} Rep</span>
                        <span>•</span>
                        <span>{timeAgo(app.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/40 rounded-xl p-4 text-sm text-slate-200 border border-white/5 leading-relaxed">
                    {app.pitch_text}
                  </div>
                </div>

                <div className="sm:w-[200px] shrink-0 flex flex-col justify-center gap-3">
                  {app.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleAccept(app.id)}
                        className="w-full py-2.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Accept Match
                      </button>
                      <button 
                        onClick={() => handleReject(app.id)}
                        className="w-full py-2.5 rounded-full bg-transparent border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-bold text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" /> Decline
                      </button>
                    </>
                  )}
                  
                  {app.status === 'accepted' && (
                    <div className="w-full py-3 rounded-xl bg-green-500/10 text-green-400 font-bold text-sm flex items-center justify-center gap-2 border border-green-500/20">
                      <CheckCircle2 className="w-5 h-5" /> Match Accepted
                    </div>
                  )}

                  {app.status === 'rejected' && (
                    <div className="w-full py-3 rounded-xl bg-slate-800 text-slate-400 font-bold text-sm flex items-center justify-center border border-white/5">
                      Declined
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
