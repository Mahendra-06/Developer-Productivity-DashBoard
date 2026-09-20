import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { ProjectCard } from './ProjectCard';
import { FolderGit2, Filter, CheckCircle2, AlertTriangle, Clock, FolderPlus } from 'lucide-react';
import { Button } from '../ui/Button';
import { ProjectStatus, ProjectCategory } from '../../types';
import { ProjectModal } from './ProjectModal';
import { ImportGithubRepoModal } from './ImportGithubRepoModal';

export const ProjectList: React.FC = () => {
  const { projects, tasks } = useDashboard();
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<ProjectCategory | 'all'>('all');
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isImportGithubOpen, setIsImportGithubOpen] = useState(false);

  const filteredProjects = projects.filter((p) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && (p.projectType || 'team') !== categoryFilter) return false;
    return true;
  });

  const teamProjectsCount = projects.filter((p) => (p.projectType || 'team') === 'team').length;
  const individualProjectsCount = projects.filter((p) => p.projectType === 'individual').length;
  const onTrackCount = projects.filter((p) => p.status === 'on_track').length;
  const atRiskCount = projects.filter((p) => p.status === 'at_risk').length;
  const totalTasks = projects.reduce((sum, p) => {
    const projectTasks = tasks.filter(t => t.projectId === p.id || t.projectName?.toLowerCase() === p.name?.toLowerCase());
    return sum + (projectTasks.length > 0 ? projectTasks.length : (p.totalTasks || 0));
  }, 0);
  const completedTasks = projects.reduce((sum, p) => {
    const projectTasks = tasks.filter(t => t.projectId === p.id || t.projectName?.toLowerCase() === p.name?.toLowerCase());
    return sum + (projectTasks.length > 0 ? projectTasks.filter(t => t.status === 'done').length : (p.completedTasks || 0));
  }, 0);
  const overallAvg = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner / Summary */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-brand-900/40 via-slate-900 to-slate-900 border border-brand-500/20 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-500/20 text-brand-400 border border-brand-500/30">
              Active Repositories & Services
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">Engineering Projects & Service Mesh</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Real-time telemetry and sprint progress aggregated across team and individual projects.
          </p>
        </div>

        {/* Quick KPI stats */}
        <div className="flex items-center gap-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <div className="text-center px-2">
            <span className="text-xs text-slate-400 block">Overall Shipped</span>
            <span className="text-lg font-bold font-mono text-emerald-400">{overallAvg}%</span>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="text-center px-2">
            <span className="text-xs text-slate-400 block">On Track</span>
            <span className="text-lg font-bold font-mono text-slate-200">{onTrackCount}/{projects.length}</span>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div className="text-center px-2">
            <span className="text-xs text-slate-400 block">Team / Solo</span>
            <span className="text-lg font-bold font-mono text-brand-400">{teamProjectsCount} / {individualProjectsCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                categoryFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All Types ({projects.length})
            </button>
            <button
              onClick={() => setCategoryFilter('team')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                categoryFilter === 'team'
                  ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              👥 Team ({teamProjectsCount})
            </button>
            <button
              onClick={() => setCategoryFilter('individual')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                categoryFilter === 'individual'
                  ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              👤 Individual ({individualProjectsCount})
            </button>
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Status: All
            </button>
            <button
              onClick={() => setStatusFilter('on_track')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === 'on_track'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              On Track ({onTrackCount})
            </button>
            <button
              onClick={() => setStatusFilter('at_risk')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                statusFilter === 'at_risk'
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              At Risk ({atRiskCount})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<FolderGit2 className="w-4 h-4 text-brand-500" />}
            onClick={() => setIsImportGithubOpen(true)}
            className="border-brand-500/30 hover:bg-brand-500/10 text-brand-600 dark:text-brand-400"
          >
            Import GitHub Repo
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<FolderPlus className="w-4 h-4" />}
            onClick={() => setIsProjectModalOpen(true)}
            className="shadow-brand-500/20 shadow-md"
          >
            New Project
          </Button>
        </div>
      </div>

      {/* Grid of Projects or Empty State */}
      {filteredProjects.length === 0 ? (
        <div className="p-12 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mb-4">
            <FolderGit2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">No Projects Found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1.5 mb-6">
            All mock data has been cleared. Start with genuine telemetry by importing a live GitHub repository or creating a custom project workspace.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="primary"
              size="md"
              icon={<FolderGit2 className="w-4 h-4" />}
              onClick={() => setIsImportGithubOpen(true)}
              className="shadow-brand-500/20 shadow-md"
            >
              Import Real GitHub Repo
            </Button>
            <Button
              variant="outline"
              size="md"
              icon={<FolderPlus className="w-4 h-4" />}
              onClick={() => setIsProjectModalOpen(true)}
            >
              Create New Project
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
      />

      {/* Import GitHub Repo Modal */}
      <ImportGithubRepoModal
        isOpen={isImportGithubOpen}
        onClose={() => setIsImportGithubOpen(false)}
      />
    </div>
  );
};
