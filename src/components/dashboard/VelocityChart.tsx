import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { TrendingUp } from 'lucide-react';

export const VelocityChart: React.FC = () => {
  const { analytics, tasks } = useDashboard();

  const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const donePoints = tasks.filter(t => t.status === 'done').reduce((sum, t) => sum + (t.storyPoints || 0), 0);

  if (tasks.length === 0 && (!analytics?.sprintVelocity || analytics.sprintVelocity.length === 0)) {
    return (
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Sprint Velocity & Burndown</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Planned vs Completed story points per sprint</p>
          </div>
        </div>

        <div className="py-8 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <TrendingUp className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No Sprint Velocity Data</p>
          <p className="text-[11px] text-slate-400 max-w-xs mt-1">
            Import a GitHub repository or create tasks with story points to automatically calculate sprint capacity and burndown rates.
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Active Sprint Capacity</span>
          <span className="font-mono text-slate-500">0 pts</span>
        </div>
      </div>
    );
  }

  const velocityData = analytics?.sprintVelocity && analytics.sprintVelocity.length > 0
    ? analytics.sprintVelocity.map((v: any, idx: number, arr: any[]) => {
        const isCurrent = idx === arr.length - 1 || v.sprint?.toLowerCase().includes('active');
        return {
          sprint: v.sprint,
          planned: isCurrent && totalPoints > 0 ? Math.max(v.planned ?? 0, totalPoints) : (v.planned ?? v.committed ?? 0),
          completed: isCurrent && donePoints > 0 ? donePoints : (v.completed ?? 0),
        };
      })
    : [
        { sprint: 'Sprint 24 (Active)', planned: totalPoints || 25, completed: donePoints || 18 },
      ];

  const maxPoints = Math.max(10, ...velocityData.map((d: any) => Math.max(d.planned, d.completed)));

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Sprint Velocity & Burndown</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Planned vs Completed story points per sprint</p>
            </div>
          </div>

          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {totalPoints > 0 ? `${Math.round((donePoints / totalPoints) * 100)}% Rate` : 'No Active Points'}
          </span>
        </div>

        {/* Bar Visualizer */}
        <div className="space-y-4 my-4">
          {velocityData.map((item: any, idx: number) => {
            const plannedWidth = (item.planned / maxPoints) * 100;
            const completedWidth = (item.completed / maxPoints) * 100;
            const isExceeded = item.completed >= item.planned;

            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-700 dark:text-slate-300">{item.sprint}</span>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-slate-400">Target: {item.planned}pts</span>
                    <span className={isExceeded ? 'text-emerald-500 font-semibold' : 'text-brand-400 font-semibold'}>
                      Shipped: {item.completed}pts
                    </span>
                  </div>
                </div>

                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 relative flex items-center">
                  {/* Planned target marker */}
                  <div
                    className="absolute top-0 bottom-0 bg-slate-300 dark:bg-slate-700/60 rounded-l-md"
                    style={{ width: `${plannedWidth}%` }}
                  />
                  {/* Shipped actual bar */}
                  <div
                    className={`h-full rounded-md transition-all duration-700 z-10 ${
                      isExceeded
                        ? 'bg-gradient-to-r from-brand-500 to-emerald-400 shadow-sm shadow-emerald-500/20'
                        : 'bg-brand-500'
                    }`}
                    style={{ width: `${completedWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Legend */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-gradient-to-r from-brand-500 to-emerald-400" />
            Completed Velocity
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-300 dark:bg-slate-700" />
            Planned Target
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
          Avg {(velocityData.reduce((sum: number, d: any) => sum + (d.completed || 0), 0) / (velocityData.length || 1)).toFixed(1)} pts/sprint
        </span>
      </div>
    </div>
  );
};
