import React, { useState } from 'react';
import { Task, TaskStatus } from '../../types';
import { Badge } from '../ui/Badge';
import { useDashboard } from '../../context/DashboardContext';
import { 
  Calendar, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  GripVertical,
  Github,
  UserCheck
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const { updateTaskStatus, deleteTask, openEditModal, teamMembers, projects } = useDashboard();
  const [showMenu, setShowMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const isSameUser = (u1?: any, u2?: any) => {
    if (!u1 || !u2) return false;
    if (u1.id && u2.id && u1.id === u2.id) return true;
    if (u1.username && u2.username && u1.username.toLowerCase() === u2.username.toLowerCase()) return true;
    if (u1.name && u2.name && u1.name.toLowerCase() === u2.name.toLowerCase()) return true;
    return false;
  };

  let displayAssigner = task.assigner && !isSameUser(task.assigner, task.assignee) ? task.assigner : undefined;
  if (!displayAssigner) {
    const project = projects.find(p => p.id === task.projectId);
    if (project && project.lead && !isSameUser(project.lead, task.assignee)) {
      displayAssigner = project.lead;
    } else {
      displayAssigner = teamMembers.find(m => !isSameUser(m, task.assignee)) || undefined;
    }
  }

  const statusOptions: { id: TaskStatus; label: string }[] = [
    { id: 'backlog', label: 'Move to Backlog' },
    { id: 'in_progress', label: 'Move to In Progress' },
    { id: 'in_review', label: 'Move to In Review' },
    { id: 'done', label: 'Mark as Completed' },
  ];

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div 
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`p-4 rounded-xl bg-white dark:bg-slate-900 border transition-all duration-200 group relative select-none cursor-grab active:cursor-grabbing ${
        isDragging 
          ? 'opacity-40 border-brand-500 scale-95 shadow-lg' 
          : 'border-slate-200 dark:border-slate-800/80 hover:border-brand-500/50 dark:hover:border-brand-500/50 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Top Header: Drag handle, Key, Priority, and Menu */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <GripVertical className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-slate-400 dark:group-hover:text-slate-400 shrink-0" />
          <span className="text-[11px] font-mono font-semibold text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">
            {task.key}
          </span>
          <Badge priority={task.priority} />
        </div>

        {/* Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {showMenu && (
            <div 
              className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-1.5 animate-slide-down"
              onMouseLeave={() => setShowMenu(false)}
            >
              <button
                onClick={() => {
                  openEditModal(task);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <Edit3 className="w-3.5 h-3.5 text-brand-500" />
                <span>Edit Details</span>
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

              <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase">
                Change Pipeline
              </div>
              {statusOptions
                .filter((s) => s.id !== task.status)
                .map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      updateTaskStatus(task.id, opt.id);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left"
                  >
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span>{opt.label}</span>
                  </button>
                ))}

              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

              <button
                onClick={() => {
                  deleteTask(task.id);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-rose-500 hover:bg-rose-500/10 rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Task</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 mb-1.5 group-hover:text-brand-500 transition-colors">
        {task.title}
      </h4>

      {/* Description */}
      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
        {task.description}
      </p>

      {/* Tags & Assigner Tag */}
      <div className="flex flex-wrap gap-1 mb-3">
        {displayAssigner && (
          <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/20 flex items-center gap-1">
            <UserCheck className="w-2.5 h-2.5" />
            Assigned by {displayAssigner.name ? displayAssigner.name.split(' ')[0] : displayAssigner.username}
          </span>
        )}
        {task.tags.slice(0, displayAssigner ? 2 : 3).map((tag, idx) => (
          <span
            key={idx}
            className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Footer: Story Points, Due Date, Assignee */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {task.storyPoints} pts
          </span>
          <div className="flex items-center gap-1 text-slate-400 text-[10px] font-mono">
            <Calendar className="w-3 h-3" />
            <span>{task.dueDate}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="relative">
            <img
              src={task.assignee.avatar}
              alt={task.assignee.name}
              className="w-5 h-5 rounded-full object-cover ring-1 ring-brand-500/30"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-900" />
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 max-w-[60px] truncate">
            {task.assignee.name.split(' ')[0]}
          </span>
          {task.assignee.githubUsername && (
            <a
              href={task.assignee.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title={`@${task.assignee.githubUsername} on GitHub`}
              className="inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-400 hover:text-brand-400 transition-colors"
            >
              <Github className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
