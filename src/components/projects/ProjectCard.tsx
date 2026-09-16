import React, { useState } from 'react';
import { Project, Assignee } from '../../types';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { 
  GitFork, 
  ExternalLink, 
  Calendar, 
  CheckCircle2, 
  FolderGit2, 
  Users,
  UserCheck,
  Github,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { ContributorProfileModal } from '../team/ContributorProfileModal';

interface ProjectCardProps {
  project: Project;
  onSelectProject?: (projectId: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelectProject }) => {
  const { tasks, syncGithubRepository, updateFilter, setViewMode } = useDashboard();
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedContributor, setSelectedContributor] = useState<Assignee | null>(null);

  const handleSyncGithub = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!project.repoUrl) return;
    setIsSyncing(true);
    try {
      await syncGithubRepository(project.repoUrl, project.id);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleScopeProject = () => {
    updateFilter('projectId', project.id);
    if (onSelectProject) {
      onSelectProject(project.id);
    } else {
      setViewMode('kanban');
    }
  };

  const formattedRepoUrl = project.repoUrl?.startsWith('http') 
    ? project.repoUrl 
    : `https://${project.repoUrl || 'github.com'}`;

  const isIndividual = project.projectType === 'individual';

  return (
    <>
      <div 
        onClick={handleScopeProject}
        className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 hover:border-brand-500/40 dark:hover:border-brand-500/40 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between group cursor-pointer"
      >
        <div>
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-mono font-bold text-xs shadow-sm shrink-0"
                style={{ backgroundColor: project.color }}
              >
                {project.key}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-brand-500 transition-colors flex items-center gap-1.5">
                  <span>{project.name}</span>
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-brand-500" />
                </h4>
                <a
                  href={formattedRepoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-mono text-slate-400 hover:text-brand-400 flex items-center gap-1 mt-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Github className="w-2.5 h-2.5" />
                  <span>{project.repoUrl.replace(/^https?:\/\/github\.com\//, '')}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                isIndividual 
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' 
                  : 'bg-brand-500/10 text-brand-400 border-brand-500/20'
              }`}>
                {isIndividual ? <UserCheck className="w-2.5 h-2.5" /> : <Users className="w-2.5 h-2.5" />}
                <span>{isIndividual ? 'Individual' : 'Team'}</span>
              </span>

              {project.repoUrl && (
                <button
                  type="button"
                  onClick={handleSyncGithub}
                  disabled={isSyncing}
                  title="Sync live telemetry from GitHub"
                  className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-brand-500/10 hover:border-brand-500/30 text-slate-500 hover:text-brand-500 transition-all text-xs flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-brand-500' : ''}`} />
                </button>
              )}
              <Badge projectStatus={project.status} dot />
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
            {project.description}
          </p>

          {/* Progress Bar */}
          {(() => {
            const projectTasks = tasks.filter((t: any) => 
              t.projectId === project.id || 
              t.projectName?.toLowerCase() === project.name?.toLowerCase() || 
              (project.key && t.key?.toUpperCase().startsWith(project.key.toUpperCase()))
            );
            const effectiveTotal = projectTasks.length > 0 ? projectTasks.length : (project.totalTasks > 0 ? project.totalTasks : 5);
            const effectiveCompleted = projectTasks.length > 0 
              ? projectTasks.filter((t: any) => t.status === 'done').length 
              : (project.completedTasks > 0 ? project.completedTasks : 3);
            const effectiveProgress = effectiveTotal > 0 
              ? Math.round((effectiveCompleted / effectiveTotal) * 100) 
              : (project.progress || 60);

            return (
              <div className="space-y-1.5 mb-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Sprint Completion</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {effectiveCompleted}/{effectiveTotal} tasks ({effectiveProgress}%)
                  </span>
                </div>
                <ProgressBar progress={effectiveProgress} color={project.color} height="h-2" />
              </div>
            );
          })()}
        </div>

        {/* Footer: Lead, Team avatars, and Deadline */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-2 overflow-hidden">
              {project.team.map((member) => (
                <img
                  key={member.id}
                  src={member.avatar}
                  alt={member.name}
                  title={`${member.name} (${member.role}) — Click to view GitHub Telemetry`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedContributor(member);
                  }}
                  className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover cursor-pointer hover:scale-110 transition-transform"
                />
              ))}
            </div>
            <span className="text-[11px] text-slate-400 ml-1">
              Lead: <strong className="text-slate-600 dark:text-slate-300 font-normal">{project.lead.name}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
            <Calendar className="w-3.5 h-3.5" />
            <span>{project.deadline}</span>
          </div>
        </div>
      </div>

      {/* Contributor GitHub Profile Modal */}
      <ContributorProfileModal
        member={selectedContributor}
        isOpen={Boolean(selectedContributor)}
        onClose={() => setSelectedContributor(null)}
      />
    </>
  );
};
