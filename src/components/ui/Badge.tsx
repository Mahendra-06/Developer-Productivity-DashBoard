import React from 'react';
import { TaskPriority, TaskStatus, ProjectStatus } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'status' | 'priority' | 'projectStatus' | 'outline' | 'neutral';
  status?: TaskStatus;
  priority?: TaskPriority;
  projectStatus?: ProjectStatus;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  status,
  priority,
  projectStatus,
  className = '',
  dot = false
}) => {
  let styleClasses = 'bg-slate-800/80 text-slate-300 border-slate-700/60';
  let dotColor = 'bg-slate-400';
  let label = children;

  if (variant === 'status' || status) {
    switch (status) {
      case 'backlog':
        styleClasses = 'bg-slate-800/90 text-slate-300 border-slate-700';
        dotColor = 'bg-slate-400';
        label = label || 'Backlog';
        break;
      case 'in_progress':
        styleClasses = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
        dotColor = 'bg-blue-400';
        label = label || 'In Progress';
        break;
      case 'in_review':
        styleClasses = 'bg-purple-500/10 text-purple-400 border-purple-500/30';
        dotColor = 'bg-purple-400';
        label = label || 'In Review';
        break;
      case 'done':
        styleClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
        dotColor = 'bg-emerald-400';
        label = label || 'Completed';
        break;
    }
  } else if (variant === 'priority' || priority) {
    switch (priority) {
      case 'urgent':
        styleClasses = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
        dotColor = 'bg-rose-500 animate-ping';
        label = label || 'Urgent';
        break;
      case 'high':
        styleClasses = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
        dotColor = 'bg-amber-400';
        label = label || 'High';
        break;
      case 'medium':
        styleClasses = 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
        dotColor = 'bg-cyan-400';
        label = label || 'Medium';
        break;
      case 'low':
        styleClasses = 'bg-slate-500/15 text-slate-400 border-slate-500/30';
        dotColor = 'bg-slate-400';
        label = label || 'Low';
        break;
    }
  } else if (variant === 'projectStatus' || projectStatus) {
    switch (projectStatus) {
      case 'on_track':
        styleClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
        dotColor = 'bg-emerald-400';
        label = label || 'On Track';
        break;
      case 'at_risk':
        styleClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
        dotColor = 'bg-amber-400';
        label = label || 'At Risk';
        break;
      case 'delayed':
        styleClasses = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
        dotColor = 'bg-rose-500';
        label = label || 'Delayed';
        break;
    }
  } else if (variant === 'neutral') {
    styleClasses = 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
    dotColor = 'bg-slate-400';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${styleClasses} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />}
      {label}
    </span>
  );
};
