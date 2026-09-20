import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { FolderGit2, CheckCircle2, AlertTriangle, ArrowUpRight, Github, Users, User } from 'lucide-react';

interface ProjectsHealthMeshProps {
  onNavigateToProjects?: () => void;
}

export const ProjectsHealthMesh: React.FC<ProjectsHealthMeshProps> = ({ onNavigateToProjects }) => {
  const { projects, tasks, openProjectDetails } = useDashboard();

  if (projects.length === 0) {
    return null;
  }

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Active Repositories & Services Mesh
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-brand-500/15 text-brand-400 border border-brand-500/20">
              {projects.length} Active
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time delivery progress and engineering lead allocation
          </p>
        </div>

        {onNavigateToProjects && (
          <button
            onClick={onNavigateToProjects}
            className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>All Services</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Grid of Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((proj) => {
          const projTasks = tasks.filter(t => t.projectId === proj.id || t.projectName?.toLowerCase() === proj.name.toLowerCase());
          const totalProjTasks = projTasks.length > 0 ? projTasks.length : (proj.totalTasks || 0);
          const completedProjTasks = projTasks.length > 0 ? projTasks.filter(t => t.status === 'done').length : (proj.completedTasks || 0);
          const progress = totalProjTasks > 0 ? Math.round((completedProjTasks / totalProjTasks) * 100) : (proj.progress || 0);

          const isTeam = (proj.projectType || 'team') === 'team';

          return (
            <div
              key={proj.id}
              onClick={() => openProjectDetails(proj)}
              className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 hover:border-brand-500/40 transition-all flex flex-col justify-between space-y-3 cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20 shrink-0">
                      {proj.key}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {proj.name}
                    </h4>
                  </div>

                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${
                    isTeam
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  }`}>
                    {isTeam ? <Users className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                    {isTeam ? 'Team' : 'Solo'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {proj.description || 'No description provided.'}
                </p>
              </div>

              <div>
                {/* Progress bar */}
                <div className="space-y-1 mb-2.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Shipped</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{progress}% ({completedProjTasks}/{totalProjTasks} tasks)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Lead and Git Info */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <img
                      src={proj.lead?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                      alt={proj.lead?.name || 'Lead'}
                      className="w-4 h-4 rounded-full object-cover shrink-0"
                    />
                    <span className="text-slate-600 dark:text-slate-400 truncate">
                      Lead: <strong className="text-slate-800 dark:text-slate-200 font-medium">{proj.lead?.name?.split(' ')[0] || 'dev'}</strong>
                    </span>
                  </div>

                    {proj.repoUrl && (
                      <a
                        href={proj.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-slate-400 hover:text-brand-400 transition-colors flex items-center gap-1 font-mono text-[10px]"
                      >
                        <Github className="w-3 h-3" />
                        <span>Repo</span>
                      </a>
                    )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
