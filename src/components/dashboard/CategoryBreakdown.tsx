import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { PieChart, Clock } from 'lucide-react';

export const CategoryBreakdown: React.FC = () => {
  const { analytics, tasks } = useDashboard();

  if (tasks.length === 0 && (!analytics?.workCategories || analytics.workCategories.length === 0)) {
    return (
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Work Category Distribution</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Architecture & code domain allocation</p>
          </div>
        </div>

        <div className="py-8 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <PieChart className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No Work Categorization</p>
          <p className="text-[11px] text-slate-400 max-w-xs mt-1">
            Work items will be classified into Core Architecture, Distributed Systems, UX, and DevOps as tasks and commits are added.
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Total Logged Hours</span>
          <span className="font-mono text-slate-500">0.0 hrs</span>
        </div>
      </div>
    );
  }

  const categories = React.useMemo(() => {
    if (analytics?.workCategories && analytics.workCategories.length > 0) {
      return analytics.workCategories.map((c: any) => ({
        category: c.name,
        percentage: c.percentage,
        color: c.color,
        hours: c.hours,
      }));
    }

    // Pure dynamic derivation from active tasks
    let corePoints = 0;
    let distPoints = 0;
    let frontPoints = 0;
    let devopsPoints = 0;

    for (const t of tasks) {
      const pts = t.storyPoints || 3;
      const allText = `${t.title} ${t.tags?.join(' ') || ''}`.toLowerCase();
      if (allText.includes('frontend') || allText.includes('ui') || allText.includes('ux') || allText.includes('css')) {
        frontPoints += pts;
      } else if (allText.includes('devops') || allText.includes('ci') || allText.includes('docker') || allText.includes('k8s') || allText.includes('security')) {
        devopsPoints += pts;
      } else if (allText.includes('cache') || allText.includes('stream') || allText.includes('mesh') || allText.includes('kafka') || allText.includes('grpc')) {
        distPoints += pts;
      } else {
        corePoints += pts;
      }
    }

    const totalPts = corePoints + distPoints + frontPoints + devopsPoints;
    const corePct = totalPts > 0 ? Math.round((corePoints / totalPts) * 100) : 0;
    const distPct = totalPts > 0 ? Math.round((distPoints / totalPts) * 100) : 0;
    const frontPct = totalPts > 0 ? Math.round((frontPoints / totalPts) * 100) : 0;
    const devopsPct = totalPts > 0 ? Math.max(0, 100 - (corePct + distPct + frontPct)) : 0;

    const totalCalculatedHours = Number((totalPts * 1.8).toFixed(1));

    return [
      { category: 'Core Architecture', percentage: corePct, color: '#6366f1', hours: Number(((totalCalculatedHours * corePct) / 100).toFixed(1)) },
      { category: 'Distributed Systems', percentage: distPct, color: '#8b5cf6', hours: Number(((totalCalculatedHours * distPct) / 100).toFixed(1)) },
      { category: 'Frontend / UX', percentage: frontPct, color: '#06b6d4', hours: Number(((totalCalculatedHours * frontPct) / 100).toFixed(1)) },
      { category: 'DevOps & CI/CD', percentage: devopsPct, color: '#10b981', hours: Number(((totalCalculatedHours * devopsPct) / 100).toFixed(1)) },
    ];
  }, [analytics, tasks]);

  const totalHours = categories.reduce((sum: number, c: any) => sum + c.hours, 0);

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Work Category Distribution</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{totalHours.toFixed(1)} total focus hours tracked</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded">
            {categories.length > 0 ? `${categories.length} Domains` : 'No Data'}
          </span>
        </div>

        {/* Stacked Percentage Bar */}
        <div className="h-3 w-full rounded-full overflow-hidden flex my-4 bg-slate-100 dark:bg-slate-800 p-0.5">
          {categories.map((cat: any, idx: number) => (
            <div
              key={idx}
              style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
              className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-500"
              title={`${cat.category}: ${cat.hours}h (${cat.percentage}%)`}
            />
          ))}
        </div>

        {/* Categories List */}
        <div className="space-y-3">
          {categories.map((cat: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-slate-700 dark:text-slate-300 font-medium">{cat.category}</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-slate-400">{cat.hours} hrs</span>
                <span className="text-slate-900 dark:text-slate-100 font-semibold">{cat.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 mt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="text-[11px] flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" /> {totalHours > 0 ? 'Active telemetry stream' : 'No focus hours'}
        </span>
        <span className="font-mono text-[11px] text-brand-500">
          {tasks.length > 0 ? `${Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100)}% Tasks Completed` : '0% Shipped'}
        </span>
      </div>
    </div>
  );
};
