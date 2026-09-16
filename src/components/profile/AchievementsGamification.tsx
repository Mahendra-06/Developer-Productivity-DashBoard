import React from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  Award, 
  Flame, 
  Zap, 
  ShieldCheck, 
  CheckCircle2, 
  Lock, 
  Sparkles, 
  TrendingUp, 
  Trophy, 
  Target 
} from 'lucide-react';
import { ProgressBar } from '../ui/ProgressBar';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  unlocked: boolean;
  unlockedDate?: string;
  progress?: string;
  color: string;
}

export const AchievementsGamification: React.FC = () => {
  const { user, tasks, prs } = useDashboard();

  const completedTasks = tasks.filter(t => t.status === 'done');
  const completedPoints = completedTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const mergedPRs = prs.filter(p => p.status === 'merged' || p.isMerged);
  const reviewedPRs = prs.filter(p => p.isReviewed || p.isMerged);
  const streak = user?.activeStreak || 0;
  const focusHours = user?.currentGoalHours || 0;

  // Compute authentic XP and level based strictly on real deliverables
  const xp = (completedPoints * 10) + (mergedPRs.length * 15) + (completedTasks.length * 5) + (streak * 10) + (Math.round(focusHours) * 8);
  const level = Math.max(1, Math.floor(xp / 100) + 1);
  const currentLevelBaseXP = (level - 1) * 100;
  const levelXP = xp - currentLevelBaseXP;
  const xpNeeded = 100;
  const xpProgressPercent = Math.min(100, Math.round((levelXP / xpNeeded) * 100));

  const getRoleTitle = (lvl: number) => {
    if (lvl >= 10) return 'Principal Engineering Fellow';
    if (lvl >= 8) return 'Staff Software Engineer';
    if (lvl >= 6) return 'Lead Software Engineer';
    if (lvl >= 4) return 'Senior Software Engineer';
    if (lvl >= 2) return 'Software Engineer II';
    return 'Associate Software Engineer';
  };

  const getTierBadge = (lvl: number) => {
    if (lvl >= 8) return 'Top 5% Tier';
    if (lvl >= 5) return 'Top 15% Tier';
    if (lvl >= 3) return 'Core Contributor';
    return 'Active Contributor';
  };

  const achievements: Achievement[] = [
    {
      id: 'ach_1',
      title: 'PR Delivery Champion',
      description: 'Successfully author, review, or merge pull requests into the codebase',
      icon: Zap,
      unlocked: mergedPRs.length >= 1,
      unlockedDate: mergedPRs.length >= 1 ? `${mergedPRs.length} Merged` : undefined,
      progress: `${mergedPRs.length} / 1 Merged`,
      color: '#f59e0b'
    },
    {
      id: 'ach_2',
      title: 'Deep Work Devotee',
      description: 'Complete focused engineering sessions and log deep work hours',
      icon: ShieldCheck,
      unlocked: focusHours >= 5,
      unlockedDate: focusHours >= 5 ? `${focusHours.toFixed(1)} hrs logged` : undefined,
      progress: `${focusHours.toFixed(1)} / 5.0 hrs`,
      color: '#10b981'
    },
    {
      id: 'ach_3',
      title: 'Flow State Streak',
      description: 'Maintain 5 or more consecutive days of logged engineering activity',
      icon: Flame,
      unlocked: streak >= 5,
      unlockedDate: streak >= 5 ? `${streak}-Day Streak` : undefined,
      progress: `${streak} / 5 Days`,
      color: '#ec4899'
    },
    {
      id: 'ach_4',
      title: 'Velocity Titan',
      description: 'Deliver 20 or more completed story points from tracked issues',
      icon: Target,
      unlocked: completedPoints >= 20,
      unlockedDate: completedPoints >= 20 ? `${completedPoints} Pts Done` : undefined,
      progress: `${completedPoints} / 20 Points`,
      color: '#6366f1'
    },
    {
      id: 'ach_5',
      title: 'Task Execution Master',
      description: 'Complete 5 or more verified engineering issues on the board',
      icon: Sparkles,
      unlocked: completedTasks.length >= 5,
      unlockedDate: completedTasks.length >= 5 ? `${completedTasks.length} Done` : undefined,
      progress: `${completedTasks.length} / 5 Done`,
      color: '#06b6d4'
    },
    {
      id: 'ach_6',
      title: 'Code Review Maestro',
      description: 'Review and verify 3 or more pull requests in the review queue',
      icon: Trophy,
      unlocked: reviewedPRs.length >= 3,
      unlockedDate: reviewedPRs.length >= 3 ? `${reviewedPRs.length} Reviewed` : undefined,
      progress: `${reviewedPRs.length} / 3 Reviewed`,
      color: '#8b5cf6'
    }
  ];

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-5">
      {/* Header with Level & XP */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-brand-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Level {level} {getRoleTitle(level)}
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/30">
                {getTierBadge(level)}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {levelXP} / {xpNeeded} XP points to <strong className="text-brand-400 font-normal">Level {level + 1} {getRoleTitle(level + 1)}</strong>
            </p>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="w-full sm:w-56 space-y-1">
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>Progress to Next Tier</span>
            <span className="text-brand-400 font-bold">{xpProgressPercent}%</span>
          </div>
          <ProgressBar progress={xpProgressPercent} color="#6366f1" height="h-2" />
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
        {achievements.map((ach) => {
          const Icon = ach.icon;
          return (
            <div
              key={ach.id}
              className={`p-3.5 rounded-xl border transition-all ${
                ach.unlocked
                  ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800/80 hover:border-brand-500/40'
                  : 'bg-slate-100/60 dark:bg-slate-950/40 border-dashed border-slate-200 dark:border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm"
                  style={{ backgroundColor: ach.unlocked ? ach.color : '#64748b' }}
                >
                  <Icon className="w-4 h-4" />
                </div>

                {ach.unlocked ? (
                  <span className="text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    {ach.unlockedDate}
                  </span>
                ) : (
                  <span className="text-[10px] font-mono flex items-center gap-1 text-slate-400 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    <Lock className="w-2.5 h-2.5" />
                    {ach.progress}
                  </span>
                )}
              </div>

              <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">{ach.title}</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {ach.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
