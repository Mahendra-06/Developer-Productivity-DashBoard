import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { BarChart3, AlertOctagon, Flame, CheckCircle, Clock } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

export const TaskPipelineHistogram: React.FC = () => {
  const { tasks } = useDashboard();
  const [viewMetric, setViewMetric] = useState<'count' | 'storyPoints'>('count');

  // Compute live pipeline distribution sub-divided by priority
  const histogramData = React.useMemo(() => {
    const statuses = [
      { id: 'backlog', label: 'Backlog' },
      { id: 'in_progress', label: 'In Progress' },
      { id: 'in_review', label: 'In Review' },
      { id: 'done', label: 'Completed' },
    ];

    return statuses.map((st) => {
      const statusTasks = tasks.filter(t => t.status === st.id);

      const urgentTasks = statusTasks.filter(t => t.priority === 'urgent');
      const highTasks = statusTasks.filter(t => t.priority === 'high');
      const mediumTasks = statusTasks.filter(t => t.priority === 'medium');
      const lowTasks = statusTasks.filter(t => t.priority === 'low');

      if (viewMetric === 'count') {
        return {
          stage: st.label,
          urgent: urgentTasks.length,
          high: highTasks.length,
          medium: mediumTasks.length,
          low: lowTasks.length,
          total: statusTasks.length,
        };
      } else {
        return {
          stage: st.label,
          urgent: urgentTasks.reduce((s, t) => s + (t.storyPoints || 0), 0),
          high: highTasks.reduce((s, t) => s + (t.storyPoints || 0), 0),
          medium: mediumTasks.reduce((s, t) => s + (t.storyPoints || 0), 0),
          low: lowTasks.reduce((s, t) => s + (t.storyPoints || 0), 0),
          total: statusTasks.reduce((s, t) => s + (t.storyPoints || 0), 0),
        };
      }
    });
  }, [tasks, viewMetric]);

  const totalUrgent = tasks.filter(t => t.priority === 'urgent').length;
  const totalHigh = tasks.filter(t => t.priority === 'high').length;

  if (tasks.length === 0) {
    return (
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between min-h-[360px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Pipeline Flow Histogram</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Stage distribution by task priority</p>
            </div>
          </div>
        </div>

        <div className="py-10 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 mb-3 border border-slate-200 dark:border-slate-700/60 shadow-inner">
            <BarChart3 className="w-7 h-7 text-purple-400 opacity-60" />
          </div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Pipeline Is Clear</h4>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Work items will populate the histogram as tasks are scheduled into Backlog, In Progress, Review, and Done.
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Active Bottlenecks</span>
          <span>0 Detected</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between transition-all">
      {/* Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Pipeline Flow Histogram</h3>
                {totalUrgent > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono bg-rose-500/15 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                    <Flame className="w-2.5 h-2.5" /> {totalUrgent} Urgent
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cross-stage workload distribution segmented by delivery priority
              </p>
            </div>
          </div>

          {/* Toggle metric */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs self-start sm:self-auto">
            <button
              onClick={() => setViewMetric('count')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                viewMetric === 'count'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Task Count
            </button>
            <button
              onClick={() => setViewMetric('storyPoints')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                viewMetric === 'storyPoints'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Story Points
            </button>
          </div>
        </div>

        {/* Stacked / Grouped Histogram Bar Chart */}
        <div className="h-56 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogramData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
              <XAxis
                dataKey="stage"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const totalVal = payload.reduce((sum: number, p: any) => sum + (p.value || 0), 0);
                    return (
                      <div className="p-3 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl text-xs space-y-1.5 backdrop-blur-md">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1 gap-4">
                          <span className="font-semibold text-slate-200">{label}</span>
                          <span className="font-mono text-purple-400 font-bold">
                            {totalVal} {viewMetric === 'count' ? 'items' : 'pts'}
                          </span>
                        </div>
                        {payload.map((entry: any, index: number) => (
                          <div key={index} className="flex items-center justify-between gap-4 font-mono text-[11px]">
                            <span className="flex items-center gap-1.5 text-slate-300">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                              {entry.name}:
                            </span>
                            <span className="font-bold text-white">
                              {entry.value} {viewMetric === 'count' ? 'tasks' : 'pts'}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="urgent" name="Urgent" stackId="a" fill="#f43f5e" radius={[0, 0, 0, 0]} />
              <Bar dataKey="high" name="High Priority" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
              <Bar dataKey="medium" name="Medium Priority" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="low" name="Low Priority" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer Legend */}
      <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2 font-mono">
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Urgent
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> High
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Medium
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Low
          </span>
        </div>
        <div className="text-[11px] text-slate-500">
          High-Priority Load: <strong className="text-slate-300">{totalUrgent + totalHigh} items</strong>
        </div>
      </div>
    </div>
  );
};
