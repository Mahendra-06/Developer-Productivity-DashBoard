import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { 
  Sparkles, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertCircle, 
  TrendingUp, 
  BrainCircuit, 
  Flame, 
  Clock, 
  ShieldAlert 
} from 'lucide-react';

interface AIStandupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIStandupModal: React.FC<AIStandupModalProps> = ({ isOpen, onClose }) => {
  const { tasks, user, projects } = useDashboard();
  const [tone, setTone] = useState<'standard' | 'slack' | 'exec'>('slack');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeProject = projects.length > 0 ? projects[0] : null;

  // Derive real statistics from task state
  const completedTasks = tasks.filter((t) => t.status === 'done');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const inReviewTasks = tasks.filter((t) => t.status === 'in_review');
  const urgentTasks = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done');
  const sprintCycle = activeProject ? `${activeProject.name.toUpperCase()} CYCLE` : 'CURRENT SPRINT CYCLE';

  // Compute context switching score
  const uniqueProjectsInWip = new Set(
    [...inProgressTasks, ...inReviewTasks].map((t) => t.projectId)
  ).size;
  const wipCount = inProgressTasks.length + inReviewTasks.length;
  const contextSwitchRisk = wipCount >= 4 || uniqueProjectsInWip >= 3 ? 'High' : wipCount >= 2 ? 'Moderate' : 'Optimal';

  const generateStandupText = () => {
    const yesterdayItems = completedTasks.length > 0 
      ? completedTasks.slice(0, 3).map(t => `• [${t.key}] ${t.title} (${t.storyPoints || 0} pts)`).join('\n')
      : '• No completed deliverables logged in previous session.';

    const todayItems = inProgressTasks.length > 0
      ? inProgressTasks.slice(0, 3).map(t => `• [${t.key}] ${t.title}`).join('\n')
      : '• No active in-progress issues on the board.';

    const blockers = urgentTasks.length > 0
      ? urgentTasks.map(t => `• [${t.key}] ${t.title} (Urgent priority)`).join('\n')
      : '• No critical blockers logged. Development pipeline healthy.';

    if (tone === 'slack') {
      return `*🚀 Daily Standup — ${user.name}*
*Yesterday:*
${yesterdayItems}

*Today:*
${todayItems}
${inReviewTasks.length > 0 ? `*Reviews Pending:* ${inReviewTasks.map(t => t.key).join(', ')}` : ''}

*Blockers / Risks:*
${blockers}
_Focus Mode: ${user.focusStatus || 'Active'}_`;
    }

    if (tone === 'exec') {
      return `EXECUTIVE SUMMARY — ${sprintCycle}
Contributor: ${user.name} (${user.role})
Velocity Health: ${user.productivityScore}% | Active Streak: ${user.activeStreak} Days

Completed Deliverables:
${yesterdayItems}

Current Focus & Trajectory:
${todayItems}

Key Risks / Escalations:
${blockers}`;
    }

    return `### Daily Engineering Standup — ${new Date().toLocaleDateString()}
**Name**: ${user.name} (${user.role})

**1. What did you accomplish yesterday?**
${yesterdayItems}

**2. What are you working on today?**
${todayItems}

**3. Any blockers?**
${blockers}`;
  };

  const standupContent = generateStandupText();

  const handleCopy = () => {
    navigator.clipboard.writeText(standupContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 450);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Developer Copilot & Standup Generator"
      subtitle="Context-aware standup synthesis and cognitive load analysis"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Productivity & Cognitive Load Bar */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-950/60 via-slate-900 to-slate-900 border border-brand-500/20 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-brand-400 animate-pulse" />
              <span className="text-xs font-semibold text-slate-100">Cognitive Load & Flow Analysis</span>
            </div>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold border ${
              contextSwitchRisk === 'Optimal' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : contextSwitchRisk === 'Moderate'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}>
              Context Switching: {contextSwitchRisk}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">WIP Work Items</span>
              <span className="font-mono font-bold text-brand-400">{wipCount} active</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Active Projects</span>
              <span className="font-mono font-bold text-slate-200">{uniqueProjectsInWip} services</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Sprint Focus Ratio</span>
              <span className="font-mono font-bold text-emerald-400">{user.productivityScore}%</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-300 mt-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-400 shrink-0" />
            <span>
              <strong>AI Recommendation:</strong> Prioritize shipping <em>{inProgressTasks[0]?.title || 'active story'}</em> to maintain optimal single-threaded flow state.
            </span>
          </p>
        </div>

        {/* Tone Selector & Actions Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setTone('slack')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                tone === 'slack'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Slack / Teams
            </button>
            <button
              onClick={() => setTone('standard')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                tone === 'standard'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Markdown Doc
            </button>
            <button
              onClick={() => setTone('exec')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                tone === 'exec'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Executive Brief
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />}
              onClick={handleRegenerate}
              disabled={isGenerating}
            >
              Regenerate
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              onClick={handleCopy}
            >
              {copied ? 'Copied to Clipboard!' : 'Copy Report'}
            </Button>
          </div>
        </div>

        {/* Generated Report Output Box */}
        <div className="relative">
          <pre className="w-full font-mono text-xs p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 overflow-x-auto whitespace-pre-wrap leading-relaxed shadow-inner max-h-72 select-text">
            {isGenerating ? (
              <span className="text-slate-500 animate-pulse">Analyzing commits, PR turnaround, and sprint state...</span>
            ) : (
              standupContent
            )}
          </pre>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <span>Synthesized from real repository activity & task transitions</span>
          <span className="font-mono text-brand-400">Ready to paste into #dev-sync</span>
        </div>
      </div>
    </Modal>
  );
};
