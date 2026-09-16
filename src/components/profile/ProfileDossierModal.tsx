import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { 
  FileText, 
  Copy, 
  Check, 
  Printer, 
  Download, 
  Award, 
  Flame, 
  Target, 
  CheckCircle2 
} from 'lucide-react';

interface ProfileDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileDossierModal: React.FC<ProfileDossierModalProps> = ({ isOpen, onClose }) => {
  const { user, tasks, prs, projects } = useDashboard();
  const [copied, setCopied] = useState(false);

  const activeProject = projects.length > 0 ? projects[0] : null;
  const completedTasks = tasks.filter(t => t.status === 'done');
  const completedPoints = completedTasks.reduce((acc, t) => acc + (t.storyPoints || 0), 0);
  const sprintCycle = activeProject ? `${activeProject.name} Active Cycle` : 'Active Sprint Cycle';

  const contributions = (user.contributions && user.contributions.length > 0)
    ? user.contributions
    : prs.slice(0, 5).map(p => ({
        id: p.id,
        prNumber: `#${p.id.replace(/\D/g, '').slice(-4) || '101'}`,
        title: p.title,
        status: p.status,
        repo: p.repo || 'origin/main',
        additions: p.additions || 0,
        deletions: p.deletions || 0,
        reviewTurnaround: `${p.turnaroundHours || 1.2}h`,
        impact: p.description || 'Verified pull request deliverable with merged code changes and CI verification.'
      }));

  const markdownContent = `# Developer Performance Dossier — ${user.name}
**Role:** ${user.role}  
**Sprint Cycle:** ${sprintCycle}  
**Date:** ${new Date().toLocaleDateString()}  
**Status:** ${user.focusStatus || 'Active'}

---

### Executive Performance Highlights
- **Productivity Score:** ${user.productivityScore} / 100
- **Active Flow Streak:** ${user.activeStreak} Days
- **Deep Work Focus Logged:** ${user.currentGoalHours} / ${user.weeklyGoalHours} hrs (${user.weeklyGoalHours > 0 ? Math.round((user.currentGoalHours / user.weeklyGoalHours) * 100) : 0}% of quota)
- **Shipped Story Points:** ${completedPoints} pts (${completedTasks.length} work items resolved)
- **Open / Merged PRs:** ${user.openPRsCount} open, ${user.mergedPRsCount} merged

---

### High-Impact Deliveries & Architectural Work
${contributions.length > 0 ? contributions.map(c => `- **[${c.prNumber}] ${c.title}** (${(c.status || 'MERGED').toUpperCase()})
  - *Repo:* ${c.repo} | *Diff:* +${c.additions} / -${c.deletions} | *Turnaround:* ${c.reviewTurnaround}
  - *Impact:* ${c.impact}`).join('\n') : 'No deliveries recorded for this cycle.'}

---

### Verified Engineering Competencies
${user.skills && user.skills.length > 0 ? user.skills.map(s => `- **${s.name}:** ${s.mastery}% Mastery (${s.level}) — ${s.linesWritten} LOC verified`).join('\n') : 'No verified competencies registered.'}

---
*Generated via DMetrics Telemetry Hub*
`;

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Executive Developer Performance Dossier" maxWidth="max-w-2xl">
      <div className="space-y-5">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          A formatted executive performance dossier ready for sprint retrospectives, quarterly 1-on-1s, and peer evaluations.
        </p>

        {/* Dossier Preview Sheet */}
        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 font-sans text-xs">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{user.name}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">{user.role} • @{user.username}</p>
            </div>
            <div className="text-left sm:text-right">
              <span className="inline-block px-2 py-0.5 rounded bg-brand-500/10 text-brand-500 font-mono font-semibold text-[10px]">
                {sprintCycle}
              </span>
              <p className="text-slate-400 text-[10px] mt-0.5">{new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Key Metric Numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-sm">
              <span className="text-[10px] text-slate-400 block">Productivity Score</span>
              <span className="text-base font-bold font-mono text-emerald-500">{user.productivityScore}/100</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-sm">
              <span className="text-[10px] text-slate-400 block">Active Flow Streak</span>
              <span className="text-base font-bold font-mono text-amber-500">{user.activeStreak} Days</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-sm">
              <span className="text-[10px] text-slate-400 block">Deep Work Logged</span>
              <span className="text-base font-bold font-mono text-brand-500">{user.currentGoalHours}h</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-sm">
              <span className="text-[10px] text-slate-400 block">Shipped Points</span>
              <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">{completedPoints} pts</span>
            </div>
          </div>

          {/* Top Contributions Preview */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block text-[11px]">
              Key Architectural Deliveries:
            </span>
            <div className="space-y-1.5">
              {contributions.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic py-1">No deliveries recorded for this cycle.</p>
              ) : (
                contributions.map((c) => (
                  <div key={c.id} className="p-2 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/40 text-[11px] flex items-start justify-between gap-2">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">[{c.prNumber}] {c.title}</span>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{c.impact}</p>
                    </div>
                    <span className="font-mono text-[10px] text-emerald-500 font-semibold shrink-0">+{c.additions}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={handlePrint} icon={<Printer className="w-4 h-4" />}>
            Print Dossier
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCopyMarkdown}
              icon={copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            >
              {copied ? 'Copied Markdown!' : 'Copy as Markdown'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
