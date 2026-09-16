import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { PullRequestItem } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { api } from '../../services/api';
import { 
  GitPullRequest, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Terminal, 
  Copy, 
  Check, 
  MessageSquare, 
  ThumbsUp, 
  ShieldCheck, 
  Zap, 
  Bug,
  GitBranch,
  Users,
  AlertCircle
} from 'lucide-react';

interface PRDiffInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  pr: PullRequestItem | null;
  onApproveSuccess?: () => void;
}

export const PRDiffInspectorModal: React.FC<PRDiffInspectorModalProps> = ({
  isOpen,
  onClose,
  pr,
  onApproveSuccess
}) => {
  const { approvePR, requestChangesPR, user, projects, createPairingRoom } = useDashboard();
  const [commentText, setCommentText] = useState('');
  const [copiedCli, setCopiedCli] = useState(false);
  const [activeTab, setActiveTab] = useState<'diff' | 'ai'>('diff');
  const [decisionFeedback, setDecisionFeedback] = useState<string | null>(null);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [liveAiInsights, setLiveAiInsights] = useState<{
    summary?: string;
    performance: string[];
    security: string[];
    testing: string[];
  } | null>(null);

  if (!pr) return null;

  // --- Safe fallbacks for GitHub-imported PRs that lack optional fields ---
  const prNum = pr.number || 101;
  const diffSnippetText = pr.diffSnippet || `+// No diff available for PR "${pr.title}"\n+// This PR was imported from GitHub and does not have a local diff snapshot.\n`;
  const authorAvatar = pr.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(pr.author?.name || 'GitHub')}&background=6366f1&color=fff&size=64`;
  const authorName = pr.author?.name || pr.author?.username || 'GitHub Contributor';
  const filesChangedCount = pr.filesChangedCount ?? 0;
  const additions = pr.additions ?? 0;
  const deletions = pr.deletions ?? 0;
  const ciStatus = pr.ciStatus || 'passing';
  const branch = pr.branch || 'main';
  const repo = pr.repo || '';

  const defaultAiInsights = {
    summary: undefined as string | undefined,
    performance: ['No performance data — run AI audit to generate insights.'],
    security: ['No security data — run AI audit to generate insights.'],
    testing: ['No test coverage data — run AI audit to generate insights.'],
  };
  // -----------------------------------------------------------------------

  const isCurrentAuthor = Boolean(
    user && (
      (pr.author?.id && (pr.author.id === user.id || pr.author.id === user.email)) ||
      (user.username && pr.author?.username && pr.author.username.toLowerCase() === user.username.toLowerCase()) ||
      (user.name && pr.author?.name && pr.author.name.toLowerCase() === user.name.toLowerCase())
    )
  );

  const isTeamProject = (() => {
    if (pr.projectType) return pr.projectType === 'team';
    const proj = projects.find(p => 
      p.id === pr.projectId ||
      (p.repoUrl && p.repoUrl.replace(/^https?:\/\/github\.com\//i, '').toLowerCase() === repo.toLowerCase()) ||
      repo.toLowerCase().includes(p.key.toLowerCase()) ||
      pr.title.toUpperCase().includes(`[${p.key.toUpperCase()}]`)
    );
    return (proj?.projectType || 'team') === 'team';
  })();

  const handleRunAiAudit = async () => {
    if (!pr) return;
    setIsAnalyzingAi(true);
    try {
      const result = await api.aiPRReview(prNum, pr.title, diffSnippetText);
      if (result) {
        setLiveAiInsights({
          summary: result.summary,
          performance: result.performance,
          security: result.security,
          testing: result.testing,
        });
        setDecisionFeedback(
          result.isAiGenerated
            ? 'OpenAI (GPT-4o-mini) completed live code diff audit!'
            : 'Heuristic code audit completed!'
        );
        setTimeout(() => setDecisionFeedback(null), 3500);
      }
    } catch (e) {
      setDecisionFeedback('Failed to run AI audit. Verify server is running.');
      setTimeout(() => setDecisionFeedback(null), 3000);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const handleCopyCli = () => {
    navigator.clipboard.writeText(`gh pr checkout ${prNum}`);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const handleStartHuddle = () => {
    createPairingRoom(
      `PR #${prNum} Live Review`,
      `Reviewing diff & heuristics on ${branch}`,
      branch
    );
    setDecisionFeedback('Instant Pairing Room launched! Teammates can join live from Team Lobby.');
    setTimeout(() => setDecisionFeedback(null), 3500);
  };

  const handleApplyAiComment = (suggestion: string) => {
    setCommentText(prev => (prev ? `${prev}\n\n• ${suggestion}` : `• ${suggestion}`));
    setDecisionFeedback('Suggested recommendation appended to your review comment!');
    setTimeout(() => setDecisionFeedback(null), 2500);
  };

  const handleApprove = () => {
    if (isTeamProject && isCurrentAuthor) {
      setDecisionFeedback('Authors cannot self-approve their own PRs in Team Projects. A peer review is required.');
      setTimeout(() => setDecisionFeedback(null), 3500);
      return;
    }
    approvePR(pr.id, commentText);
    setDecisionFeedback('Pull Request approved! Ready for merge.');
    setTimeout(() => {
      setDecisionFeedback(null);
      onClose();
      if (onApproveSuccess) onApproveSuccess();
    }, 700);
  };

  const handleRequestChanges = () => {
    if (!commentText.trim()) {
      setDecisionFeedback('Please provide review notes explaining requested changes.');
      return;
    }
    requestChangesPR(pr.id, commentText);
    setDecisionFeedback('Changes requested. Author notified and SLA flagged At Risk.');
    setTimeout(() => {
      setDecisionFeedback(null);
      onClose();
    }, 700);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`PR #${prNum}: ${pr.title}`} maxWidth="max-w-4xl">
      <div className="space-y-4">
        {/* Author Self-Review Warning Banner */}
        {isTeamProject && isCurrentAuthor && (
          <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-2.5 animate-slide-down">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Author Self-Review Policy:</strong> In Team Projects, you cannot approve your own code. Your Project Lead and teammates have been automatically assigned to review this PR.
            </span>
          </div>
        )}

        {/* Meta Bar */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <img src={authorAvatar} alt={authorName} className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {authorName} {isCurrentAuthor ? '(You)' : ''}
                </span>
                <span className="font-mono text-[11px] text-slate-500">• {repo}</span>
                {isTeamProject ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                    Team Project
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                    Individual Project
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-0.5">
                <span className="text-emerald-500 font-semibold">+{additions}</span>
                <span className="text-rose-500 font-semibold">-{deletions}</span>
                <span>• {filesChangedCount} files changed</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartHuddle}
              icon={<Users className="w-3.5 h-3.5 text-cyan-400" />}
              title="Launch pairing huddle with teammates"
            >
              Start Pairing Huddle
            </Button>

            <button
              onClick={handleCopyCli}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
              title="Copy GitHub CLI checkout command"
            >
              <Terminal className="w-3.5 h-3.5 text-brand-400" />
              <span>gh pr checkout {prNum}</span>
              {copiedCli ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            </button>
          </div>
        </div>

        {/* View Mode Tabs: Diff vs AI Insights */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('diff')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'diff'
                  ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Unified Git Diff ({filesChangedCount} Files)
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'ai'
                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>AI Heuristic Analysis</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-400">
            Branch: <strong className="text-slate-300">{branch}</strong>
          </span>
        </div>

        {/* TAB 1: CODE DIFF VIEW */}
        {activeTab === 'diff' && (
          <div className="space-y-3 animate-fade-in">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto max-h-72">
              <pre className="text-slate-300 leading-relaxed whitespace-pre font-mono">
                {diffSnippetText.split('\n').map((line, idx) => {
                  const isAdd = line.startsWith('+') && !line.startsWith('+++');
                  const isDel = line.startsWith('-') && !line.startsWith('---');
                  const isHunk = line.startsWith('@@');

                  return (
                    <div
                      key={idx}
                      className={`px-2 py-0.5 rounded ${
                        isAdd
                          ? 'bg-emerald-950/60 text-emerald-300 border-l-2 border-emerald-500'
                          : isDel
                          ? 'bg-rose-950/60 text-rose-300 border-l-2 border-rose-500'
                          : isHunk
                          ? 'text-cyan-400 font-semibold bg-slate-900/60'
                          : 'text-slate-400'
                      }`}
                    >
                      {line}
                    </div>
                  );
                })}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 2: AI HEURISTICS PANEL */}
        {activeTab === 'ai' && (() => {
          const insights = liveAiInsights || pr.aiInsights || defaultAiInsights;
          return (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/30 border border-purple-800/40">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-semibold text-purple-200">
                    {liveAiInsights ? 'OpenAI GPT-4o-mini Evaluation' : 'AI Automated PR Audit'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRunAiAudit}
                  disabled={isAnalyzingAi}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-sm transition disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isAnalyzingAi ? 'animate-spin' : ''}`} />
                  {isAnalyzingAi ? 'Analyzing with OpenAI...' : '⚡ Re-analyze with OpenAI'}
                </button>
              </div>

              {liveAiInsights?.summary && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                  <strong className="text-purple-300">Executive Summary:</strong> {liveAiInsights.summary}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Performance */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Performance & Latency</span>
                  </div>
                  <div className="space-y-2 text-[11px] text-slate-300">
                    {(Array.isArray(insights?.performance) ? insights.performance : defaultAiInsights.performance).map((item, i) => (
                      <div key={i} className="p-2 rounded bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between gap-1.5">
                        <p>{item}</p>
                        <button
                          type="button"
                          onClick={() => handleApplyAiComment(item)}
                          className="self-end text-[10px] text-brand-400 hover:underline font-mono"
                        >
                          + Insert as comment
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Security */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Zero-Trust Security</span>
                  </div>
                  <div className="space-y-2 text-[11px] text-slate-300">
                    {(Array.isArray(insights?.security) ? insights.security : defaultAiInsights.security).map((item, i) => (
                      <div key={i} className="p-2 rounded bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between gap-1.5">
                        <p>{item}</p>
                        <button
                          type="button"
                          onClick={() => handleApplyAiComment(item)}
                          className="self-end text-[10px] text-brand-400 hover:underline font-mono"
                        >
                          + Insert as comment
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Testing */}
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-xs">
                    <Bug className="w-3.5 h-3.5" />
                    <span>Test Coverage Guard</span>
                  </div>
                  <div className="space-y-2 text-[11px] text-slate-300">
                    {(Array.isArray(insights?.testing) ? insights.testing : defaultAiInsights.testing).map((item, i) => (
                      <div key={i} className="p-2 rounded bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between gap-1.5">
                        <p>{item}</p>
                        <button
                          type="button"
                          onClick={() => handleApplyAiComment(item)}
                          className="self-end text-[10px] text-brand-400 hover:underline font-mono"
                        >
                          + Insert as comment
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Feedback Alert if any */}
        {decisionFeedback && (
          <div className="p-2.5 rounded-xl bg-brand-500/20 border border-brand-500/40 text-brand-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-400" />
            <span>{decisionFeedback}</span>
          </div>
        )}

        {/* Review Comment Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-brand-500" />
            Review Summary & Discussion Notes
          </label>
          <textarea
            rows={3}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add review feedback, praise, or requested modifications (Markdown supported)..."
            className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none"
          />
        </div>

        {/* Review Decision Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {isTeamProject && isCurrentAuthor ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  Self-review not permitted (Awaiting peer review)
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled
                  className="opacity-50 cursor-not-allowed"
                  title="Team Projects require a peer review before approval"
                >
                  Peer Approval Required
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRequestChanges}
                  icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                  className="flex-1 sm:flex-initial"
                >
                  Request Changes
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleApprove}
                  icon={<ThumbsUp className="w-3.5 h-3.5" />}
                  className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-500 border-emerald-500"
                >
                  Approve Pull Request
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
