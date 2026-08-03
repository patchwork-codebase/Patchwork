import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router';
import { LayoutDashboard, FileText, Split, UserCircle, ArrowLeft } from 'lucide-react';

export default function PMStudioLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0E0C15] text-slate-600 dark:text-slate-300 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-100 dark:border-white/10 bg-white dark:bg-[#120F1C] flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-100 dark:border-white/10">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Patchwork
          </button>
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">PM Studio</h1>
          <p className="text-xs text-slate-500 mt-1">AI-Powered Practice</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavLink 
            to="/pm-studio"
            end
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive ? 'bg-[#3b82f6]/10 text-[#3b82f6] font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </NavLink>
          <NavLink 
            to="/pm-studio/case-studies"
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive ? 'bg-[#3b82f6]/10 text-[#3b82f6] font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            <FileText className="w-5 h-5" /> Case Studies
          </NavLink>
          <NavLink 
            to="/pm-studio/decisions"
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive ? 'bg-[#3b82f6]/10 text-[#3b82f6] font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            <Split className="w-5 h-5" /> Decision Simulator
          </NavLink>
          <NavLink 
            to="/pm-studio/profile"
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive ? 'bg-[#3b82f6]/10 text-[#3b82f6] font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
              }`
            }
          >
            <UserCircle className="w-5 h-5" /> Reputation Profile
          </NavLink>
        </nav>
        
        <div className="p-4 border-t border-slate-100 dark:border-white/10 text-xs text-slate-600 text-center">
          Patchwork PM Studio MVP
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
