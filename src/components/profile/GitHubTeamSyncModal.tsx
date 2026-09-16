import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import {
  Github,
  GitBranch,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  XCircle,
  Zap,
  Building2,
  BookOpen,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import { Button } from '../ui/Button';

interface GitHubTeamSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALL_REPOS = [
  'innovate/core-engine',
  'innovate/analytics-sdk',
  'innovate/auth-gateway',
  'innovate/aurora-ui',
  'innovate/pipeline-worker',
  'innovate/mobile-sdk',
  'innovate/infra-charts'
];

export const GitHubTeamSyncModal: React.FC<GitHubTeamSyncModalProps> = ({ isOpen, onClose }) => {
  const {
    gitHubTeamMappings,
    gitHubSyncConfig,
    updateTeammateGitHub,
    toggleMonitoredRepo,
    syncGitHubTeamRoster
  } = useDashboard();

  const [editingHandles, setEditingHandles] = useState<Record<string, string>>({});
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleHandleChange = (teammateId: string, value: string) => {
    setEditingHandles(prev => ({ ...prev, [teammateId]: value }));
  };

  const handleHandleSave = (teammateId: string) => {
    const newHandle = (editingHandles[teammateId] || '').replace('@', '').trim();
    if (newHandle) {
      updateTeammateGitHub(teammateId, newHandle);
      showToast(`GitHub handle updated to @${newHandle} — syncing...`);
      setEditingHandles(prev => { const next = { ...prev }; delete next[teammateId]; return next; });
    }
  };

  const handleSyncAll = () => {
    setSyncing(true);
    syncGitHubTeamRoster();
    setTimeout(() => {
      setSyncing(false);
      showToast('GitHub team roster synced successfully!');
    }, 1700);
  };

  const handleTestWebhook = () => {
    showToast('Webhook ping sent — response: 200 OK (84ms latency)');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-950 border border-slate-800/80 shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 sticky top-0 bg-slate-950/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
              <Github className="w-5 h-5 text-slate-200" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">GitHub Team Sync &amp; Repository Mapping</h2>
              <p className="text-[11px] text-slate-400 font-mono">
                {gitHubSyncConfig.organization} · Last sync: {gitHubSyncConfig.lastSyncAt}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              gitHubSyncConfig.webhookStatus === 'active'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : gitHubSyncConfig.webhookStatus === 'testing'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-slate-700 text-slate-400 border-slate-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                gitHubSyncConfig.webhookStatus === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`} />
              Webhook {gitHubSyncConfig.webhookStatus === 'active' ? 'Active' : gitHubSyncConfig.webhookStatus === 'testing' ? 'Testing...' : 'Inactive'}
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toast notification */}
        {toast && (
          <div className="mx-6 mt-4 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {toast}
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Organization Config */}
          <section className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/60 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Organization Configuration</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">GitHub Organization</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-xl border border-slate-700 text-xs font-mono text-slate-300">
                  <Github className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {gitHubSyncConfig.organization}
                  <a
                    href={gitHubSyncConfig.enterpriseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-brand-400 hover:text-brand-300"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Auto-sync Interval</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-xl border border-slate-700 text-xs font-mono text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  Every {gitHubSyncConfig.autoSyncMinutes} minutes
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={handleTestWebhook} icon={<Zap className="w-3.5 h-3.5" />}>
                Test Webhook Ping
              </Button>
            </div>
          </section>

          {/* Monitored Repositories */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Monitored Repositories</h3>
              <span className="text-[11px] font-mono text-slate-500">({gitHubSyncConfig.monitoredRepos.length} active)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_REPOS.map(repo => {
                const isActive = gitHubSyncConfig.monitoredRepos.includes(repo);
                return (
                  <button
                    key={repo}
                    onClick={() => toggleMonitoredRepo(repo)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono font-medium border transition-all ${
                      isActive
                        ? 'bg-brand-500/15 text-brand-400 border-brand-500/30 hover:bg-brand-500/25'
                        : 'bg-slate-800/60 text-slate-500 border-slate-700/60 hover:border-slate-600 hover:text-slate-400'
                    }`}
                  >
                    <GitBranch className="w-3 h-3" />
                    {repo}
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-brand-400 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Team Roster Mapping Table */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Github className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Team Roster Mapping</h3>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                {gitHubTeamMappings.filter(m => m.syncStatus === 'synced').length}/{gitHubTeamMappings.length} synced
              </span>
            </div>
            <div className="space-y-2">
              {gitHubTeamMappings.map(member => {
                const isEditing = editingHandles[member.teammateId] !== undefined;
                const handleValue = isEditing ? editingHandles[member.teammateId] : member.githubUsername;
                return (
                  <div
                    key={member.teammateId}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/60 flex flex-wrap items-center gap-3 hover:border-slate-700 transition-all"
                  >
                    {/* Avatar + Name */}
                    <div className="flex items-center gap-2.5 min-w-[160px]">
                      <div className="relative shrink-0">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700"
                        />
                        <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ring-2 ring-slate-950 ${
                          member.syncStatus === 'synced' ? 'bg-emerald-500' : member.syncStatus === 'pending' ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'
                        }`} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-200">{member.name}</p>
                        <p className="text-[10px] text-slate-500">{member.role}</p>
                      </div>
                    </div>

                    {/* GitHub Handle Input */}
                    <div className="flex items-center gap-2 flex-1 min-w-[180px]">
                      <div className="relative flex-1">
                        <Github className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                        <input
                          type="text"
                          value={`@${handleValue}`}
                          onChange={(e) => handleHandleChange(member.teammateId, e.target.value.replace('@', ''))}
                          onFocus={() => { if (!isEditing) handleHandleChange(member.teammateId, member.githubUsername); }}
                          className="w-full pl-7 pr-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700 text-[11px] font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500/50 focus:border-brand-500/50 transition-colors"
                        />
                      </div>
                      {isEditing && (
                        <button
                          onClick={() => handleHandleSave(member.teammateId)}
                          className="px-2.5 py-1.5 text-[11px] font-semibold bg-brand-500/15 text-brand-400 border border-brand-500/30 rounded-lg hover:bg-brand-500/25 transition-colors"
                        >
                          Save
                        </button>
                      )}
                      <a
                        href={member.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open GitHub profile"
                        className="p-1.5 text-slate-500 hover:text-brand-400 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {/* Stats + Sync Status */}
                    <div className="flex items-center gap-3 text-[10px] font-mono">
                      <span className="text-slate-500">
                        <span className="text-slate-300 font-semibold">{member.recentCommitsCount}</span> commits
                      </span>
                      <span className="text-slate-500">
                        <span className="text-slate-300 font-semibold">{member.openPrsCount}</span> open PRs
                      </span>
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${
                        member.syncStatus === 'synced'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : member.syncStatus === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-slate-700 text-slate-400 border-slate-700'
                      }`}>
                        {member.syncStatus === 'synced' ? '● Synced' : member.syncStatus === 'pending' ? '◌ Pending' : '○ Unlinked'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800/80 bg-slate-950/80 sticky bottom-0">
          <p className="text-[11px] text-slate-500 font-mono">
            {gitHubSyncConfig.monitoredRepos.length} repos · {gitHubTeamMappings.length} team members
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSyncAll}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />}
            >
              {syncing ? 'Syncing Roster...' : 'Save & Sync Roster'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GitHubTeamSyncModal;
