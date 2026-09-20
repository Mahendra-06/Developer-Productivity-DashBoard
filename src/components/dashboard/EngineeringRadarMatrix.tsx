import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { ShieldCheck, Radar as RadarIcon, Zap, Activity, CheckCircle2 } from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';

export const EngineeringRadarMatrix: React.FC = () => {
  const { tasks, prs, deployments, user } = useDashboard();

  // Compute live scores (0 to 100) across 6 engineering dimensions
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;

  const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const donePoints = tasks.filter(t => t.status === 'done').reduce((sum, t) => sum + (t.storyPoints || 0), 0);

  // 1. Velocity Efficiency
  const velocityScore = totalPoints > 0 ? Math.min(100, Math.round((donePoints / totalPoints) * 100)) : 0;

  // 2. Review Agility
  const mergedPRs = prs.filter(p => p.isMerged).length;
  const reviewScore = prs.length > 0 ? Math.min(100, Math.round((mergedPRs / prs.length) * 100)) : 0;

  // 3. Pipeline Stability
  const successfulDeps = deployments.filter(d => d.status === 'success').length;
  const stabilityScore = deployments.length > 0 ? Math.round((successfulDeps / deployments.length) * 100) : 0;

  // 4. Workload Balance
  const domainScore = totalTasks > 0 ? Math.min(100, Math.round((completedTasks / totalTasks) * 100)) : 0;

  // 5. Deployment Cadence
  const cadenceScore = deployments.length > 0 ? Math.min(100, deployments.length * 20) : 0;

  // 6. Focus Intensity
  const focusScore = user?.productivityScore ? Math.min(100, user.productivityScore) : 0;

  const radarData = [
    { subject: 'Velocity', score: velocityScore, benchmark: 80, fullMark: 100 },
    { subject: 'Review Agility', score: reviewScore, benchmark: 75, fullMark: 100 },
    { subject: 'Pipeline Stability', score: stabilityScore, benchmark: 90, fullMark: 100 },
    { subject: 'Work Balance', score: domainScore, benchmark: 70, fullMark: 100 },
    { subject: 'Deploy Cadence', score: cadenceScore, benchmark: 65, fullMark: 100 },
    { subject: 'Focus Score', score: focusScore, benchmark: 85, fullMark: 100 },
  ];

  const overallHealth = Math.round(
    (velocityScore + reviewScore + stabilityScore + domainScore + cadenceScore + focusScore) / 6
  );

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between transition-all">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
              <RadarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Engineering Radar Matrix</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-brand-500/15 text-brand-400 border border-brand-500/20">
                  {overallHealth}% Index
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Multi-dimensional team capability & DORA health telemetry
              </p>
            </div>
          </div>
        </div>

        {/* Radar Visualizer */}
        <div className="h-60 w-full relative my-1">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#475569" strokeOpacity={0.25} />
              <PolarAngleAxis
                dataKey="subject"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
              />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" strokeOpacity={0.2} tick={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="p-2.5 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl text-xs space-y-1 backdrop-blur-md">
                        <span className="font-bold text-white block">{item.subject}</span>
                        <div className="font-mono text-[11px] text-slate-300 flex items-center justify-between gap-3">
                          <span>Team Score:</span>
                          <strong className="text-brand-400">{item.score}%</strong>
                        </div>
                        <div className="font-mono text-[11px] text-slate-400 flex items-center justify-between gap-3">
                          <span>Benchmark:</span>
                          <span>{item.benchmark}%</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Radar
                name="Team Performance"
                dataKey="score"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.4}
                strokeWidth={2}
              />
              <Radar
                name="Industry Target"
                dataKey="benchmark"
                stroke="#06b6d4"
                fill="#06b6d4"
                fillOpacity={0.15}
                strokeDasharray="3 3"
                strokeWidth={1.5}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer Metrics Breakdown */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs font-mono">
        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          <span className="text-[10px] text-slate-400 block">Stability</span>
          <span className="font-bold text-emerald-400">{stabilityScore}%</span>
        </div>
        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          <span className="text-[10px] text-slate-400 block">Agility</span>
          <span className="font-bold text-brand-400">{reviewScore}%</span>
        </div>
        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          <span className="text-[10px] text-slate-400 block">Velocity</span>
          <span className="font-bold text-cyan-400">{velocityScore}%</span>
        </div>
      </div>
    </div>
  );
};
