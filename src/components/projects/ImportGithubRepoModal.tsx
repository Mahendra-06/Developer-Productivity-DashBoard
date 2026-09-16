import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Github, Sparkles, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

interface ImportGithubRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_REPOS = [
  { name: 'React Core', repo: 'facebook/react', desc: 'UI library architecture' },
  { name: 'Next.js App', repo: 'vercel/next.js', desc: 'Full-stack React framework' },
  { name: 'Tailwind CSS', repo: 'tailwindlabs/tailwindcss', desc: 'Utility-first styling' },
];

export const ImportGithubRepoModal: React.FC<ImportGithubRepoModalProps> = ({ isOpen, onClose }) => {
  const { syncGithubRepository, setViewMode } = useDashboard();
  const [repoUrl, setRepoUrl] = useState('facebook/react');
  const [githubToken, setGithubToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImport = async (targetRepo?: string) => {
    const toSync = targetRepo || repoUrl;
    if (!toSync.trim()) {
      setError('Please enter a valid GitHub repository (e.g. owner/repo or full URL)');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await syncGithubRepository(toSync.trim());
      // Switch view mode to overview or kanban so user immediately sees live metrics
      setViewMode('kanban');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to import repository from GitHub.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Connect Real GitHub Repository"
      subtitle="Ingest live commits, contributors, pull requests, and issues directly from GitHub"
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Github className="w-4 h-4 text-slate-400" />
            <span>Repository Identifier or Full URL</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. facebook/react or https://github.com/owner/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 font-mono"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Accepts <code className="text-brand-500">owner/repo</code>, HTTPS URLs, or SSH clone URLs.
          </p>
        </div>

        {/* Quick Presets */}
        <div>
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            1-Click Popular Repositories
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {PRESET_REPOS.map((preset) => (
              <button
                key={preset.repo}
                type="button"
                onClick={() => {
                  setRepoUrl(preset.repo);
                  handleImport(preset.repo);
                }}
                disabled={isLoading}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:border-brand-500/50 hover:bg-brand-500/5 transition-all text-left group"
              >
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block group-hover:text-brand-500">
                  {preset.name}
                </span>
                <span className="text-[10px] font-mono text-slate-400 block truncate">
                  {preset.repo}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Optional Token for Private Repos */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Private Repository Token (Optional)</span>
            <span className="text-[10px] text-slate-400">Higher rate limit</span>
          </div>
          <input
            type="password"
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (Optional)"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            disabled={isLoading}
            className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 font-mono focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Automatic Git Telemetry Analysis</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleImport()}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 disabled:opacity-60 rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Ingesting GitHub...</span>
                </>
              ) : (
                <>
                  <span>Import & Analyze</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
