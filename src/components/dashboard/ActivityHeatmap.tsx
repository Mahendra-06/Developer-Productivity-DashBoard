import React, { useMemo, useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { ActivityDay } from '../../types';
import { 
  GitCommit, 
  GitPullRequest, 
  CheckCircle2, 
  ListTodo, 
  Layers, 
  Calendar,
  Sparkles,
  BarChart2
} from 'lucide-react';

type HeatmapMode = 'category' | 'timeline';

interface CategoryRow {
  id: string;
  name: string;
  icon: any;
  colorClass: string;
  badgeBg: string;
  // Index 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
  counts: number[];
  total: number;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const ActivityHeatmap: React.FC = () => {
  const { analytics, tasks, prs, auditEvents } = useDashboard();
  const [viewMode, setViewMode] = useState<HeatmapMode>('category');
  const [hoveredDay, setHoveredDay] = useState<ActivityDay | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ dayName: string; categoryName: string; count: number } | null>(null);

  // 1. Compute Category by Day of Week breakdown
  const categoryRows: CategoryRow[] = useMemo(() => {
    // Map Javascript Date.getDay() (0=Sun, 1=Mon, ..., 6=Sat) to index (0=Mon ... 6=Sun)
    const getWeekdayIndex = (dateStr: string) => {
      const d = new Date(dateStr);
      const day = d.getDay();
      return day === 0 ? 6 : day - 1;
    };

    const commitCounts = [0, 0, 0, 0, 0, 0, 0];
    const prCounts = [0, 0, 0, 0, 0, 0, 0];
    const reviewCounts = [0, 0, 0, 0, 0, 0, 0];
    const deploymentCounts = [0, 0, 0, 0, 0, 0, 0];
    const taskCounts = [0, 0, 0, 0, 0, 0, 0];

    // Commits from audit activities or synthetic Git activity
    auditEvents.forEach(evt => {
      if (evt.timestamp) {
        const idx = getWeekdayIndex(evt.timestamp);
        if (evt.category === 'system' || evt.action?.toLowerCase().includes('commit') || evt.action?.toLowerCase().includes('push')) {
          commitCounts[idx] += 1;
        }
      }
    });

    // Pull Requests
    prs.forEach(pr => {
      if (pr.createdAt) {
        const idx = getWeekdayIndex(pr.createdAt);
        prCounts[idx] += 1;
      }
      if (pr.isReviewed || pr.isMerged) {
        const idx = getWeekdayIndex((pr as any).updatedAt || pr.createdAt || new Date().toISOString());
        reviewCounts[idx] += 1;
      }
    });

    // Tasks created or completed
    tasks.forEach(t => {
      if (t.createdAt) {
        const idx = getWeekdayIndex(t.createdAt);
        taskCounts[idx] += 1;
      }
      if (t.updatedAt && t.status === 'done') {
        const idx = getWeekdayIndex(t.updatedAt);
        taskCounts[idx] += 1;
      }
    });

    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

    return [
      {
        id: 'commits',
        name: 'Git Commits',
        icon: GitCommit,
        colorClass: 'text-indigo-500 dark:text-indigo-400',
        badgeBg: 'bg-indigo-500/10 text-indigo-400',
        counts: commitCounts,
        total: sum(commitCounts)
      },
      {
        id: 'prs',
        name: 'Pull Requests',
        icon: GitPullRequest,
        colorClass: 'text-purple-500 dark:text-purple-400',
        badgeBg: 'bg-purple-500/10 text-purple-400',
        counts: prCounts,
        total: sum(prCounts)
      },
      {
        id: 'reviews',
        name: 'Code Reviews',
        icon: CheckCircle2,
        colorClass: 'text-emerald-500 dark:text-emerald-400',
        badgeBg: 'bg-emerald-500/10 text-emerald-400',
        counts: reviewCounts,
        total: sum(reviewCounts)
      },
      {
        id: 'tasks',
        name: 'Deliverables / Tasks',
        icon: ListTodo,
        colorClass: 'text-blue-500 dark:text-blue-400',
        badgeBg: 'bg-blue-500/10 text-blue-400',
        counts: taskCounts,
        total: sum(taskCounts)
      },
    ];
  }, [tasks, prs, auditEvents]);

  // Daily totals across all categories
  const dailyTotals = useMemo(() => {
    const totals = [0, 0, 0, 0, 0, 0, 0];
    categoryRows.forEach(row => {
      row.counts.forEach((val, idx) => {
        totals[idx] += val;
      });
    });
    return totals;
  }, [categoryRows]);

  const grandTotal = useMemo(() => {
    return dailyTotals.reduce((a, b) => a + b, 0);
  }, [dailyTotals]);

  // 2. 84-day timeline computation
  const days: ActivityDay[] = useMemo(() => {
    if (analytics?.activityDays && analytics.activityDays.length > 0) {
      const totalFromAnalytics = analytics.activityDays.reduce((sum: number, d: any) => sum + (d.count || 0), 0);
      if (totalFromAnalytics > 0) {
        return analytics.activityDays;
      }
    }

    const countsByDate: Record<string, number> = {};
    for (const t of tasks) {
      if (t.createdAt) {
        const d = t.createdAt.split('T')[0];
        countsByDate[d] = (countsByDate[d] || 0) + 1;
      }
      if (t.updatedAt && t.status === 'done') {
        const d = t.updatedAt.split('T')[0];
        countsByDate[d] = (countsByDate[d] || 0) + 1;
      }
    }
    for (const p of prs) {
      if (p.createdAt) {
        const d = p.createdAt.split('T')[0];
        countsByDate[d] = (countsByDate[d] || 0) + 1;
      }
    }
    for (const a of auditEvents) {
      if (a.timestamp) {
        const d = a.timestamp.split('T')[0];
        countsByDate[d] = (countsByDate[d] || 0) + 1;
      }
    }

    const result: ActivityDay[] = [];
    const today = new Date();

    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const count = countsByDate[dateKey] || 0;
      const dayOfWeek = d.getDay();

      result.push({
        date: dateKey,
        count,
        level: count >= 4 ? 4 : count >= 3 ? 3 : count >= 2 ? 2 : count >= 1 ? 1 : 0,
        dayOfWeek,
        weekIndex: Math.floor((83 - i) / 7),
      });
    }
    return result;
  }, [analytics, tasks, prs, auditEvents]);

  // Intensity styling for Category cells
  const getCategoryCellBg = (count: number) => {
    if (count === 0) return 'bg-slate-50 dark:bg-slate-800/30 text-slate-400 border border-slate-100 dark:border-slate-800/40';
    if (count <= 2) return 'bg-brand-500/15 text-brand-600 dark:text-brand-300 border border-brand-500/25 font-medium';
    if (count <= 5) return 'bg-brand-500/35 text-brand-700 dark:text-brand-200 border border-brand-500/40 font-semibold';
    return 'bg-brand-600 text-white font-bold shadow-sm shadow-brand-500/30 border border-brand-500';
  };

  const getTimelineColor = (level: number) => {
    switch (level) {
      case 4: return 'bg-emerald-500 shadow-sm shadow-emerald-500/20';
      case 3: return 'bg-emerald-600/80';
      case 2: return 'bg-emerald-700/60';
      case 1: return 'bg-emerald-900/60';
      case 0:
      default: return 'bg-slate-200 dark:bg-slate-800/80';
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Engineering Work Activity
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/20 font-bold">
                  {grandTotal} Events
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {viewMode === 'category' 
                  ? 'Activity volume mapped across weekly categories and days' 
                  : 'Cumulative commit and deliverable stream over 12 weeks'}
              </p>
            </div>
          </div>

          {/* View Mode Switcher Pill */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setViewMode('category')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'category'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Category Matrix
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                viewMode === 'timeline'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              12-Wk Timeline
            </button>
          </div>
        </div>

        {/* Live Hover Info Callout */}
        <div className="text-xs font-mono text-slate-500 dark:text-slate-400 h-6 flex items-center mb-3">
          {viewMode === 'category' && hoveredCell ? (
            <span className="text-brand-600 dark:text-brand-400 font-semibold flex items-center gap-1.5 bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20">
              <Sparkles className="w-3 h-3 text-brand-500" />
              <span>{hoveredCell.dayName} · {hoveredCell.categoryName} · {hoveredCell.count} event{hoveredCell.count !== 1 ? 's' : ''}</span>
            </span>
          ) : viewMode === 'timeline' && hoveredDay ? (
            <span className="text-emerald-500 font-medium flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              <Calendar className="w-3 h-3" />
              <span>{hoveredDay.date} · {hoveredDay.count} active contributions</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 italic">
              Hover any cell for exact category breakdown and event volume
            </span>
          )}
        </div>

        {/* VIEW 1: CATEGORY BY DAY-OF-WEEK MATRIX */}
        {viewMode === 'category' ? (
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[540px]">
              {/* Table Grid */}
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-2 px-3 text-left w-44">Category / Stream</th>
                    {WEEKDAYS.map((day) => (
                      <th key={day} className="py-2 px-2 text-center font-mono">
                        {day}
                      </th>
                    ))}
                    <th className="py-2 px-3 text-right font-mono">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {categoryRows.map((row) => {
                    const Icon = row.icon;
                    return (
                      <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-3.5 h-3.5 ${row.colorClass}`} />
                            <span className="truncate">{row.name}</span>
                          </div>
                        </td>
                        {row.counts.map((count, dayIdx) => {
                          const dayName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][dayIdx];
                          return (
                            <td key={dayIdx} className="p-1 text-center">
                              <div
                                onMouseEnter={() => setHoveredCell({ dayName, categoryName: row.name, count })}
                                onMouseLeave={() => setHoveredCell(null)}
                                className={`h-8 rounded-lg flex items-center justify-center font-mono text-xs transition-all duration-150 cursor-pointer hover:scale-105 hover:ring-2 hover:ring-brand-400 ${getCategoryCellBg(
                                  count
                                )}`}
                                title={`${dayName} · ${row.name} · ${count} events`}
                              >
                                {count}
                              </div>
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                          {row.total}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 dark:border-slate-800 font-semibold text-slate-900 dark:text-slate-100 text-xs">
                    <td className="py-2.5 px-3 font-semibold text-slate-500">
                      Daily Activity Total
                    </td>
                    {dailyTotals.map((tot, idx) => (
                      <td key={idx} className="py-2.5 px-2 text-center font-mono font-bold text-brand-600 dark:text-brand-400">
                        {tot}
                      </td>
                    ))}
                    <td className="py-2.5 px-3 text-right font-mono font-black text-brand-500">
                      {grandTotal}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          /* VIEW 2: 12-WEEK TIMELINE STREAM */
          <div className="overflow-x-auto pb-2 space-y-3">
            <div className="grid grid-rows-7 grid-flow-col gap-1.5 min-w-[620px]">
              {days.map((day, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`w-3.5 h-3.5 rounded-sm transition-all duration-150 hover:ring-2 hover:ring-emerald-400 hover:scale-125 cursor-pointer ${getTimelineColor(
                    day.level
                  )}`}
                  title={`${day.count} activities on ${day.date}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Legend */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="text-[11px] font-medium">
          {viewMode === 'category' ? 'Categorized engineering activity stream' : 'Mon — Sun Active Workflow'}
        </span>
        <div className="flex items-center gap-1.5 text-[11px]">
          <span>Less</span>
          {viewMode === 'category' ? (
            <>
              <span className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
              <span className="w-3 h-3 rounded-sm bg-brand-500/20" />
              <span className="w-3 h-3 rounded-sm bg-brand-500/40" />
              <span className="w-3 h-3 rounded-sm bg-brand-600" />
            </>
          ) : (
            <>
              <span className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-800" />
              <span className="w-3 h-3 rounded-sm bg-emerald-900/60" />
              <span className="w-3 h-3 rounded-sm bg-emerald-700/60" />
              <span className="w-3 h-3 rounded-sm bg-emerald-600/80" />
              <span className="w-3 h-3 rounded-sm bg-emerald-500" />
            </>
          )}
          <span>More</span>
        </div>
      </div>
    </div>
  );
};
