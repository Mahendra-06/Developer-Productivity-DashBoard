import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  FolderGit2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Rocket, 
  GitPullRequest, 
  Users, 
  User, 
  ExternalLink, 
  Edit3, 
  Plus, 
  RefreshCw, 
  Calendar, 
  Github, 
  ListTodo, 
  Activity, 
  Layers,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Project, ProjectDetails, Task, PullRequestItem, DeploymentItem } from '../../types';
import { api } from '../../services/api';
import { useDashboard } from '../../context/DashboardContext';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { Button } from '../ui/Button';
import { ProjectModal } from './ProjectModal';

interface ProjectDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
  projectId?: string | null;
}

export const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({
  isOpen,
  onClose,
  project: initialProject,
  projectId: initialProjectId,
}) => {
  const { openCreateModal, openPRInspector, openDeploymentDetails, openTaskDetails } = useDashboard();
  
  const [details, setDetails] = useState<ProjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'prs' | 'deployments' | 'activity'>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  const targetIdentifier = initialProjectId || initialProject?.id || initialProject?.key;

  const fetchDetails = async () => {
    if (!targetIdentifier) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.getProjectDetails(targetIdentifier);
      setDetails(data);
    } catch (err: any) {
      console.warn('Failed to load project details:', err);
      setErrorMessage(err.message || 'Could not load project details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && targetIdentifier) {
      fetchDetails();
    } else {
      setDetails(null);
      setErrorMessage(null);
      setActiveTab('overview');
    }
  }, [isOpen, targetIdentifier]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isEditModalOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, isEditModalOpen]);

  if (!isOpen) return null;

  const currentProject = details?.project || initialProject;
  const metrics = details?.metrics;
  const tasks = details?.tasks || [];
  const pullRequests = details?.pullRequests || [];
  const deployments = details?.deployments || [];
  const recentActivity = details?.recentActivity || [];

  const formattedRepoUrl = currentProject?.repoUrl?.startsWith('http')
    ? currentProject.repoUrl
    : currentProject?.repoUrl
    ? `https://${currentProject.repoUrl}`
    : `https://github.com/dmetrics/${(currentProject?.key || 'project').toLowerCase()}`;

  const isIndividual = currentProject?.projectType === 'individual';

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Centering Wrapper */}
      <div className="min-h-full flex items-center justify-center p-3 sm:p-6 text-center">
        <div 
          className="relative w-full max-w-4xl my-auto max-h-[calc(100vh-3rem)] flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden z-10 text-left animate-slide-down"
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/75 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-mono font-bold text-sm shadow-md shrink-0"
                style={{ backgroundColor: currentProject?.color || '#6366f1' }}
              >
                {currentProject?.key || 'PRJ'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {currentProject?.name || 'Project Details'}
                  </h3>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-brand-500/10 text-brand-500 border border-brand-500/20">
                    {currentProject?.key}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                    isIndividual 
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' 
                      : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  }`}>
                    {isIndividual ? <User className="w-2.5 h-2.5" /> : <Users className="w-2.5 h-2.5" />}
                    <span>{isIndividual ? 'Individual' : 'Team Project'}</span>
                  </span>
                  {currentProject?.status && <Badge projectStatus={currentProject.status} dot />}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                  {currentProject?.description || 'Repository & deliverable workspace'}
                </p>
              </div>
            </div>

            {/* Quick Actions Header Buttons */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              {currentProject && (
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
                  title="Edit Project Details"
                >
                  <Edit3 className="w-3.5 h-3.5 text-brand-500" />
                  <span>Edit</span>
                </button>
              )}

              {formattedRepoUrl && (
                <a
                  href={formattedRepoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
                  title="Open GitHub Repository in a new tab"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Repository</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tab Bar */}
          <div className="flex-shrink-0 px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between overflow-x-auto gap-4">
            <div className="flex items-center gap-2 py-2">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'overview'
                    ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Overview & Metrics</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('tasks')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'tasks'
                    ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <ListTodo className="w-3.5 h-3.5" />
                <span>Tasks</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                  {tasks.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('prs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'prs'
                    ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <GitPullRequest className="w-3.5 h-3.5" />
                <span>Pull Requests</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                  {pullRequests.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('deployments')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'deployments'
                    ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>Deployments</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                  {deployments.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('activity')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeTab === 'activity'
                    ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Activity</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                  {recentActivity.length}
                </span>
              </button>
            </div>

            {/* Create Task Shortcut Button */}
            {currentProject && (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => {
                  openCreateModal(undefined, currentProject.id);
                }}
                className="shrink-0 text-xs py-1"
              >
                Add Task
              </Button>
            )}
          </div>

          {/* Modal Content Body */}
          <div className="overflow-y-auto max-h-[calc(100vh-14rem)] p-6 space-y-6">
            {/* Loading State */}
            {isLoading && (
              <div className="space-y-4 py-8">
                <div className="flex items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <RefreshCw className="w-5 h-5 animate-spin text-brand-500" />
                  <span>Loading live telemetry for {currentProject?.name || 'project'}...</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-pulse">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
                  ))}
                </div>
                <div className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
              </div>
            )}

            {/* Error State */}
            {!isLoading && errorMessage && (
              <div className="p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Failed to load project details</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    {errorMessage}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<RefreshCw className="w-3.5 h-3.5" />}
                  onClick={fetchDetails}
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Main Content when loaded */}
            {!isLoading && !errorMessage && currentProject && (
              <>
                {/* 1. OVERVIEW & METRICS TAB */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Top KPI Metrics Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span>Total Tasks</span>
                          <ListTodo className="w-3.5 h-3.5 text-brand-500" />
                        </div>
                        <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                          {metrics?.totalTasks ?? tasks.length}
                        </div>
                        <span className="text-[11px] text-slate-400">Sprint commitments</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span>Completed</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                        <div className="text-2xl font-bold font-mono text-emerald-500">
                          {metrics?.completedTasks ?? tasks.filter(t => t.status === 'done').length}
                        </div>
                        <span className="text-[11px] text-slate-400">Shipped to production</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span>Open PRs</span>
                          <GitPullRequest className="w-3.5 h-3.5 text-purple-400" />
                        </div>
                        <div className="text-2xl font-bold font-mono text-purple-400">
                          {metrics?.openPullRequests ?? pullRequests.filter(p => !p.isMerged && p.status !== 'merged').length}
                        </div>
                        <span className="text-[11px] text-slate-400">Waiting for review</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span>Deployments</span>
                          <Rocket className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                        <div className="text-2xl font-bold font-mono text-blue-400">
                          {metrics?.deployments ?? deployments.length}
                        </div>
                        <span className="text-[11px] text-slate-400">Releases executed</span>
                      </div>
                    </div>

                    {/* Progress Bar & Status Distribution */}
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-brand-500" />
                            <span>Sprint Completion Progress</span>
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Real-time task velocity and deliverable completion rate
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-bold font-mono text-brand-500">
                            {metrics?.progress ?? currentProject.progress ?? 0}%
                          </span>
                        </div>
                      </div>

                      <ProgressBar 
                        progress={metrics?.progress ?? currentProject.progress ?? 0} 
                        color={currentProject.color || '#6366f1'} 
                        height="h-3"
                      />

                      {/* Tasks by Status distribution pills */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                          <span className="text-slate-500">Backlog</span>
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                            {metrics?.tasksByStatus?.backlog ?? tasks.filter(t => t.status === 'backlog').length}
                          </span>
                        </div>
                        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                          <span className="text-blue-500">In Progress</span>
                          <span className="font-mono font-bold text-blue-500">
                            {metrics?.tasksByStatus?.in_progress ?? tasks.filter(t => t.status === 'in_progress').length}
                          </span>
                        </div>
                        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                          <span className="text-purple-500">In Review</span>
                          <span className="font-mono font-bold text-purple-500">
                            {metrics?.tasksByStatus?.in_review ?? tasks.filter(t => t.status === 'in_review').length}
                          </span>
                        </div>
                        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                          <span className="text-emerald-500">Completed</span>
                          <span className="font-mono font-bold text-emerald-500">
                            {metrics?.tasksByStatus?.done ?? tasks.filter(t => t.status === 'done').length}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Project Specifications & Team Lead Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Description & Metadata */}
                      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                          Project Description & Target
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {currentProject.description}
                        </p>
                        <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Target Deadline</span>
                            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {currentProject.deadline || 'Ongoing'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Repository</span>
                            <a
                              href={formattedRepoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-brand-500 hover:underline flex items-center gap-1 text-[11px] truncate max-w-[200px]"
                            >
                              <Github className="w-3 h-3 shrink-0" />
                              <span className="truncate">{formattedRepoUrl.replace(/^https?:\/\/github\.com\//, '')}</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Lead & Team Members */}
                      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                          Engineering Lead & Roster
                        </h4>
                        
                        {/* Lead Card */}
                        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                          <img
                            src={currentProject.lead?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                            alt={currentProject.lead?.name || 'Lead'}
                            className="w-9 h-9 rounded-xl object-cover ring-2 ring-brand-500/30 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                {currentProject.lead?.name}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-brand-500/10 text-brand-500 font-semibold">
                                Project Lead
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">
                              {currentProject.lead?.role || 'Lead Engineer'} • {currentProject.lead?.email || ''}
                            </p>
                          </div>
                        </div>

                        {/* Team roster */}
                        <div>
                          <span className="text-[11px] text-slate-400 block mb-2">Team Contributors ({currentProject.team?.length || 1})</span>
                          <div className="flex flex-wrap gap-2">
                            {(currentProject.team || [currentProject.lead]).filter(Boolean).map((member) => (
                              <div
                                key={member.id}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-[11px]"
                                title={`${member.name} (${member.role})`}
                              >
                                <img
                                  src={member.avatar}
                                  alt={member.name}
                                  className="w-4 h-4 rounded-full object-cover"
                                />
                                <span className="text-slate-700 dark:text-slate-300 truncate max-w-[100px]">
                                  {member.name.split(' ')[0]}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. TASKS TAB */}
                {activeTab === 'tasks' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Associated Tasks ({tasks.length})
                      </h4>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Plus className="w-3 h-3" />}
                        onClick={() => openCreateModal(undefined, currentProject.id)}
                      >
                        Create Task
                      </Button>
                    </div>

                    {tasks.length === 0 ? (
                      <div className="py-12 text-center space-y-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        <ListTodo className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No tasks in this project</p>
                        <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                          Get started by assigning sprint deliverables to your team.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Plus className="w-3.5 h-3.5" />}
                          onClick={() => openCreateModal(undefined, currentProject.id)}
                        >
                          Create First Task
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {tasks.map((task) => (
                          <div
                            key={task.id}
                            onClick={() => {
                              openTaskDetails(task);
                            }}
                            className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3 cursor-pointer group transition"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-brand-500/10 text-brand-500 border border-brand-500/20 shrink-0">
                                {task.key}
                              </span>
                              <div className="min-w-0">
                                <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-brand-500 transition-colors truncate">
                                  {task.title}
                                </h5>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                  <span>{task.storyPoints} story pts</span>
                                  <span>•</span>
                                  <span>Due: {task.dueDate || 'Sprint active'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {task.assignee && (
                                <img
                                  src={task.assignee.avatar}
                                  alt={task.assignee.name}
                                  title={`Assigned to ${task.assignee.name}`}
                                  className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-300 dark:ring-slate-700"
                                />
                              )}
                              <Badge status={task.status} />
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. PULL REQUESTS TAB */}
                {activeTab === 'prs' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Code Reviews & PR Queue ({pullRequests.length})
                      </h4>
                    </div>

                    {pullRequests.length === 0 ? (
                      <div className="py-12 text-center space-y-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        <GitPullRequest className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No pull requests linked</p>
                        <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                          Pull requests targeting this project repository will automatically display here.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {pullRequests.map((pr: PullRequestItem) => (
                          <div
                            key={pr.id}
                            onClick={() => {
                              openPRInspector(pr);
                            }}
                            className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3 cursor-pointer group transition"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                                #{pr.number || 101}
                              </span>
                              <div className="min-w-0">
                                <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-brand-500 transition-colors truncate">
                                  {pr.title}
                                </h5>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                  <span className="font-mono">{pr.branch}</span>
                                  <span>•</span>
                                  <span>+{pr.additions || 0} / -{pr.deletions || 0}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full font-mono ${
                                pr.status === 'merged' || pr.isMerged
                                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                  : pr.slaStatus === 'breached'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {pr.status === 'merged' || pr.isMerged ? 'Merged' : (pr.slaStatus || 'Healthy')}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. DEPLOYMENTS TAB */}
                {activeTab === 'deployments' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Deployments & Release Pipeline ({deployments.length})
                      </h4>
                    </div>

                    {deployments.length === 0 ? (
                      <div className="py-12 text-center space-y-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        <Rocket className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No deployments found</p>
                        <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                          CI/CD release telemetry triggered for this service will appear here.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {deployments.map((dep: DeploymentItem) => (
                          <div
                            key={dep.id}
                            onClick={() => {
                              openDeploymentDetails(dep);
                            }}
                            className="p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3 cursor-pointer group transition"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                                {dep.environment.toUpperCase()}
                              </span>
                              <div className="min-w-0">
                                <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-brand-500 transition-colors truncate">
                                  {dep.version} — {dep.commitMessage}
                                </h5>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 font-mono">
                                  <span>SHA: {dep.commitSha}</span>
                                  <span>•</span>
                                  <span>{dep.deployedAt || 'Just now'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                dep.status === 'success'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : dep.status === 'failed'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              }`}>
                                {dep.status}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 5. RECENT ACTIVITY TAB */}
                {activeTab === 'activity' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Audit Activity Log ({recentActivity.length})
                      </h4>
                    </div>

                    {recentActivity.length === 0 ? (
                      <div className="py-12 text-center space-y-3 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                        <Activity className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No recent audit logs</p>
                        <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                          Changes to tasks, PRs, and team members will be audited here.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {recentActivity.map((evt: any) => (
                          <div
                            key={evt.id || evt._id}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-start gap-3 text-xs"
                          >
                            <img
                              src={evt.actor?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                              alt=""
                              className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5 ring-1 ring-brand-500/20"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {evt.actor?.name || 'Developer'}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                  {evt.relativeTime || 'Recently'}
                                </span>
                              </div>
                              <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
                                {evt.action} <span className="font-medium text-brand-500">{evt.target}</span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Bar */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
            <div className="text-[11px] font-mono text-slate-400">
              Project ID: <span className="text-slate-600 dark:text-slate-300">{currentProject?.id}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Project Edit Modal */}
      {currentProject && (
        <ProjectModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          project={currentProject}
          onSuccess={(updated) => {
            setDetails(prev => prev ? { ...prev, project: updated } : null);
          }}
        />
      )}
    </div>,
    document.body
  );
};
