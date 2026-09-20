import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  GitPullRequest, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  TrendingUp, 
  Copy, 
  Check, 
  Sparkles,
  GitMerge
} from 'lucide-react';

export const ContributionsShowcase: React.FC = () => {
  const { user, prs } = useDashboard();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'merged' | 'approved'>('all');

  const prContributions = prs
    .filter(p => !p.author || p.author.id === user.id || p.author.name === user.name || p.author.email === user.email)
    .map(p => ({
      id: p.id,
      prNumber: `#${p.id.replace(/\D/g, '').slice(-4) || '101'}`,
      title: p.title,
      impact: p.description || 'Verified pull request deliverable with code changes and automated CI checks.',
      status: p.status === 'merged' ? 'merged' : 'approved',
      additions: p.additions || 0,
      deletions: p.deletions || 0,
      reviewTurnaround: p.turnaroundHours ? `${p.turnaroundHours}h` : (p.waitingHours ? `${p.waitingHours}h` : '--'),
      repo: p.repo || 'origin/main',
      url: p.url || '#'
    }));

  const contributions = (user.contributions && user.contributions.length > 0) ? user.contributions : prContributions;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filtered = contributions.filter(c => {
    if (activeFilter === 'merged') return c.status === 'merged';
    if (activeFilter === 'approved') return c.status === 'approved';
    return true;
  });

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <GitMerge className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              High-Impact Authored Deliveries & RFCs
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Key architectural contributions and pull requests shipped this quarter
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            All ({contributions.length})
          </button>
          <button
            onClick={() => setActiveFilter('merged')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeFilter === 'merged'
                ? 'bg-white dark:bg-slate-900 text-emerald-500 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Merged
          </button>
          <button
            onClick={() => setActiveFilter('approved')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              activeFilter === 'approved'
                ? 'bg-white dark:bg-slate-900 text-purple-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            RFCs
          </button>
        </div>
      </div>

      {/* Contribution Cards */}
      {filtered.length === 0 ? (
        <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          <GitMerge className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-50" />
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {contributions.length === 0 ? 'No authored deliveries or RFCs found' : 'No contributions matching this filter'}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {contributions.length === 0 ? 'Pull requests created or merged in active repositories will appear here automatically.' : 'Try selecting a different filter above.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between hover:border-brand-500/40 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded">
                    {item.prNumber}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    item.status === 'merged'
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {item.status === 'merged' ? 'Merged' : 'RFC Approved'}
                  </span>
                </div>

                <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-brand-400 transition-colors line-clamp-2 mb-1.5">
                  {item.title}
                </h4>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                  {item.impact}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="text-emerald-500 font-semibold">+{item.additions} <span className="text-rose-400">-{item.deletions}</span></span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {item.reviewTurnaround} turnaround
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500 font-mono">{item.repo}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopy(item.id, `${item.prNumber}: ${item.title}`)}
                      className="p-1 rounded text-slate-400 hover:text-brand-400 transition-colors"
                      title="Copy PR Summary"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded text-slate-400 hover:text-brand-400 transition-colors"
                      title="Open on GitHub"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
