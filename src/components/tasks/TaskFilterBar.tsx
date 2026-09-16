import React from 'react';
import { 
  Search, 
  Filter, 
  RotateCcw, 
  ArrowUpDown, 
  SlidersHorizontal,
  X,
  Check,
  Tag,
  Zap,
  Flame,
  Clock,
  Sparkles
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { TaskPriority, TaskStatus } from '../../types';

export const TaskFilterBar: React.FC = () => {
  const { filters, updateFilter, resetFilters, projects, tasks, user, teamMembers } = useDashboard();

  // Quick filter counts
  const currentUserId = user?.id || 'usr_1';
  const myTasksCount = tasks.filter(t => 
    t.assignee?.id === currentUserId || 
    (user?.email && t.assignee?.email === user.email) || 
    (user?.username && t.assignee?.username === user.username)
  ).length;
  const urgentCount = tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;

  const isAssignedToMe = filters.assigneeId === currentUserId || 
    (user?.email && filters.assigneeId === user.email) || 
    (user?.username && filters.assigneeId === user.username);
  const isUrgentOnly = filters.priority === 'urgent';
  const isInProgressOnly = filters.status === 'in_progress';

  // Check if any filter is actively applied beyond defaults
  const hasActiveFilters = 
    filters.search !== '' ||
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.projectId !== 'all' ||
    filters.assigneeId !== 'all';

  return (
    <div className="space-y-3 bg-white dark:bg-slate-900/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
      {/* Quick Filter Chips Row */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
          Quick Filters:
        </span>

        <button
          onClick={() => updateFilter('assigneeId', isAssignedToMe ? 'all' : currentUserId)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            isAssignedToMe
              ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/25 ring-1 ring-brand-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Zap className="w-3 h-3 text-amber-400" />
          <span>Assigned to Me</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${
            isAssignedToMe ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
          }`}>
            {myTasksCount}
          </span>
        </button>

        <button
          onClick={() => updateFilter('priority', isUrgentOnly ? 'all' : 'urgent')}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            isUrgentOnly
              ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/25 ring-1 ring-rose-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Flame className="w-3 h-3 text-rose-400" />
          <span>Urgent Only</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${
            isUrgentOnly ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
          }`}>
            {urgentCount}
          </span>
        </button>

        <button
          onClick={() => updateFilter('status', isInProgressOnly ? 'all' : 'in_progress')}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
            isInProgressOnly
              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 ring-1 ring-blue-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Clock className="w-3 h-3 text-blue-400" />
          <span>In Progress</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold ${
            isInProgressOnly ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
          }`}>
            {inProgressCount}
          </span>
        </button>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="ml-auto inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Primary Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status Dropdown */}
        <div className="flex items-center gap-1.5 min-w-[130px]">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Status:</label>
          <select
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value as TaskStatus | 'all')}
            className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="all">All Statuses</option>
            <option value="backlog">Backlog</option>
            <option value="in_progress">In Progress</option>
            <option value="in_review">In Review</option>
            <option value="done">Completed</option>
          </select>
        </div>

        {/* Priority Dropdown */}
        <div className="flex items-center gap-1.5 min-w-[130px]">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Priority:</label>
          <select
            value={filters.priority}
            onChange={(e) => updateFilter('priority', e.target.value as TaskPriority | 'all')}
            className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Project Dropdown */}
        <div className="flex items-center gap-1.5 min-w-[150px]">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Project:</label>
          <select
            value={filters.projectId}
            onChange={(e) => updateFilter('projectId', e.target.value)}
            className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Assignee Dropdown */}
        <div className="flex items-center gap-1.5 min-w-[140px]">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Assignee:</label>
          <select
            value={filters.assigneeId}
            onChange={(e) => updateFilter('assigneeId', e.target.value)}
            className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="all">All Team Members</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-1.5 ml-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Sort:</label>
          <select
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value as any)}
            className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="priority">Priority</option>
            <option value="dueDate">Due Date</option>
            <option value="points">Story Points</option>
            <option value="recent">Recently Updated</option>
          </select>

          <button
            onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
            className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-300"
            title={`Order: ${filters.sortOrder.toUpperCase()}`}
          >
            {filters.sortOrder === 'asc' ? '↑ ASC' : '↓ DESC'}
          </button>
        </div>
      </div>

      {/* Active Filter Chips & Reset */}
      {hasActiveFilters && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px]">Active Filters:</span>

          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-400 border border-brand-500/20 text-[11px]">
              Search: "{filters.search}"
              <button onClick={() => updateFilter('search', '')} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.status !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-400 border border-brand-500/20 text-[11px]">
              Status: {filters.status.replace('_', ' ')}
              <button onClick={() => updateFilter('status', 'all')} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.priority !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-400 border border-brand-500/20 text-[11px]">
              Priority: {filters.priority}
              <button onClick={() => updateFilter('priority', 'all')} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.projectId !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-400 border border-brand-500/20 text-[11px]">
              Project: {projects.find(p => p.id === filters.projectId)?.name || filters.projectId}
              <button onClick={() => updateFilter('projectId', 'all')} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.assigneeId !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-400 border border-brand-500/20 text-[11px]">
              Assignee: {teamMembers.find(m => m.id === filters.assigneeId)?.name || filters.assigneeId}
              <button onClick={() => updateFilter('assigneeId', 'all')} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            onClick={resetFilters}
            className="ml-auto flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All</span>
          </button>
        </div>
      )}
    </div>
  );
};
