import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { TaskStatus } from '../../types';
import { TaskCard } from './TaskCard';
import { EmptyState } from '../ui/EmptyState';
import { 
  Plus, 
  CircleDot, 
  PlayCircle, 
  Sparkles, 
  CheckCircle2 
} from 'lucide-react';

interface ColumnConfig {
  id: TaskStatus;
  title: string;
  icon: any;
  colorClass: string;
  badgeBg: string;
}

export const TaskKanban: React.FC = () => {
  const { tasks, filteredTasks, openCreateModal, resetFilters, updateTaskStatus } = useDashboard();
  const [activeDropCol, setActiveDropCol] = useState<TaskStatus | null>(null);

  const columns: ColumnConfig[] = [
    {
      id: 'backlog',
      title: 'Backlog',
      icon: CircleDot,
      colorClass: 'text-slate-400',
      badgeBg: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      icon: PlayCircle,
      colorClass: 'text-blue-400',
      badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    },
    {
      id: 'in_review',
      title: 'In Review',
      icon: Sparkles,
      colorClass: 'text-purple-400',
      badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    },
    {
      id: 'done',
      title: 'Completed',
      icon: CheckCircle2,
      colorClass: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    }
  ];

  if (tasks.length === 0) {
    return (
      <EmptyState
        title="No work tasks yet"
        description="All mock tasks have been removed. Tasks are populated directly from real project deliverables or imported GitHub repository issues."
        showReset={false}
        actionLabel="Create Real Task"
        onAction={openCreateModal}
      />
    );
  }

  if (filteredTasks.length === 0) {
    return (
      <EmptyState
        title="No tasks match active criteria"
        description="Try adjusting your keywords, priority pills, or project selections to see relevant work items."
        showReset={true}
        onReset={resetFilters}
        actionLabel="Create New Task"
        onAction={openCreateModal}
      />
    );
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (colId: TaskStatus) => {
    setActiveDropCol(colId);
  };

  const handleDragLeave = (e: React.DragEvent, colId: TaskStatus) => {
    // Only leave if not hovering child elements of this column
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      if (activeDropCol === colId) {
        setActiveDropCol(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent, colId: TaskStatus) => {
    e.preventDefault();
    setActiveDropCol(null);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      updateTaskStatus(taskId, colId);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start animate-fade-in">
      {columns.map((column) => {
        const columnTasks = filteredTasks.filter((t) => t.status === column.id);
        const Icon = column.icon;
        const totalPoints = columnTasks.reduce((sum, t) => sum + t.storyPoints, 0);
        const isTarget = activeDropCol === column.id;

        return (
          <div
            key={column.id}
            onDragOver={handleDragOver}
            onDragEnter={() => handleDragEnter(column.id)}
            onDragLeave={(e) => handleDragLeave(e, column.id)}
            onDrop={(e) => handleDrop(e, column.id)}
            className={`flex flex-col rounded-2xl border p-3 min-h-[500px] transition-all duration-200 ${
              isTarget
                ? 'bg-brand-500/10 dark:bg-brand-500/10 border-brand-500 ring-2 ring-brand-500/40 shadow-lg scale-[1.01]'
                : 'bg-slate-100/70 dark:bg-slate-900/50 border-slate-200/80 dark:border-slate-800/80'
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${column.colorClass}`} />
                <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {column.title}
                </h4>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${column.badgeBg}`}>
                  {columnTasks.length}
                </span>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                <span>{totalPoints} pts</span>
              </div>
            </div>

            {/* Task Cards Container */}
            <div className="space-y-3 flex-1 overflow-y-auto">
              {columnTasks.length > 0 ? (
                columnTasks.map((task) => <TaskCard key={task.id} task={task} />)
              ) : (
                <div className="h-32 flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs text-center p-3">
                  <span>No tasks in this lane</span>
                  <button
                    onClick={openCreateModal}
                    className="mt-2 text-brand-500 hover:text-brand-400 text-[11px] font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add item
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
