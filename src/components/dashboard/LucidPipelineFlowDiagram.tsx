import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  Workflow, 
  CircleDot, 
  PlayCircle, 
  GitPullRequest, 
  Cpu, 
  Rocket, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';

interface LucidPipelineFlowDiagramProps {
  onNavigateTab?: (tab: string) => void;
}

export const LucidPipelineFlowDiagram: React.FC<LucidPipelineFlowDiagramProps> = ({ onNavigateTab }) => {
  const { tasks, prs, deployments, projects } = useDashboard();
  const [activeStage, setActiveStage] = useState<string | null>(null);

  // Compute live statistics for every stage in the pipeline
  const backlogTasks = tasks.filter(t => t.status === 'backlog');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const inReviewTasks = tasks.filter(t => t.status === 'in_review');
  const doneTasks = tasks.filter(t => t.status === 'done');

  const pendingPRs = prs.filter(p => !p.isMerged);
  const mergedPRs = prs.filter(p => p.isMerged);

  const totalDeployments = deployments.length;
  const successfulDeployments = deployments.filter(d => d.status === 'success').length;
  const depSuccessRate = totalDeployments > 0 ? Math.round((successfulDeployments / totalDeployments) * 100) : 100;

  const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const donePoints = doneTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const progressPct = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;

  const stages = [
    {
      id: 'backlog',
      step: '01',
      title: 'Work Intake',
      subtitle: 'Backlog Queue',
      icon: CircleDot,
      count: backlogTasks.length,
      points: backlogTasks.reduce((s, t) => s + (t.storyPoints || 0), 0),
      accent: '#94a3b8',
      bgGlow: 'rgba(148, 163, 184, 0.15)',
      borderColor: 'border-slate-500/30',
      tag: `${backlogTasks.length} Queued`,
      actionTab: 'tasks',
    },
    {
      id: 'in_progress',
      step: '02',
      title: 'Active Dev',
      subtitle: 'In Progress',
      icon: PlayCircle,
      count: inProgressTasks.length,
      points: inProgressTasks.reduce((s, t) => s + (t.storyPoints || 0), 0),
      accent: '#3b82f6',
      bgGlow: 'rgba(59, 130, 246, 0.15)',
      borderColor: 'border-blue-500/40',
      tag: `${inProgressTasks.length} Active`,
      actionTab: 'tasks',
    },
    {
      id: 'in_review',
      step: '03',
      title: 'Peer Review',
      subtitle: 'Pull Requests & SLAs',
      icon: GitPullRequest,
      count: prs.length > 0 ? prs.length : inReviewTasks.length,
      points: inReviewTasks.reduce((s, t) => s + (t.storyPoints || 0), 0),
      accent: '#8b5cf6',
      bgGlow: 'rgba(139, 92, 246, 0.15)',
      borderColor: 'border-purple-500/40',
      tag: prs.length > 0 ? `${pendingPRs.length} Open PRs` : `${inReviewTasks.length} In Review`,
      actionTab: 'reviews',
    },
    {
      id: 'ci_cd',
      step: '04',
      title: 'CI/CD Gate',
      subtitle: 'Automated Checks',
      icon: Cpu,
      count: totalDeployments > 0 ? totalDeployments : projects.length,
      points: Math.round(totalPoints * 0.7),
      accent: '#06b6d4',
      bgGlow: 'rgba(6, 182, 212, 0.15)',
      borderColor: 'border-cyan-500/40',
      tag: `${depSuccessRate}% Pass Rate`,
      actionTab: 'deployments',
    },
    {
      id: 'production',
      step: '05',
      title: 'Production',
      subtitle: 'Live & Shipped',
      icon: Rocket,
      count: doneTasks.length,
      points: donePoints,
      accent: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.15)',
      borderColor: 'border-emerald-500/40',
      tag: `${progressPct}% Shipped`,
      actionTab: 'tasks',
    },
  ];

  return (
    <div className="p-6 rounded-3xl bg-slate-900/95 dark:bg-slate-950 border border-brand-500/20 shadow-2xl relative overflow-hidden text-white backdrop-blur-xl">
      {/* Background Cyberpunk Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500/30 to-cyan-500/20 border border-brand-500/40 flex items-center justify-center text-brand-300 shadow-lg shadow-brand-500/20">
            <Workflow className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Software Delivery Lifecycle Architecture
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive end-to-end engineering pipeline from intake to production release
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-300">Sprint Throughput:</span>
            <strong className="text-emerald-400">{donePoints} / {totalPoints} pts</strong>
          </div>
        </div>
      </div>

      {/* Lucid Interactive Pipeline Nodes Flow */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative z-10 my-4">
        {stages.map((st, idx) => {
          const Icon = st.icon;
          const isSelected = activeStage === st.id;

          return (
            <div
              key={st.id}
              onClick={() => setActiveStage(prev => prev === st.id ? null : st.id)}
              className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer relative group flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-800/90 ring-2 ring-brand-400 scale-[1.02] shadow-xl'
                  : 'bg-slate-900/80 hover:bg-slate-800/60'
              } ${st.borderColor}`}
              style={{
                boxShadow: isSelected ? `0 10px 25px -5px ${st.bgGlow}` : undefined
              }}
            >
              {/* Step indicator top */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  STAGE {st.step}
                </span>
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center shadow-md transition-transform group-hover:scale-110"
                  style={{ backgroundColor: st.bgGlow, color: st.accent }}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              {/* Title & Stats */}
              <div className="space-y-1 mb-3">
                <span className="text-xs font-bold text-white block tracking-tight group-hover:text-brand-300 transition-colors">
                  {st.title}
                </span>
                <span className="text-[11px] text-slate-400 block truncate">
                  {st.subtitle}
                </span>
              </div>

              {/* Stat Metric Pill */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 text-[11px]">{st.points} pts</span>
                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold border"
                  style={{
                    backgroundColor: st.bgGlow,
                    color: st.accent,
                    borderColor: `${st.accent}40`,
                  }}
                >
                  {st.tag}
                </span>
              </div>

              {/* Flow Arrow Connector between nodes (desktop) */}
              {idx < stages.length - 1 && (
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-slate-950 border border-slate-700 items-center justify-center text-slate-400 pointer-events-none shadow-md">
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* SVG Neon Flow Connectors (Graphic Pipeline Ribbon) */}
      <div className="hidden md:block h-6 w-full relative z-10 px-4">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 24">
          <defs>
            <linearGradient id="pipelineFlowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.4" />
              <stop offset="25%" stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.8" />
              <stop offset="75%" stopColor="#06b6d4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.9" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <path
            d="M 100 12 L 900 12"
            stroke="url(#pipelineFlowGradient)"
            strokeWidth="3"
            strokeDasharray="6 6"
            filter="url(#glow)"
            className="animate-pulse"
          />
        </svg>
      </div>

      {/* Live Stage Deep-Dive Drawer when clicked */}
      {activeStage && (
        <div className="mt-4 p-4 rounded-2xl bg-slate-800/90 border border-brand-500/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-400 animate-ping" />
            <div>
              <span className="font-bold text-white block">
                {stages.find(s => s.id === activeStage)?.title} Inspection
              </span>
              <span className="text-slate-400 text-[11px]">
                {activeStage === 'backlog' && `${backlogTasks.length} tasks waiting to be scheduled into sprint backlog`}
                {activeStage === 'in_progress' && `${inProgressTasks.length} active engineering tasks currently in flight`}
                {activeStage === 'in_review' && `${pendingPRs.length} pull requests pending peer reviews and approvals`}
                {activeStage === 'ci_cd' && `${depSuccessRate}% automated build and deployment pass rate`}
                {activeStage === 'production' && `${doneTasks.length} deliverables shipped to production (${donePoints} pts)`}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              const target = stages.find(s => s.id === activeStage);
              if (target?.actionTab && onNavigateTab) {
                onNavigateTab(target.actionTab);
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <span>Open {stages.find(s => s.id === activeStage)?.title} View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
