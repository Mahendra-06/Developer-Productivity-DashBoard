import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { TaskStatus } from '../../types';
import { 
  Calendar, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  UserCheck 
} from 'lucide-react';

export const TaskListView: React.FC = () => {
  const { filteredTasks, updateTaskStatus, deleteTask, openEditModal, resetFilters, openCreateModal, teamMembers, projects } = useDashboard();

  const isSameUser = (u1?: any, u2?: any) => {
    if (!u1 || !u2) return false;
    if (u1.id && u2.id && u1.id === u2.id) return true;
    if (u1.username && u2.username && u1.username.toLowerCase() === u2.username.toLowerCase()) return true;
    if (u1.name && u2.name && u1.name.toLowerCase() === u2.name.toLowerCase()) return true;
    return false;
  };

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

  return (
    <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800/80 overflow-hidden shadow-sm animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-3.5 px-4">Key</th>
              <th className="py-3.5 px-4 min-w-[240px]">Task Summary</th>
              <th className="py-3.5 px-4">Project</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Priority</th>
              <th className="py-3.5 px-4 text-center">Points</th>
              <th className="py-3.5 px-4">Due Date</th>
              <th className="py-3.5 px-4">Assignee</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredTasks.map((task) => {
              let displayAssigner = task.assigner && !isSameUser(task.assigner, task.assignee) ? task.assigner : undefined;
              if (!displayAssigner) {
                const project = projects.find(p => p.id === task.projectId);
                if (project && project.lead && !isSameUser(project.lead, task.assignee)) {
                  displayAssigner = project.lead;
                } else {
                  displayAssigner = teamMembers.find(m => !isSameUser(m, task.assignee)) || {
                    id: 'usr_1',
                    name: 'Alex Chen',
                    username: 'alexchen-dev',
                    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                    role: 'Staff Platform Engineer'
                  };
                }
              }

              return (
                <tr
                  key={task.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Key */}
                  <td className="py-3 px-4 font-mono font-semibold text-brand-600 dark:text-brand-400 whitespace-nowrap">
                    {task.key}
                  </td>

                  {/* Summary */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-brand-500 transition-colors">
                        {task.title}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-sm mt-0.5">
                        {task.description}
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1.5 items-center">
                        {displayAssigner && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/20 flex items-center gap-0.5">
                            <UserCheck className="w-2.5 h-2.5" />
                            Assigned by {displayAssigner.name || displayAssigner.username}
                          </span>
                        )}
                        {task.tags.map((t, idx) => (
                          <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </td>

                  {/* Project */}
                  <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {task.projectName}
                  </td>

                  {/* Status Dropdown selector */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <select
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                      className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                    >
                      <option value="backlog">Backlog</option>
                      <option value="in_progress">In Progress</option>
                      <option value="in_review">In Review</option>
                      <option value="done">Completed</option>
                    </select>
                  </td>

                  {/* Priority */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <Badge priority={task.priority} />
                  </td>

                  {/* Story Points */}
                  <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">
                    {task.storyPoints}
                  </td>

                  {/* Due Date */}
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono whitespace-nowrap">
                    {task.dueDate}
                  </td>

                  {/* Assignee */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <img
                          src={task.assignee.avatar}
                          alt={task.assignee.name}
                          className="w-5 h-5 rounded-full object-cover ring-1 ring-brand-500/30"
                        />
                        <span className="text-slate-700 dark:text-slate-300 text-xs font-medium">
                          {task.assignee.name}
                        </span>
                      </div>
                      {displayAssigner && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">
                          via {displayAssigner.name || displayAssigner.username}
                        </span>
                      )}
                    </div>
                  </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => openEditModal(task)}
                      className="p-1 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-brand-500/10 transition-colors"
                      title="Edit Task"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
