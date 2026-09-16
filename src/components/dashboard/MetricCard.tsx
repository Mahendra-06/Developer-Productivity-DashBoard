import React from 'react';
import { 
  Clock, 
  GitCommit, 
  GitPullRequest, 
  Zap, 
  TrendingUp, 
  ShieldCheck, 
  Award,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { MetricCardData } from '../../types';

interface MetricCardProps {
  data: MetricCardData;
}

export const MetricCard: React.FC<MetricCardProps> = ({ data }) => {
  const getIcon = (name: string) => {
    switch (name) {
      case 'Clock': return <Clock className="w-4 h-4" />;
      case 'GitCommit': return <GitCommit className="w-4 h-4" />;
      case 'GitPullRequest': return <GitPullRequest className="w-4 h-4" />;
      case 'Zap': return <Zap className="w-4 h-4" />;
      case 'TrendingUp': return <TrendingUp className="w-4 h-4" />;
      case 'ShieldCheck': return <ShieldCheck className="w-4 h-4" />;
      case 'Award': return <Award className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const isPositive = data.change >= 0;

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 hover:border-brand-500/40 dark:hover:border-brand-500/40 transition-all duration-200 shadow-sm hover:shadow-md group flex flex-col justify-between">
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
            {data.label}
          </span>
          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm">
            {getIcon(data.iconName)}
          </div>
        </div>

        {/* Primary Value & Unit */}
        <div className="mt-2.5 flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 dark:text-slate-100 tracking-tight">
            {data.value}
          </span>
          {data.unit && (
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 font-mono">
              {data.unit}
            </span>
          )}
        </div>

        {/* Mini sparkline visualization if trend values exist */}
        {data.trend && data.trend.length > 1 && (
          <div className="mt-3 flex items-end gap-1 h-3.5 w-full pt-1" title="Sprint trend progression">
            {data.trend.map((val, i) => {
              const max = Math.max(...data.trend, 1);
              const heightPct = Math.max(18, Math.round((val / max) * 100));
              const isLast = i === data.trend.length - 1;
              return (
                <div
                  key={i}
                  style={{ height: `${heightPct}%` }}
                  className={`flex-1 rounded-sm transition-all duration-300 ${
                    isLast
                      ? isPositive ? 'bg-emerald-500 shadow-sm shadow-emerald-500/20' : 'bg-brand-500'
                      : 'bg-slate-200 dark:bg-slate-800/80'
                  }`}
                  title={`Period ${i + 1}: ${val}`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Trend & Change Period Footer */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 font-medium">
          {isPositive ? (
            <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {data.change > 0 ? `+${data.change}%` : 'Stable'}
            </span>
          ) : (
            <span className="flex items-center gap-0.5 text-rose-500 dark:text-rose-400 font-semibold">
              <ArrowDownRight className="w-3.5 h-3.5" />
              {data.change}%
            </span>
          )}
          <span className="text-slate-400 dark:text-slate-500 text-[11px] truncate max-w-[110px]">
            {data.period}
          </span>
        </div>

        {data.badgeText && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full font-mono ${
            data.badgeText === 'Optimal' || data.badgeText === 'High Velocity' || data.badgeText === 'On Track'
              ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
              : data.badgeText === 'In Progress' || data.badgeText === 'Active' || data.badgeText === 'Active Flow'
              ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
          }`}>
            {data.badgeText}
          </span>
        )}
      </div>
    </div>
  );
};
