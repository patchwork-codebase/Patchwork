import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams, Outlet } from "react-router";
import { MessageSquare, Search, PenSquare } from "lucide-react";
import { supabase, useAuth } from "../auth/AuthContext";
import { UserAvatar } from "../ui/UserAvatar";
import { timeAgo } from "../../utils/helpers";
import { toast } from "sonner";
import { useConversations } from "../../hooks/useChat";

export default function MessagesLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { roomId } = useParams();
  
  const [search, setSearch] = useState("");
  const { conversations, isLoading } = useConversations(user);

  const filtered = conversations.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex h-[calc(100vh-60px)] w-full overflow-hidden bg-white dark:bg-[#050505]">
      {/* INBOX SIDEBAR */}
      <div className={`w-full md:w-[320px] lg:w-[380px] border-r border-slate-100 dark:border-white/5 flex flex-col bg-slate-50 dark:bg-[#0a0a0a] ${roomId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary-500 dark:text-primary-400" /> Messages
            </h1>
            <button className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/5 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors">
              <PenSquare className="w-4 h-4" />
            </button>
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-[#111] border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-primary-500/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No conversations found.</div>
          ) : (
            filtered.map(conv => (
              <Link 
                key={conv.id}
                to={`/dashboard/messages/${conv.id}`}
                className={`flex items-start gap-3 p-4 border-b border-slate-100 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer ${roomId === conv.id ? 'bg-primary-50 dark:bg-primary-500/10 hover:bg-primary-50 dark:hover:bg-primary-500/10' : ''}`}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500/10 dark:from-primary-500/20 to-purple-500/10 dark:to-purple-500/20 flex items-center justify-center shrink-0 border border-primary-500/10 dark:border-white/10 overflow-hidden">
                  <span className="font-bold text-primary-600 dark:text-primary-400 font-display">
                    {conv.title.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate pr-2">{conv.title}</h3>
                    {conv.last_message && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                        {timeAgo(conv.last_message.created_at, true)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {conv.last_message ? (
                      <>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{conv.last_message.sender?.name.split(' ')[0]}: </span>
                        {conv.last_message.content}
                      </>
                    ) : (
                      <span className="italic">No messages yet</span>
                    )}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* CHAT THREAD (Main Content) */}
      <div className={`flex-1 flex flex-col bg-white dark:bg-[#050505] ${!roomId ? 'hidden md:flex' : 'flex'}`}>
        {roomId ? (
          <Outlet />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
            <h2 className="text-lg font-bold text-slate-300 dark:text-white/50 mb-1">Your Messages</h2>
            <p className="text-sm">Select a conversation to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}
