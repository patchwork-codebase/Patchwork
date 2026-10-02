import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useDiscoveryProjects, useCreateDiscoveryProject } from '../../hooks/useDiscovery';
import { Link, useNavigate } from 'react-router';
import { Plus, Compass, Beaker, FileText, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

export default function DiscoveryHub() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { data: projects, isLoading } = useDiscoveryProjects(user?.id);
  const createProject = useCreateDiscoveryProject();
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const isObserver = profile?.role === 'observer';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isObserver) return;
    if (!title.trim()) {
      toast.error("Please enter a project title");
      return;
    }
    if (!user) {
      toast.error("User session not loaded yet. Please wait.");
      return;
    }

    setIsCreating(true);
    toast.loading("Creating project...", { id: "create-project" });

    try {
      const newProject = await createProject.mutateAsync({
        title: title.trim(),
        builder_id: user.id,
      });
      toast.success("Project created!", { id: "create-project" });
      navigate(`/dashboard/discovery/${newProject.id}`);
    } catch (err: any) {
      console.error("Create project error:", err);
      toast.error(err.message || 'Failed to create project. Ensure Supabase schema is set up.', { id: "create-project" });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-2">Discovery Projects</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base">Validate assumptions and gather signals before you build.</p>
        </div>
        {!isObserver && (
          <form onSubmit={handleCreate} className="flex gap-2 w-full sm:w-auto">
            <input 
              type="text" 
              placeholder="New Project Title..." 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 sm:w-64 px-4 py-2 bg-transparent border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400/50 text-slate-900 dark:text-slate-100 placeholder-slate-500 text-sm"
            />
            <button 
              type="submit" 
              disabled={!title.trim() || isCreating}
              className="bg-primary-400 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-[#7a6aeb] disabled:opacity-50 text-sm whitespace-nowrap"
            >
              {isCreating ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Plus className="w-4 h-4"/>}
              New Project
            </button>
          </form>
        )}
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
      ) : projects?.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl bg-transparent">
          <Compass className="w-12 h-12 text-slate-500 dark:text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">No Discovery Projects Yet</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">Start a new discovery project to validate your idea with customer interviews, market signals, and clear hypotheses.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects?.map(project => (
            <Link 
              key={project.id} 
              to={`/dashboard/discovery/${project.id}`}
              className="group bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-2xl p-6 hover:shadow-lg hover:bg-slate-100 dark:bg-slate-800 hover:border-primary-400/30 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                  project.status === 'active' ? 'bg-primary-400/10 text-primary-400' :
                  project.status === 'converted' ? 'bg-emerald-500/10 text-emerald-500' :
                  'bg-rose-500/10 text-rose-500'
                }`}>
                  {project.status}
                </div>
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <span className="text-xs font-bold">{project.confidence_score}%</span>
                  <Beaker className="w-3.5 h-3.5" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-primary-400 transition-colors line-clamp-1">{project.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 h-10">
                {project.problem_statement || "No problem statement defined yet."}
              </p>
              <div className="flex items-center justify-between text-sm border-t border-slate-300 dark:border-slate-700/50 pt-4">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-4 h-4"/>
                  Open workspace
                </span>
                <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:text-primary-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
