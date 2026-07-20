import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Sparkles, Search, Filter, BookMarked, ArrowRight, TrendingUp, Mail } from "lucide-react";
import { supabase } from "../auth/AuthContext";
import { timeAgo } from "../../utils/helpers";

export default function LearningHub() {
  const [featuredLogs, setFeaturedLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data, error } = await supabase
        .from('learning_hub_features')
        .select(`
          id,
          editorial_note,
          is_build_of_the_month,
          featured_at,
          rooms (
            id,
            title,
            description,
            project_stage,
            domain,
            builder_id,
            created_at,
            users ( name )
          )
        `)
        .order('featured_at', { ascending: false });
        
      if (data) setFeaturedLogs(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    // We would use an Edge Function to insert into Resend here, but for now we write to DB
    const { error } = await supabase.from('newsletter_subscribers').insert({ email, source: 'learning_hub_bom' });
    if (!error || error.code === '23505') { // 23505 is unique violation (already subscribed)
      setSubscribed(true);
      setEmail("");
    }
  };

  const buildOfTheMonth = featuredLogs.find(log => log.is_build_of_the_month) || featuredLogs[0];
  const regularFeatures = featuredLogs.filter(log => log.id !== buildOfTheMonth?.id);

  return (
    <div className="min-h-screen bg-ink font-sans selection:bg-primary-400/30 text-white overflow-hidden relative">
      {/* Background Ambient Glow */}
      <div className="fixed top-0 inset-x-0 h-screen pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary-400/10 blur-[120px] rounded-full" />
      </div>

      {/* Public Header */}
      <header className="sticky top-0 z-50 bg-ink/80 backdrop-blur-xl border-b border-white/[0.08] h-[72px] px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 text-2xl font-extrabold tracking-tight text-white group">
          <span>patch<span className="inline-block text-primary-400 group-hover:animate-[spin_2s_linear_infinite]">·</span>work</span>
          <span className="rounded-full bg-white/[0.08] border border-white/[0.1] px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-300">Learning Hub</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="text-[13px] font-bold text-slate-400 hover:text-white transition-colors">Dashboard</Link>
          <Link to="/signup" className="text-[13px] font-bold bg-white text-black px-5 py-2.5 rounded-full hover:bg-slate-200 transition shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]">Start Building</Link>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-6 py-16 relative">
        {/* Hero */}
        <div className="max-w-3xl mb-20 text-center mx-auto">
          <h1 className="text-[56px] md:text-[72px] font-extrabold font-display leading-[1.05] tracking-tight text-white mb-6">
            Learn from <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-500 drop-shadow-[0_0_30px_rgba(139,124,248,0.3)]">real work</span>.
          </h1>
          <p className="text-[18px] md:text-[20px] text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto">
            A curated collection of the best build logs, most insightful expert reviews, and most-discussed decisions from the Patchwork community. No theoretical frameworks—just practitioners building in public.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-4 mb-12 pb-8 border-b border-white/[0.08]">
          <div className="relative flex-1 min-w-[250px] group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full blur opacity-20 group-focus-within:opacity-40 transition-opacity" />
            <Search className="w-5 h-5 text-slate-400 absolute left-5 top-1/2 -translate-y-1/2 z-10" />
            <input 
              type="text" 
              placeholder="Search by domain, city, or topic..." 
              className="relative w-full bg-ink-80/80 backdrop-blur-sm border border-white/[0.1] rounded-full pl-12 pr-6 py-3.5 text-[15px] font-medium text-white focus:outline-none focus:border-primary-400/50 transition-all placeholder:text-slate-500"
            />
          </div>
          <button className="flex items-center gap-2 px-6 py-3.5 bg-ink-80/80 backdrop-blur-sm border border-white/[0.1] rounded-full text-[14px] font-bold text-slate-300 hover:text-white hover:bg-white/[0.05] transition-all">
            <Filter className="w-4 h-4" /> Filters
          </button>
        </div>

        {loading ? (
          <div className="py-32 flex justify-center">
            <div className="w-8 h-8 border-2 border-primary-400/20 border-t-primary-400 rounded-full animate-spin shadow-[0_0_15px_rgba(139,124,248,0.5)]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12">
            
            {/* Main Content Area */}
            <div className="space-y-16">
              
              {/* Build of the Month */}
              {buildOfTheMonth && (
                <section>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                      <Sparkles className="w-5 h-5 text-amber-500" />
                    </div>
                    <h2 className="text-[22px] font-extrabold text-white font-display tracking-tight">Build of the Month</h2>
                  </div>
                  
                  <Link to={`/dashboard/build-logs/${buildOfTheMonth.rooms?.id}`} className="block group">
                    <div className="bg-ink-80/60 backdrop-blur-md rounded-[32px] p-8 border border-white/[0.08] hover:border-amber-500/30 transition-all relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-500/10 to-orange-500/5 rounded-full blur-[80px] -z-10 -mr-20 -mt-20 group-hover:from-amber-500/20 transition-all duration-500" />
                      
                      <div className="flex items-start justify-between gap-4 mb-8">
                        <div>
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold uppercase tracking-widest mb-5">
                            🏆 Featured Selection
                          </div>
                          <h3 className="text-[32px] font-extrabold text-white font-display leading-[1.1] group-hover:text-amber-400 transition-colors drop-shadow-sm">
                            {buildOfTheMonth.rooms?.title}
                          </h3>
                          <div className="flex items-center gap-3 text-[14px] font-medium text-slate-400 mt-4">
                            <span className="text-white">{buildOfTheMonth.rooms?.users?.name}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-600" />
                            <span className="capitalize">{buildOfTheMonth.rooms?.project_stage}</span>
                          </div>
                        </div>
                        <button className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.05] flex items-center justify-center text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/20 transition-all group-hover:scale-110 active:scale-95">
                          <BookMarked className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="bg-ink/50 rounded-2xl p-6 border border-white/[0.05]">
                        <p className="text-[15px] text-slate-300 font-medium leading-relaxed">
                          <span className="font-bold text-white uppercase tracking-wider text-[12px] mr-2 opacity-80">Editorial Note:</span> 
                          {buildOfTheMonth.editorial_note}
                        </p>
                      </div>
                    </div>
                  </Link>
                </section>
              )}

              {/* Editor's Picks */}
              {regularFeatures.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-primary-400/10 flex items-center justify-center border border-primary-400/20 shadow-[0_0_15px_rgba(139,124,248,0.2)]">
                      <TrendingUp className="w-5 h-5 text-primary-400" />
                    </div>
                    <h2 className="text-[22px] font-extrabold text-white font-display tracking-tight">Editor's Picks</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {regularFeatures.map(log => (
                      <Link key={log.id} to={`/dashboard/build-logs/${log.rooms?.id}`} className="block group">
                        <div className="bg-ink-80/60 backdrop-blur-md rounded-[24px] p-6 border border-white/[0.08] hover:border-primary-400/40 hover:bg-ink-80 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-400/5 rounded-full blur-[40px] -z-10 group-hover:bg-primary-400/10 transition-colors" />
                          
                          <div className="flex items-start justify-between gap-3 mb-5">
                            <h3 className="text-[18px] font-bold text-white leading-snug group-hover:text-primary-400 transition-colors">
                              {log.rooms?.title}
                            </h3>
                            <button className="text-slate-500 hover:text-primary-400 transition-colors p-1">
                              <BookMarked className="w-5 h-5" />
                            </button>
                          </div>
                          
                          <p className="text-[14px] text-slate-400 mb-8 flex-1 line-clamp-3 leading-relaxed">
                            {log.editorial_note}
                          </p>
                          
                          <div className="flex items-center justify-between mt-auto pt-5 border-t border-white/[0.05]">
                            <div className="flex items-center gap-2 text-[12px] font-bold text-slate-300 uppercase tracking-wider">
                              <span>{log.rooms?.users?.name}</span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.05] flex items-center justify-center group-hover:bg-primary-400/20 group-hover:text-primary-400 transition-colors">
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              
              {/* Newsletter Box */}
              <div className="bg-gradient-to-b from-[#1C1A24] to-[#0E0C15] rounded-[32px] p-8 text-white relative overflow-hidden border border-white/[0.08] shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary-400/50 to-transparent opacity-50" />
                <div className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] bg-primary-400/20 rounded-full blur-[60px]" />
                
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400/20 to-primary-500/10 flex items-center justify-center mb-8 border border-primary-400/20 shadow-inner">
                  <Mail className="w-7 h-7 text-primary-400" />
                </div>
                
                <h3 className="text-[24px] font-extrabold font-display tracking-tight leading-tight mb-4 text-white">Build of the Month <br/><span className="text-slate-400">Digest</span></h3>
                <p className="text-[15px] text-slate-400 font-medium leading-relaxed mb-8">
                  Get the single most impactful build log from the last 30 days sent straight to your inbox, complete with expert synthesis.
                </p>
                
                {subscribed ? (
                  <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl p-4 text-[14px] font-bold text-center flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" /> Thanks! You're subscribed.
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="space-y-4">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-500 rounded-xl blur-[2px] opacity-20 group-focus-within:opacity-40 transition-opacity" />
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email" 
                        className="relative w-full bg-ink/80 backdrop-blur-sm border border-white/[0.1] rounded-xl px-5 py-4 text-[15px] focus:outline-none focus:border-primary-400 transition-colors placeholder:text-slate-500 text-white"
                      />
                    </div>
                    <button type="submit" className="relative w-full bg-white text-black font-extrabold text-[15px] py-4 rounded-xl hover:bg-slate-200 transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] overflow-hidden group">
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        Subscribe <ArrowRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </span>
                    </button>
                  </form>
                )}
                <p className="text-[11px] text-slate-500 text-center mt-6 font-bold uppercase tracking-widest">No spam. Unsubscribe anytime.</p>
              </div>

            </div>

          </div>
        )}
      </main>
    </div>
  );
}
