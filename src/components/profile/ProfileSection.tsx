import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { IntegrationsList } from './IntegrationsList';
import { AchievementsGamification } from './AchievementsGamification';
import { EditProfileModal } from './EditProfileModal';
import { ProfileDossierModal } from './ProfileDossierModal';
import { ProductivityRhythmCard } from './ProductivityRhythmCard';
import { ContributionsShowcase } from './ContributionsShowcase';
import { SkillMatrixCard } from './SkillMatrixCard';
import { SettingsSection } from '../settings/SettingsSection';
import { 
  Flame, 
  Award, 
  CheckCircle2, 
  Sparkles, 
  Mail, 
  MapPin, 
  Globe, 
  Target, 
  Edit3, 
  FileText, 
  Github,
  Zap,
  Sliders
} from 'lucide-react';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';

export const ProfileSection: React.FC = () => {
  const { user, tasks, updateUser } = useDashboard();
  const [profileTab, setProfileTab] = useState<'overview' | 'settings'>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);

  const completedTasks = tasks.filter((t) => t.status === 'done');
  const completedCount = completedTasks.length;
  const completedStoryPoints = completedTasks.reduce((acc, t) => acc + t.storyPoints, 0);

  const quickStatusPresets = [
    { label: '🚀 Deep Flow', status: 'Deep Work on Cache Invalidation 🚀' },
    { label: '🔍 PR Review', status: 'Reviewing High-Priority PRs 🔍' },
    { label: '⚡ On-Call', status: 'Incident On-Call Support ⚡' },
    { label: '🤝 Pairing', status: 'Pairing & Architecture Sync 🤝' },
    { label: '☕ Away', status: 'Away / Focused Reading ☕' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Profile Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/70 border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Background glow circle */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-brand-500/40 shadow-lg shadow-black/40"
              />
              <span 
                className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500 ring-4 ring-slate-900 flex items-center justify-center text-white" 
                title="Online & Active on Telemetry Stream"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl sm:text-2xl font-bold text-white">{user.name}</h2>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  @{user.username}
                </span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {user.role}
                </span>
                {user.githubUsername ? (
                  <a
                    href={`https://github.com/${user.githubUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>github.com/{user.githubUsername}</span>
                  </a>
                ) : (
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800/60 text-slate-400 border border-slate-700/60 flex items-center gap-1.5">
                    <Github className="w-3.5 h-3.5" />
                    <span>GitHub Unlinked</span>
                  </span>
                )}
                {user.githubToken && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>PAT Linked</span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-medium">{user.role}</p>

              {/* Bio summary */}
              {user.bio && (
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  {user.bio}
                </p>
              )}
              
              {/* Metadata tags */}
              <div className="flex flex-wrap items-center gap-3.5 mt-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-brand-400" />
                  {user.email}
                </span>
                {user.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-400" />
                    {user.location}
                  </span>
                )}
                {user.timezone && (
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-brand-400" />
                    {user.timezone}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right side: Productivity score & Action buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-4 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 shrink-0 w-full sm:w-auto justify-around">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-amber-400 font-semibold text-xs mb-0.5">
                  <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-bounce" />
                  <span>Streak</span>
                </div>
                <span className="text-xl font-bold font-mono text-white">{user.activeStreak} Days</span>
              </div>

              <div className="h-8 w-px bg-slate-800" />

              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-brand-400 font-semibold text-xs mb-0.5">
                  <Award className="w-3.5 h-3.5" />
                  <span>Dev Score</span>
                </div>
                <span className="text-xl font-bold font-mono text-emerald-400">{user.productivityScore}/100</span>
              </div>

              <div className="h-8 w-px bg-slate-800" />

              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-cyan-400 font-semibold text-xs mb-0.5">
                  <Target className="w-3.5 h-3.5" />
                  <span>Shipped</span>
                </div>
                <span className="text-xl font-bold font-mono text-white">{completedStoryPoints} pts</span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant={profileTab === 'settings' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setProfileTab(prev => prev === 'settings' ? 'overview' : 'settings')}
                icon={<Sliders className="w-3.5 h-3.5" />}
                className="flex-1 sm:flex-initial"
              >
                {profileTab === 'settings' ? 'View Metrics' : 'Settings'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDossierModalOpen(true)}
                icon={<FileText className="w-3.5 h-3.5 text-brand-400" />}
                className="flex-1 sm:flex-initial"
              >
                Performance Dossier
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                icon={<Edit3 className="w-3.5 h-3.5" />}
                className="flex-1 sm:flex-initial"
              >
                Edit Profile
              </Button>
            </div>
          </div>
        </div>

        {/* Focus Status Bar & Quick Status Presets */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              Current Status:
            </span>
            <span className="font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2.5 py-0.5 rounded-lg">
              {user.focusStatus}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 text-[11px] mr-1">Quick Toggle:</span>
            {quickStatusPresets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => updateUser({ focusStatus: preset.status })}
                className={`text-[11px] px-2 py-0.5 rounded-md transition-all ${
                  user.focusStatus === preset.status
                    ? 'bg-brand-500/30 text-brand-300 font-semibold border border-brand-500/50'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setProfileTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            profileTab === 'overview'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Engineer Profile & Metrics</span>
        </button>

        <button
          type="button"
          onClick={() => setProfileTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            profileTab === 'settings'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Workspace & Preferences (Settings)</span>
        </button>
      </div>

      {profileTab === 'settings' ? (
        <div className="animate-fade-in">
          <SettingsSection />
        </div>
      ) : (
        <>
          {/* Cognitive Flow Rhythm & Peak Productivity Hours */}
          <ProductivityRhythmCard />

          {/* Weekly Focus Goal & High-Impact Authored Contributions Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weekly Deep Work Goal Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4 lg:col-span-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Weekly Deep Work Quota</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Target: {user.weeklyGoalHours} hrs coding</p>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-bold text-brand-500">
                    {user.currentGoalHours} / {user.weeklyGoalHours} hrs
                  </span>
                </div>

                <ProgressBar
                  progress={Math.round((user.currentGoalHours / user.weeklyGoalHours) * 100)}
                  color="#6366f1"
                  height="h-3"
                  showLabel={true}
                  label="Sprint Progress"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-center">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-[10px] text-slate-400 block">Completed</span>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">{completedCount}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-[10px] text-slate-400 block">Open PRs</span>
                  <span className="font-mono font-bold text-sm text-amber-500">{user.openPRsCount}</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-[10px] text-slate-400 block">Merged PRs</span>
                  <span className="font-mono font-bold text-sm text-emerald-500">{user.mergedPRsCount}</span>
                </div>
              </div>
            </div>

            {/* High-Impact Authored Deliveries & RFCs */}
            <div className="lg:col-span-2">
              <ContributionsShowcase />
            </div>
          </div>

          {/* Engineering Competency & Skills Matrix */}
          <SkillMatrixCard />

          {/* Gamification & Achievements Module */}
          <AchievementsGamification />

          {/* Connected Tooling & Integrations */}
          <IntegrationsList />
        </>
      )}

      {/* Modals */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />

      <ProfileDossierModal
        isOpen={isDossierModalOpen}
        onClose={() => setIsDossierModalOpen(false)}
      />
    </div>
  );
};

export default ProfileSection;
