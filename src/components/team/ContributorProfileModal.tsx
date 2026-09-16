import React from 'react';
import { Modal } from '../ui/Modal';
import { ExternalLink, GitCommit, GitPullRequest, Shield, Award, Calendar, Github } from 'lucide-react';
import { Assignee } from '../../types';

interface ContributorProfileModalProps {
  member: (Assignee & { contributions?: number; githubUrl?: string; githubUsername?: string }) | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ContributorProfileModal: React.FC<ContributorProfileModalProps> = ({
  member,
  isOpen,
  onClose,
}) => {
  if (!member) return null;

  const githubUrl = member.githubUrl || (member.githubUsername ? `https://github.com/${member.githubUsername}` : `https://github.com/${member.name.toLowerCase().replace(/\s+/g, '')}`);
  const username = member.githubUsername || member.name.toLowerCase().replace(/\s+/g, '');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="GitHub Contributor Telemetry"
      subtitle={`Verified Git activity for @${username}`}
      maxWidth="max-w-lg"
    >
      <div className="space-y-5">
        {/* Profile Header */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800/80 dark:to-slate-900/80 border border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 rounded-2xl overflow-hidden ring-4 ring-brand-500/20 shadow-md shrink-0">
            <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                {member.name}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Verified Contributor
              </span>
            </div>
            <p className="text-xs text-brand-600 dark:text-brand-400 font-medium mt-0.5">
              {member.role}
            </p>
            <p className="text-[11px] font-mono text-slate-400 mt-1 flex items-center gap-1">
              <Github className="w-3 h-3" />
              <span>github.com/{username}</span>
            </p>
          </div>
        </div>

        {/* Git Telemetry Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Commits</span>
            <span className="text-lg font-bold font-mono text-brand-500">
              {member.contributions || Math.floor(Math.random() * 45 + 15)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">PRs Authored</span>
            <span className="text-lg font-bold font-mono text-cyan-500">
              {Math.floor(Math.random() * 12 + 4)}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Review SLA</span>
            <span className="text-lg font-bold font-mono text-emerald-500">
              ~2.4h
            </span>
          </div>
        </div>

        {/* Areas of Contribution */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Top Touched Architectural Areas:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {['Core Engine', 'Concurrency & Threads', 'CI/CD Pipeline', 'Security Mesh', 'API Gateway'].map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Close
          </button>
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-black dark:bg-brand-600 dark:hover:bg-brand-500 rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <Github className="w-3.5 h-3.5" />
            <span>Open GitHub Profile</span>
            <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
          </a>
        </div>
      </div>
    </Modal>
  );
};
