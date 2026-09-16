import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { PullRequestItem } from '../../types';
import { PRVelocityMetrics } from './PRVelocityMetrics';
import { PRDiffInspectorModal } from './PRDiffInspectorModal';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { Button } from '../ui/Button';
import { 
  GitPullRequest, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  ShieldCheck, 
  ExternalLink, 
  GitMerge, 
  AlertCircle, 
  ThumbsUp, 
  Sparkles,
  GitBranch,
  Terminal,
  Code2,
  Filter,
  Check,
  Github,
  Users
} from 'lucide-react';

export const PRReviewQueue: React.FC = () => {
  const { prs, projects, approvePR, mergePR, user, analytics, createPairingRoom } = useDashboard();
  const [activeQueueTab, setActiveQueueTab] = useState<'review_requested' | 'authored_by_me' | 'merged'>('review_requested');
  const [selectedRepo, setSelectedRepo] = useState<string>('all');
  const [selectedSla, setSelectedSla] = useState<string>('all');
  const [selectedPrForDiff, setSelectedPrForDiff] = useState<PullRequestItem | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const isAuthor = (pr: PullRequestItem): boolean => {
    if (!user) return false;
    if (pr.author?.id && (pr.author.id === user.id || pr.author.id === user.email)) return true;
    if (user.username && pr.author?.username && pr.author.username.toLowerCase() === user.username.toLowerCase()) return true;
    if (user.name && pr.author?.name && pr.author.name.toLowerCase() === user.name.toLowerCase()) return true;
    return false;
  };

  const getPrProjectType = (pr: PullRequestItem): 'team' | 'individual' => {
    if (pr.projectType) return pr.projectType;
    const proj = projects.find(p => 
      p.id === pr.projectId ||
      (p.repoUrl && p.repoUrl.replace(/^https?:\/\/github\.com\//i, '').toLowerCase() === pr.repo.toLowerCase()) ||
      pr.repo.toLowerCase().includes(p.key.toLowerCase()) ||
      pr.title.toUpperCase().includes(`[${p.key.toUpperCase()}]`)
    );
    return proj?.projectType || 'team';
  };

  const getSlaDetails = (pr: PullRequestItem) => {
    if (pr.isMerged) {
      return {
        status: 'healthy',
        label: 'Shipped',
        badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      };
    }
    const hours = pr.waitingHours != null ? pr.waitingHours : 0;
    if (pr.slaStatus === 'at_risk' || (hours >= 24 && hours <= 48)) {
      return {
        status: 'at_risk',
        label: hours > 0 ? `At Risk (${hours}h)` : 'At Risk (Changes Req.)',
        badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      };
    }
    if (pr.slaStatus === 'breached' || hours > 48) {
      return {
        status: 'breached',
        label: `Breached (${hours}h)`,
        badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse'
      };
    }
    return {
      status: 'healthy',
      label: hours > 0 ? `Healthy (${hours}h)` : 'Healthy (< 24h)',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    };
  };

  const prsWithTurnaround = prs.filter(p => p.turnaroundHours != null && p.turnaroundHours > 0);
  const avgTurnaroundVal = prsWithTurnaround.length > 0
    ? (prsWithTurnaround.reduce((acc, p) => acc + (p.turnaroundHours || 0), 0) / prsWithTurnaround.length).toFixed(1)
    : (analytics?.metricsSummary?.avgReviewTurnaroundHours != null && analytics.metricsSummary.avgReviewTurnaroundHours > 0)
    ? analytics.metricsSummary.avgReviewTurnaroundHours.toFixed(1)
    : null;
  const avgTurnaround = avgTurnaroundVal ? `${avgTurnaroundVal} hrs` : (prs.length > 0 ? '1.2 hrs' : '--');

  const handleApprove = (pr: PullRequestItem) => {
    approvePR(pr.id);
    setNotification(`PR #${pr.number} approved! 🚀 Review SLA and turnaround updated.`);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleMerge = (pr: PullRequestItem) => {
    mergePR(pr.id);
    setNotification(`PR #${pr.number} merged! Continuous Deployment pipeline triggered to Production 🚀`);
    setTimeout(() => setNotification(null), 4500);
  };

  const handleStartHuddle = (pr: PullRequestItem) => {
    createPairingRoom(
      `PR #${pr.number} Live Review`,
      `Diff & AI Heuristics Inspection: ${pr.title}`,
      pr.branch
    );
    setNotification(`Pairing Room launched for PR #${pr.number}! Live pairing huddle active 🎙️`);
    setTimeout(() => setNotification(null), 4000);
  };

  // Two Distinct Queue Views in Team Projects:
  // 1. Review Requested: PRs created by your teammates that are waiting for your approval before they can be merged into main
  const reviewRequestedList = prs.filter(p => !p.isMerged && p.status !== 'merged' && !isAuthor(p));

  // 2. Authored by Me: PRs you created that are currently awaiting peer review from your team
  const authoredByMeList = prs.filter(p => !p.isMerged && p.status !== 'merged' && isAuthor(p));

  // 3. Merged & Shipped
  const mergedList = prs.filter(p => p.queueType === 'merged' || p.isMerged || p.status === 'merged');

  const activeList = 
    activeQueueTab === 'review_requested'
      ? reviewRequestedList
      : activeQueueTab === 'authored_by_me'
      ? authoredByMeList
      : mergedList;

  const filteredPRs = activeList.filter(p => {
    if (selectedRepo !== 'all' && p.repo !== selectedRepo) return false;
    if (selectedSla !== 'all') {
      const sla = getSlaDetails(p);
      if (sla.status !== selectedSla) return false;
    }
    return true;
  });

  const uniqueRepos = Array.from(new Set([
    ...prs.map(p => p.repo),
    ...projects.map(p => p.repoUrl ? p.repoUrl.replace(/^https?:\/\/github\.com\//, '') : `dmetrics/${p.key.toLowerCase()}`)
  ])).filter(Boolean);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Notification */}
      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-between shadow-lg animate-slide-down">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
          <span className="font-mono text-[11px] text-emerald-400/80">Turnaround: {avgTurnaround} Avg</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-brand-500/20 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center gap-1.5">
              <GitPullRequest className="w-3.5 h-3.5" /> Team Pull Request Routing & SLAs
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">Pull Request Review & Code Intelligence</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            In team projects, peer reviews are mandatory before merge. Automated heuristic insights guard performance, security, and test coverage with strict 24h SLAs.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
          <div className="text-center px-2">
            <span className="text-[10px] text-slate-400 block">Avg Turnaround</span>
            <span className="text-base font-bold font-mono text-emerald-400">{avgTurnaround}</span>
          </div>
          <div className="h-7 w-px bg-slate-800" />
          <div className="text-center px-2">
            <span className="text-[10px] text-slate-400 block">Review Requested</span>
            <span className="text-base font-bold font-mono text-brand-400">{reviewRequestedList.filter(p => !p.isReviewed).length} PRs</span>
          </div>
          <div className="h-7 w-px bg-slate-800" />
          <div className="text-center px-2">
            <span className="text-[10px] text-slate-400 block">Authored by Me</span>
            <span className="text-base font-bold font-mono text-cyan-400">{authoredByMeList.length}</span>
          </div>
          <div className="h-7 w-px bg-slate-800" />
          <div className="text-center px-2">
            <span className="text-[10px] text-slate-400 block">Shipped Merged</span>
            <span className="text-base font-bold font-mono text-slate-200">{user.mergedPRsCount}</span>
          </div>
        </div>
      </div>

      {/* Velocity & Reviewer Health Cards */}
      <PRVelocityMetrics />

      {/* Queue Tabs & Filters Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Two Distinct Queue Views in Team Projects */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          <button
            onClick={() => setActiveQueueTab('review_requested')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeQueueTab === 'review_requested'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-200'
            }`}
          >
            <span>To Review</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-brand-500/20 text-brand-400">
              {reviewRequestedList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveQueueTab('authored_by_me')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeQueueTab === 'authored_by_me'
                ? 'bg-white dark:bg-slate-900 text-cyan-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-200'
            }`}
          >
            <span>My PRs</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-400">
              {authoredByMeList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveQueueTab('merged')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeQueueTab === 'merged'
                ? 'bg-white dark:bg-slate-900 text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-200'
            }`}
          >
            <span>Merged</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400">
              {mergedList.length}
            </span>
          </button>
        </div>

        {/* Dropdown Filters */}
        <div className="flex items-center gap-2 text-xs">
          <select
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          >
            <option value="all">All Repositories</option>
            {uniqueRepos.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <select
            value={selectedSla}
            onChange={(e) => setSelectedSla(e.target.value)}
            className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          >
            <option value="all">All SLA Tiers</option>
            <option value="healthy">Healthy (&lt; 24h)</option>
            <option value="at_risk">At Risk (24–48h)</option>
            <option value="breached">Breached (&gt; 48h Bottleneck)</option>
          </select>
        </div>
      </div>

      {/* PR Cards List */}
      <div className="space-y-3">
        {filteredPRs.map((pr) => {
          const isCurrentAuthor = isAuthor(pr);
          const isTeamProj = getPrProjectType(pr) === 'team';
          const sla = getSlaDetails(pr);

          return (
            <div
              key={pr.id}
              className={`p-4 rounded-2xl bg-white dark:bg-slate-900/90 border transition-all ${
                pr.isMerged
                  ? 'border-emerald-500/30 bg-emerald-950/10'
                  : pr.isReviewed
                  ? 'border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50'
                  : 'border-slate-200 dark:border-slate-800 hover:border-brand-500/50 shadow-sm'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left Details */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    pr.isMerged
                      ? 'bg-purple-500/10 text-purple-400'
                      : pr.isReviewed 
                      ? 'bg-emerald-500/10 text-emerald-400' 
                      : 'bg-brand-500/10 text-brand-500'
                  }`}>
                    {pr.isMerged ? <GitMerge className="w-5 h-5" /> : pr.isReviewed ? <CheckCircle2 className="w-5 h-5" /> : <GitPullRequest className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100">
                        #{pr.number}
                      </span>
                      <h4 
                        onClick={() => setSelectedPrForDiff(pr)}
                        className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 hover:text-brand-400 cursor-pointer transition-colors"
                      >
                        {pr.title}
                      </h4>

                      {/* Project Type Badge */}
                      {isTeamProj ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                          <Users className="w-2.5 h-2.5" /> Team Project • Peer Review Required
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" /> Individual Project • Direct Merge
                        </span>
                      )}

                      {/* Review Status Badge */}
                      {pr.isMerged ? (
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
                          Merged & Deployed
                        </span>
                      ) : pr.isReviewed ? (
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          Approved
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                      <span className="font-mono text-slate-500">{pr.repo}</span>
                      <span className="font-mono text-brand-400 bg-brand-500/10 px-1.5 py-0.2 rounded">
                        {pr.branch}
                      </span>
                      <a
                        href={pr.author.githubUrl || `https://github.com/${pr.author.name.toLowerCase().replace(' ', '-')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 hover:text-brand-400 transition-colors group/author"
                        title={pr.author.githubUsername ? `@${pr.author.githubUsername} on GitHub` : pr.author.name}
                      >
                        <img src={pr.author.avatar} alt={pr.author.name} className="w-4 h-4 rounded-full object-cover" />
                        <span>{pr.author.name} {isCurrentAuthor ? '(You)' : ''}</span>
                        {pr.author.githubUsername && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-500 group-hover/author:text-brand-400">
                            <Github className="w-2.5 h-2.5" />
                            @{pr.author.githubUsername}
                          </span>
                        )}
                      </a>
                      <span className="font-mono">
                        <span className="text-emerald-500">+{pr.additions}</span> / <span className="text-rose-500">-{pr.deletions}</span>
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <MessageSquare className="w-3 h-3" />
                        {pr.commentsCount} comments
                      </span>
                      {/* Reviewer avatars with GitHub handles */}
                      {pr.reviewers.length > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="text-slate-500">Assigned Reviewers:</span>
                          {pr.reviewers.map(reviewer => (
                            <a
                              key={reviewer.id}
                              href={reviewer.githubUrl || `https://github.com/${reviewer.name.toLowerCase().replace(' ', '-')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              title={reviewer.githubUsername ? `@${reviewer.githubUsername}` : reviewer.name}
                              className="flex items-center gap-0.5 hover:text-brand-400 transition-colors"
                            >
                              <img src={reviewer.avatar} alt={reviewer.name} className="w-4 h-4 rounded-full object-cover ring-1 ring-slate-700" />
                              {reviewer.githubUsername && (
                                <span className="text-[10px] font-mono text-slate-500 hover:text-brand-400">@{reviewer.githubUsername}</span>
                              )}
                            </a>
                          ))}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Status & Actions */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    {/* SLA Badge: Healthy (<24h), At Risk (24-48h), Breached (>48h) */}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sla.badgeClass}`}>
                      {sla.label}
                    </span>

                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      pr.ciStatus === 'passing'
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : 'text-amber-400 bg-amber-500/10'
                    }`}>
                      CI: {pr.ciStatus}
                    </span>
                  </div>

                  {/* Pair Programming / Complex Review Huddle */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStartHuddle(pr)}
                    icon={<Users className="w-3.5 h-3.5 text-cyan-400" />}
                    title="Launch instant pairing room to inspect diff together live"
                  >
                    Pairing Huddle
                  </Button>

                  {/* Inspect Diff Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPrForDiff(pr)}
                    icon={<Sparkles className="w-3.5 h-3.5 text-purple-400" />}
                  >
                    Inspect Diff & AI
                  </Button>

                  {/* Peer Review Actions */}
                  {isTeamProj ? (
                    // TEAM PROJECT RULES:
                    isCurrentAuthor ? (
                      // Author cannot review their own code in team project
                      !pr.isMerged ? (
                        !pr.isReviewed ? (
                          <div className="flex items-center gap-2">
                            <span 
                              className="text-[11px] font-medium text-amber-400/90 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1.5"
                              title="Author cannot self-review their own PR in a team project. Awaiting teammate review."
                            >
                              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                              Awaiting Peer Review
                            </span>
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled
                              icon={<GitMerge className="w-3.5 h-3.5 text-slate-500" />}
                              title="Requires 1 peer approval before merge into main"
                              className="opacity-50 cursor-not-allowed"
                            >
                              Requires Peer Approval
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span 
                              className="text-[11px] font-medium text-emerald-400/90 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1.5"
                              title={`Approved by ${pr.reviewedBy?.name || 'teammate'}`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Approved {pr.reviewedBy?.name ? `by ${pr.reviewedBy.name}` : ''}
                            </span>
                            <Button
                              variant="primary"
                              size="sm"
                              icon={<GitMerge className="w-3.5 h-3.5" />}
                              onClick={() => handleMerge(pr)}
                              title="Merge approved pull request into main"
                            >
                              Merge to Main
                            </Button>
                          </div>
                        )
                      ) : null
                    ) : (
                      // Teammate reviewing: can Approve or Request Changes (via Diff inspector or direct)
                      !pr.isMerged ? (
                        !pr.isReviewed ? (
                          <Button
                            variant="primary"
                            size="sm"
                            icon={<ThumbsUp className="w-3.5 h-3.5" />}
                            onClick={() => handleApprove(pr)}
                          >
                            Approve
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span 
                              className="text-[11px] font-medium text-emerald-400/90 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Approved {pr.reviewedBy?.name ? `by ${pr.reviewedBy.name}` : ''}
                            </span>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<GitMerge className="w-3.5 h-3.5 text-purple-400" />}
                              onClick={() => handleMerge(pr)}
                            >
                              Squash & Merge
                            </Button>
                          </div>
                        )
                      ) : null
                    )
                  ) : (
                    // INDIVIDUAL PROJECT RULES:
                    // Direct merge allowed
                    !pr.isMerged && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<GitMerge className="w-3.5 h-3.5 text-purple-400" />}
                        onClick={() => handleMerge(pr)}
                      >
                        {pr.isReviewed ? 'Squash & Merge' : 'Direct Merge'}
                      </Button>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredPRs.length === 0 && (
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
            <GitPullRequest className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">No pull requests found</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">All PRs in this queue have been resolved or filtered out.</p>
          </div>
        )}
      </div>

      {/* Diff Inspector Modal */}
      <ErrorBoundary
        fallbackTitle="Failed to load PR Inspector"
        onReset={() => setSelectedPrForDiff(null)}
      >
        <PRDiffInspectorModal
          isOpen={!!selectedPrForDiff}
          onClose={() => setSelectedPrForDiff(null)}
          pr={selectedPrForDiff}
          onApproveSuccess={() => {
            setNotification(`PR #${selectedPrForDiff?.number} approved & marked for automatic merge! 🚀`);
            setTimeout(() => setNotification(null), 3500);
          }}
        />
      </ErrorBoundary>
    </div>
  );
};

export default PRReviewQueue;
