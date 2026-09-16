import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { PieChart as PieIcon, Layers, ShieldCheck, Cpu, Code2, Rocket, Clock } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Sector,
} from 'recharts';

export const WorkCategoryPieChart: React.FC = () => {
  const { analytics, tasks, projects } = useDashboard();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const categories = React.useMemo(() => {
    if (tasks.length === 0) return [];

    let corePoints = 0;
    let distPoints = 0;
    let frontPoints = 0;
    let devopsPoints = 0;
    let secPoints = 0;

    let coreCount = 0;
    let distCount = 0;
    let frontCount = 0;
    let devopsCount = 0;
    let secCount = 0;

    for (const t of tasks) {
      const pts = t.storyPoints || 3;
      const allText = `${t.title} ${t.description || ''} ${t.tags?.join(' ') || ''}`.toLowerCase();

      if (allText.includes('sec') || allText.includes('auth') || allText.includes('jwt') || allText.includes('audit') || allText.includes('guard')) {
        secPoints += pts;
        secCount += 1;
      } else if (allText.includes('front') || allText.includes('ui') || allText.includes('ux') || allText.includes('css') || allText.includes('view') || allText.includes('modal')) {
        frontPoints += pts;
        frontCount += 1;
      } else if (allText.includes('devops') || allText.includes('ci') || allText.includes('cd') || allText.includes('docker') || allText.includes('k8s') || allText.includes('pipeline') || allText.includes('deploy')) {
        devopsPoints += pts;
        devopsCount += 1;
      } else if (allText.includes('distrib') || allText.includes('cache') || allText.includes('stream') || allText.includes('mesh') || allText.includes('kafka') || allText.includes('grpc') || allText.includes('redis')) {
        distPoints += pts;
        distCount += 1;
      } else {
        corePoints += pts;
        coreCount += 1;
      }
    }

    const totalPts = corePoints + distPoints + frontPoints + devopsPoints + secPoints;
    if (totalPts === 0) return [];

    const raw = [
      { name: 'Core Architecture', points: corePoints, count: coreCount, color: '#6366f1', icon: Layers },
      { name: 'Distributed Mesh', points: distPoints, count: distCount, color: '#8b5cf6', icon: Cpu },
      { name: 'Frontend & UX', points: frontPoints, count: frontCount, color: '#06b6d4', icon: Code2 },
      { name: 'DevOps & CI/CD', points: devopsPoints, count: devopsCount, color: '#10b981', icon: Rocket },
      { name: 'Security & Auth', points: secPoints, count: secCount, color: '#f59e0b', icon: ShieldCheck },
    ].filter(item => item.count > 0 || item.points > 0);

    // Calculate normalized percentages
    return raw.map(item => ({
      ...item,
      value: item.points,
      percentage: Math.round((item.points / totalPts) * 100),
      hours: Number((item.points * 1.5).toFixed(1)),
    }));
  }, [tasks]);

  const totalPoints = categories.reduce((sum, c) => sum + c.points, 0);
  const totalHours = categories.reduce((sum, c) => sum + c.hours, 0);

  const activeCategory = activeIndex !== null && categories[activeIndex]
    ? categories[activeIndex]
    : null;

  if (tasks.length === 0 || categories.length === 0) {
    return (
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between min-h-[380px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <PieIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Work Category Distribution</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Architecture & code domain allocation</p>
            </div>
          </div>
        </div>

        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 mb-3 border border-slate-200 dark:border-slate-700/60 shadow-inner">
            <Layers className="w-7 h-7 text-cyan-400 opacity-60" />
          </div>
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">No Domain Allocations</h4>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Categorization updates automatically as tasks are classified into Core, UX, DevOps, and Security.
          </p>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Tracked Time</span>
          <span>0.0 hrs</span>
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
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center shrink-0">
              <PieIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Work Domain Distribution</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {categories.length} active engineering domains • {totalHours.toFixed(1)} hrs tracked
              </p>
            </div>
          </div>

          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {totalPoints} pts total
          </span>
        </div>

        {/* Donut Chart with Centered Readout & Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center my-2">
          <div className="sm:col-span-6 h-48 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {categories.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke={activeIndex === index ? '#ffffff' : '#0f172a'}
                      strokeWidth={activeIndex === index ? 2 : 1}
                      className="transition-all duration-300 cursor-pointer outline-none"
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-2.5 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl text-xs backdrop-blur-md">
                          <span className="font-semibold text-white block">{data.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {data.points} pts ({data.percentage}%) • {data.hours} hrs
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Central Info Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-lg font-bold font-mono text-slate-800 dark:text-slate-100 leading-none">
                {activeCategory ? `${activeCategory.percentage}%` : `${totalPoints}p`}
              </span>
              <span className="text-[10px] text-slate-400 font-medium truncate max-w-[80px] mt-0.5">
                {activeCategory ? activeCategory.name.split(' ')[0] : 'All Work'}
              </span>
            </div>
          </div>

          {/* Interactive Legend List */}
          <div className="sm:col-span-6 space-y-2">
            {categories.map((cat, idx) => {
              const isHovered = activeIndex === idx;
              const Icon = cat.icon;

              return (
                <div
                  key={cat.name}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                  className={`p-2 rounded-xl transition-all border cursor-pointer flex items-center justify-between ${
                    isHovered
                      ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 shadow-xs'
                      : 'bg-slate-50/60 dark:bg-slate-800/30 border-transparent hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                      {cat.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs text-right shrink-0">
                    <span className="text-[11px] text-slate-400">{cat.points}pts</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{cat.percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Meta */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{totalHours.toFixed(1)} Focus Hours</span>
        </span>
        <span>{tasks.length} Deliverables Total</span>
      </div>
    </div>
  );
};
