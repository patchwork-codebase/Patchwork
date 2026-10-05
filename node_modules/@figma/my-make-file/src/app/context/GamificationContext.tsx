import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../components/auth/AuthContext';
import { Award, Sparkles, TrendingUp, Rocket, X } from 'lucide-react';
import { Link } from 'react-router';

// Define the shape of our context
interface GamificationContextType {
  triggerKeepBuildingReminder: (nextLevel: any, currentReputation: number) => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [unlockedBadge, setUnlockedBadge] = useState<any | null>(null);
  const [reminderData, setReminderData] = useState<{nextLevel: any, currentReputation: number} | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get the current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    // Listen to real-time inserts on user_badges
    const channel = supabase
      .channel('public:user_badges')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_badges',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          const badgeId = payload.new.badge_id;
          if (badgeId) {
            // Fetch badge details
            const { data: badge } = await supabase
              .from('badges')
              .select('*')
              .eq('id', badgeId)
              .single();

            if (badge) {
              setUnlockedBadge(badge);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const triggerKeepBuildingReminder = (nextLevel: any, currentReputation: number) => {
    const lastReminder = localStorage.getItem('last_gamification_reminder');
    const now = Date.now();
    
    // Only show once every 7 days (604800000 ms)
    if (lastReminder && (now - parseInt(lastReminder)) < 604800000) {
      return; 
    }

    const pointsRequired = nextLevel.points_required;
    const progress = currentReputation / pointsRequired;

    if (progress >= 0.8) {
      setReminderData({ nextLevel, currentReputation });
      localStorage.setItem('last_gamification_reminder', now.toString());
    }
  };

  return (
    <GamificationContext.Provider value={{ triggerKeepBuildingReminder }}>
      {children}
      
      {/* Achievement Unlocked Modal */}
      {unlockedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#111] border-2 border-indigo-500/30 rounded-3xl p-8 max-w-sm w-full shadow-[0_0_50px_rgba(99,102,241,0.2)] relative overflow-hidden transform animate-in zoom-in-95 duration-500">
            {/* Background flair */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 blur-3xl rounded-full -ml-16 -mb-16 pointer-events-none" />
            
            <button 
              onClick={() => setUnlockedBadge(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full bg-slate-100 dark:bg-white/10 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span className="text-[11px] font-black tracking-widest text-amber-500 uppercase">New Achievement</span>
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
              
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/40 mb-6">
                <Award className="w-12 h-12 text-white" />
              </div>
              
              <h2 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2">{unlockedBadge.title}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-center text-[15px] mb-8">{unlockedBadge.description}</p>
              
              <Link 
                to="/dashboard/achievements" 
                onClick={() => setUnlockedBadge(null)}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-center transition-colors mb-3"
              >
                View in Gallery
              </Link>
              <button 
                onClick={() => setUnlockedBadge(null)}
                className="w-full py-3 text-slate-500 dark:text-slate-400 font-bold hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Keep Building
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keep Building Reminder Modal */}
      {reminderData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden transform animate-in slide-in-from-bottom-10 duration-500">
            <button 
              onClick={() => setReminderData(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full bg-slate-100 dark:bg-white/10 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center relative z-10">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-6">
                <Rocket className="w-8 h-8 text-indigo-500" />
              </div>
              
              <h2 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2">Almost There!</h2>
              <p className="text-slate-500 dark:text-slate-400 text-center text-[15px] mb-6">
                You only need <strong className="text-indigo-500">{reminderData.nextLevel.points_required - reminderData.currentReputation} more XP</strong> to unlock the {reminderData.nextLevel.title} certificate.
              </p>
              
              <div className="w-full mb-8">
                <div className="flex justify-between text-[12px] font-bold mb-2">
                  <span className="text-indigo-500">{reminderData.currentReputation} XP</span>
                  <span className="text-slate-400">{reminderData.nextLevel.points_required} XP</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(0, (reminderData.currentReputation / reminderData.nextLevel.points_required) * 100))}%` }}
                  />
                </div>
              </div>
              
              <Link 
                to="/dashboard" 
                onClick={() => setReminderData(null)}
                className="w-full py-3.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-black font-bold text-center hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors mb-3"
              >
                Post an Update (+10 XP)
              </Link>
              <button 
                onClick={() => setReminderData(null)}
                className="w-full py-3 text-slate-500 dark:text-slate-400 font-bold hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}
