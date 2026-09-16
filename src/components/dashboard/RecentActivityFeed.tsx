import React from 'react';
import { GitPullRequest, GitCommit, CheckCircle2, Flame, History, Activity, ExternalLink } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

export const RecentActivityFeed: React.FC = () => {
  const { 
    auditEvents, 
    tasks, 
    prs, 
    deployments, 
    openTaskDetails, 
    openPRInspector, 
    openDeploymentDetails 
  } = useDashboard();

  const handleAuditClick = (act: any) => {
    // 1. Try matching task
    const matchingTask = tasks.find(t => 
      t.id === act.entityId || 
      t.key === act.target || 
      (act.target && act.target.includes(t.key)) ||
      t.title === act.target
    );
    if (matchingTask) {
      openTaskDetails(matchingTask);
      return;
    }

    // 2. Try matching PR
    const matchingPR = prs.find(p => 
      p.id === act.entityId || 
      `#${p.number}` === act.target || 
      (act.target && act.target.includes(`#${p.number}`)) ||
      p.title === act.target
    );
    if (matchingPR) {
      openPRInspector(matchingPR);
      return;
    }

    // 3. Try matching Deployment
    const matchingDep = deployments.find(d => 
      d.id === act.entityId || 
      (act.target && act.target.toLowerCase().includes(d.environment)) ||
      (act.target && act.target.includes(d.serviceName))
    );
    if (matchingDep) {
      openDeploymentDetails(matchingDep);
      return;
    }

    // Fallback: If no direct match, route based on action/target hints
    if (act.action?.toLowerCase().includes('pr') || act.action?.toLowerCase().includes('pull request') || act.target?.includes('#')) {
      if (prs.length > 0) openPRInspector(prs[0]);
    } else if (act.action?.toLowerCase().includes('deploy') || act.target?.toLowerCase().includes('prod') || act.target?.toLowerCase().includes('staging')) {
      if (deployments.length > 0) openDeploymentDetails(deployments[0]);
    } else if (tasks.length > 0) {
      openTaskDetails(tasks[0]);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Live Engineering Stream</h3>
        <span className="text-[11px] text-slate-400 font-mono">Real-time webhooks</span>
      </div>

      {auditEvents.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center text-center">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
            <Activity className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No live activity logged</p>
          <p className="text-[11px] text-slate-400 max-w-xs mt-1">
            Task completions, Git commits, and pull request reviews will stream here in real time.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {auditEvents.slice(0, 5).map((act: any) => (
            <div
              key={act.id}
              onClick={() => handleAuditClick(act)}
              className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-800/60 hover:border-brand-500/40 transition-all cursor-pointer group"
              title="Click to deep-link into details"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-brand-500/10 text-brand-500 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                <History className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-brand-500 transition-colors">
                    {act.actor?.name || 'System'}: {act.action}
                  </p>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono shrink-0 flex items-center gap-1">
                    {act.relativeTime || 'Just now'}
                    <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-brand-500 transition-all" />
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">{act.target}</span>
                  {act.metadata && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300 font-mono">
                      {act.metadata}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

