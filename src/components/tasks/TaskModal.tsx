import React, { useState, useEffect } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { TaskPriority, TaskStatus } from '../../types';
import { Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AVAILABLE_TAGS = ['Backend', 'Frontend', 'DevOps', 'Security', 'Database', 'Redis', 'Kubernetes', 'WebSockets', 'API', 'UI/UX', 'Performance', 'Testing'];

export const TaskModal: React.FC = () => {
  const { isTaskModalOpen, closeTaskModal, editingTask, preselectedAssigneeId, addTask, updateTask, projects, teamMembers, user } = useDashboard();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id || 'proj_1');
  const [status, setStatus] = useState<TaskStatus>('backlog');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assigneeId, setAssigneeId] = useState(preselectedAssigneeId || user?.id || teamMembers[0]?.id || 'usr_1');
  const [storyPoints, setStoryPoints] = useState(3);
  const [dueDate, setDueDate] = useState('2026-09-18');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Backend']);
  const [customTagInput, setCustomTagInput] = useState('');
  const [error, setError] = useState('');

  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const handleAiBreakdown = async () => {
    if (!title.trim()) {
      setError('Please provide a task title first so AI can analyze it.');
      return;
    }
    setIsGeneratingAi(true);
    setError('');
    try {
      const result = await api.aiTaskBreakdown(title, description);
      if (result) {
        if (result.refinedTitle && result.refinedTitle !== title) {
          setTitle(result.refinedTitle);
        }
        let enhancedDesc = result.refinedDescription || description;
        if (result.subtasks && result.subtasks.length > 0) {
          enhancedDesc += '\n\n**Subtasks & Architecture Steps:**\n' + result.subtasks.map(s => `- [ ] ${s}`).join('\n');
        }
        if (result.acceptanceCriteria && result.acceptanceCriteria.length > 0) {
          enhancedDesc += '\n\n**Acceptance Criteria:**\n' + result.acceptanceCriteria.map(ac => `- ${ac}`).join('\n');
        }
        setDescription(enhancedDesc.trim());
        if (result.storyPoints) {
          setStoryPoints(result.storyPoints);
        }
        if (result.tags && result.tags.length > 0) {
          setSelectedTags(prev => Array.from(new Set([...prev, ...result.tags])));
        }
        toast.ai('AI task breakdown & story points applied', 'OpenAI Intelligence');
      }
    } catch (err: any) {
      setError('AI breakdown request failed. Verify backend service is running.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Populate form when editing an existing task or creating with preselected assignee
  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description);
      setProjectId(editingTask.projectId);
      setStatus(editingTask.status);
      setPriority(editingTask.priority);
      setAssigneeId(editingTask.assignee.id);
      setStoryPoints(editingTask.storyPoints);
      setDueDate(editingTask.dueDate);
      setSelectedTags(editingTask.tags);
    } else {
      // Defaults for new task
      setTitle('');
      setDescription('');
      setProjectId(projects[0]?.id || 'proj_1');
      setStatus('in_progress');
      setPriority('high');
      setAssigneeId(preselectedAssigneeId || user?.id || teamMembers[0]?.id || 'usr_1');
      setStoryPoints(5);
      setDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setSelectedTags(['Backend', 'Performance']);
    }
    setError('');
  }, [editingTask, preselectedAssigneeId, isTaskModalOpen, projects, user]);

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && customTagInput.trim()) {
      e.preventDefault();
      const clean = customTagInput.trim().replace(/^#/, '');
      if (!selectedTags.includes(clean)) {
        setSelectedTags([...selectedTags, clean]);
      }
      setCustomTagInput('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a task summary title.');
      return;
    }

    const selectedProject = projects.find((p) => p.id === projectId) || projects[0];
    const targetAssigneeId = preselectedAssigneeId || assigneeId;
    let selectedAssignee = teamMembers.find((m) => 
      (targetAssigneeId && m.id === targetAssigneeId) || 
      (targetAssigneeId && m.username && m.username.toLowerCase() === targetAssigneeId.toLowerCase()) || 
      (targetAssigneeId && m.email && m.email.toLowerCase() === targetAssigneeId.toLowerCase()) ||
      (targetAssigneeId && m.name && m.name.toLowerCase() === targetAssigneeId.toLowerCase())
    );

    if (!selectedAssignee && preselectedAssigneeId) {
      selectedAssignee = {
        id: preselectedAssigneeId,
        name: preselectedAssigneeId,
        email: `${preselectedAssigneeId}@dmetrics.io`,
        username: preselectedAssigneeId,
        role: 'Software Engineer',
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(preselectedAssigneeId)}`
      };
    }

    if (!selectedAssignee) {
      selectedAssignee = editingTask ? editingTask.assignee : (teamMembers.find(m => m.id === user?.id) || teamMembers[0]);
    }

    if (editingTask) {
      updateTask(editingTask.id, {
        title: title.trim(),
        description: description.trim(),
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        status,
        priority,
        assignee: selectedAssignee,
        storyPoints: Number(storyPoints),
        dueDate,
        tags: selectedTags.length > 0 ? selectedTags : ['Feature']
      });
    } else {
      addTask({
        title: title.trim(),
        description: description.trim() || 'No description provided.',
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        status,
        priority,
        assignee: selectedAssignee,
        storyPoints: Number(storyPoints),
        dueDate,
        tags: selectedTags.length > 0 ? selectedTags : ['Feature']
      });
    }

    closeTaskModal();
  };

  return (
    <Modal
      isOpen={isTaskModalOpen}
      onClose={closeTaskModal}
      title={editingTask ? `Edit Task: ${editingTask.key}` : 'Create Engineering Work Item'}
      subtitle={editingTask ? 'Update task metadata, priority, and pipeline lane.' : 'Add a new feature, bug fix, or architecture story.'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
            {error}
          </div>
        )}

        {/* Task Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Task Summary / Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Implement Redis Bloom filter for cache hit optimization"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Technical Specification / Description
            </label>
            <button
              type="button"
              onClick={handleAiBreakdown}
              disabled={isGeneratingAi || !title.trim()}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              title="Use OpenAI to decompose task, generate subtasks, and estimate story points"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
              {isGeneratingAi ? 'Analyzing with AI...' : '✨ AI Breakdown & Points'}
            </button>
          </div>
          <textarea
            rows={3}
            placeholder="Describe acceptance criteria, API changes, latency benchmarks..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </div>

        {/* Target Project Service */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Target Project Service
          </label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.key})
              </option>
            ))}
          </select>
        </div>

        {/* Row: Status, Priority, Story Points, Due Date */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Pipeline Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="backlog">Backlog</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="done">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Story Points
            </label>
            <input
              type="number"
              min={1}
              max={34}
              value={storyPoints}
              onChange={(e) => setStoryPoints(Number(e.target.value))}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Tags Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Tags & Tech Stack
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2 max-h-20 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60">
            {AVAILABLE_TAGS.map((t) => {
              const isSelected = selectedTags.includes(t);
              return (
                <button
                  type="button"
                  key={t}
                  onClick={() => handleToggleTag(t)}
                  className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition-all ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
                  }`}
                >
                  #{t}
                </button>
              );
            })}
          </div>

          <input
            type="text"
            placeholder="Type custom tag and press Enter..."
            value={customTagInput}
            onChange={(e) => setCustomTagInput(e.target.value)}
            onKeyDown={handleAddCustomTag}
            className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <Button variant="outline" size="sm" type="button" onClick={closeTaskModal}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            {editingTask ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
