import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { GitPullRequest, GitMerge, CheckCircle2, Clock, ShieldCheck, AlertTriangle } from 'lucide-react';

export const PRHealthDistribution: React.FC = () => {
  const { prs, openPRInspector } = useDashboard();

  const totalPRs = prs.length;
  const mergedPRs = prs.filter(p => p.isMerged).length;
  const reviewedPRs = prs.filter(p => p.isReviewed && !p.isMerged).length;
  const pendingPRs = prs.filter(p => !p.isReviewed && !p.isMerged).length;

  const healthyCount = prs.filter(p => p.slaStatus === 'healthy' || p.isMerged).length;
  const atRiskCount = prs.filter(p => p.slaStatus === 'at_risk').length;
  const breachedCount = prs.filter(p => p.slaStatus === 'breached').length;

  const avgTurnaround = prs.length > 0
    ? (prs.reduce((sum, p) => sum + (p.turnaroundHours || p.waitingHours || 2), 0) / prs.length).toFixed(1)
    : '0.0';

  const approvalRate = totalPRs > 0 ? Math.round(((mergedPRs + reviewedPRs) / totalPRs) * 100) : 100;

  if (totalPRs === 0) {
    return (
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between min-h-[360px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <GitPullRequest className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">PR Velocity & SLAs</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Code review queue health and turnaround times</p>
            </div>
          </div>
        </div>

        <div className="py-10 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 mb-3 border border-slate-200 dark:border-slate-700/60 shadow-inner">
            <GitPullRequest className="w-7 h-7 text-emerald-400 opacity-60" />
          </div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">No Pull Requests In Queue</h4>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Pull requests created or imported from GitHub will stream live review velocity and SLA health here.
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Review Health</span>
          <span>100% On Target</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between transition-all">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <GitPullRequest className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">PR Velocity & SLAs</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  {approvalRate}% Velocity
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {pendingPRs} pending reviews • {avgTurnaround}h average turnaround
              </p>
            </div>
          </div>

          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {totalPRs} PRs
          </span>
        </div>

        {/* SLA Status Visualizer Grid */}
        <div className="grid grid-cols-3 gap-3 my-4">
          <div className="p-3 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-center">
            <span className="text-[10px] text-emerald-500 font-medium block">Healthy SLAs</span>
            <span className="text-lg font-bold font-mono text-emerald-400">{healthyCount}</span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-center">
            <span className="text-[10px] text-amber-500 font-medium block">At Risk (&gt;4h)</span>
            <span className="text-lg font-bold font-mono text-amber-400">{atRiskCount}</span>
          </div>
          <div className="p-3 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 text-center">
            <span className="text-[10px] text-rose-500 font-medium block">Breached</span>
            <span className="text-lg font-bold font-mono text-rose-400">{breachedCount}</span>
          </div>
        </div>

        {/* Recent PR Activity List */}
        <div className="space-y-2 my-2">
          {prs.slice(0, 3).map((pr) => (
            <div
              key={pr.id}
              onClick={() => openPRInspector(pr)}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-800/60 transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                  pr.isMerged
                    ? 'bg-purple-500/15 text-purple-400'
                    : pr.isReviewed
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-brand-500/15 text-brand-400'
                }`}>
                  {pr.isMerged ? <GitMerge className="w-3.5 h-3.5" /> : <GitPullRequest className="w-3.5 h-3.5" />}
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-bold text-slate-500">#{pr.number}</span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">{pr.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block truncate">{pr.repo} • {pr.branch}</span>
                </div>
              </div>

              <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                pr.isMerged
                  ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                  : pr.isReviewed
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
              }`}>
                {pr.isMerged ? 'Merged' : pr.isReviewed ? 'Approved' : 'In Review'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Avg Wait: {avgTurnaround}h</span>
        </span>
        <span>{mergedPRs} Merged to Main</span>
      </div>
    </div>
  );
};
