import React, { useState } from 'react';
import { 
  X, 
  Rocket, 
  GitBranch, 
  GitCommit, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Loader2, 
  FolderKanban, 
  GitPullRequest, 
  User, 
  Globe, 
  ExternalLink,
  Terminal, 
  ShieldCheck, 
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { DeploymentItem } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface DeploymentDetailsModalProps {
  deployment: DeploymentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const DeploymentDetailsModal: React.FC<DeploymentDetailsModalProps> = ({
  deployment,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const { toast } = useToast();
  const [copiedSha, setCopiedSha] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!isOpen || !deployment) return null;

  const handleCopySha = () => {
    navigator.clipboard.writeText(deployment.commitSha);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
    toast.info('Commit SHA copied to clipboard');
  };

  const handleStatusUpdate = async (newStatus: 'success' | 'failed' | 'cancelled') => {
    setIsUpdatingStatus(true);
    try {
      await api.updateDeployment(deployment.id, { status: newStatus });
      toast.success(`Deployment status updated to ${newStatus}`);
      onUpdated();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update deployment status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Success</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Failed</span>
          </span>
        );
      case 'in_progress':
      case 'building':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
            <span>In Progress</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Pending</span>
          </span>
        );
    }
  };

  const getEnvBadge = (env: string) => {
    switch (env) {
      case 'production':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'staging':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'development':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'canary':
      case 'preview':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Dialog */}
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-fade-in my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center ring-1 ring-brand-500/20 shrink-0 mt-0.5">
              <Rocket className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100">
                  {deployment.version}
                </span>
                <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getEnvBadge(deployment.environment)}`}>
                  {deployment.environment}
                </span>
                {getStatusBadge(deployment.status)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span>Cluster: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{deployment.serviceName}</strong></span>
                <span>•</span>
                <span>ID: <code className="font-mono text-[11px] text-slate-400">{deployment.id}</code></span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Key Telemetry Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">Duration</span>
              <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                <Clock className="w-3.5 h-3.5 text-brand-500" />
                <span>{deployment.durationSeconds}s</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">SLO Pass Rate</span>
              <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{deployment.sloPassRate}%</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">Triggered At</span>
              <span className="text-xs font-medium text-slate-900 dark:text-slate-200 truncate block">
                {deployment.deployedAt || (deployment.createdAt ? new Date(deployment.createdAt).toLocaleDateString() : 'Just now')}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">Live Endpoint</span>
              {deployment.url ? (
                <a
                  href={deployment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-brand-500 hover:text-brand-400 flex items-center gap-1 truncate font-medium"
                >
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">View App</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              ) : (
                <span className="text-xs text-slate-400">Not configured</span>
              )}
            </div>
          </div>

          {/* Commit & Branch Details */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-brand-500" />
              <span>Source Control Revision</span>
            </h3>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {deployment.commitMessage || 'No commit message specified'}
                </p>
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                    <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                    {deployment.branch || 'main'}
                  </span>
                  <span>•</span>
                  <span>Commit: {deployment.commitSha}</span>
                </div>
              </div>

              <button
                onClick={handleCopySha}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 shrink-0 font-mono text-xs transition-colors"
              >
                {copiedSha ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy SHA</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Relational Entity Links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Project */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-brand-500" />
                <span>Linked Project</span>
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {deployment.projectName || (deployment.projectId ? `Project ${deployment.projectId}` : 'Not linked')}
              </p>
            </div>

            {/* Pull Request */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <GitPullRequest className="w-3.5 h-3.5 text-purple-500" />
                <span>Pull Request</span>
              </span>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {deployment.pullRequestId ? `PR ${deployment.pullRequestId}` : 'Not linked'}
              </p>
            </div>

            {/* Author */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-500" />
                <span>Deployed By</span>
              </span>
              <div className="flex items-center gap-2">
                <img
                  src={deployment.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={deployment.author?.name}
                  className="w-5 h-5 rounded-full object-cover ring-1 ring-brand-500/30"
                />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {deployment.author?.name || 'Platform Engineer'}
                </span>
              </div>
            </div>
          </div>

          {/* Deployment Summary */}
          {deployment.summary && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Deployment Summary
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 leading-relaxed">
                {deployment.summary}
              </p>
            </div>
          )}

          {/* Deployment Build Logs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-500" />
                <span>Deployment Pipeline Logs</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-500">
                {deployment.logs && deployment.logs.length > 0 ? `${deployment.logs.length} log lines` : 'Telemetry stream'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-1.5 overflow-x-auto max-h-48 scrollbar-thin">
              {deployment.logs && deployment.logs.length > 0 ? (
                deployment.logs.map((logLine, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <span className="text-slate-600 select-none text-[10px] w-5 text-right">{idx + 1}</span>
                    <span className="text-slate-300 leading-relaxed">{logLine}</span>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-slate-500 text-xs italic">
                  Deployment logs are not available for this deployment.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2">
            {(deployment.status === 'in_progress' || deployment.status === 'building' || deployment.status === 'pending') && (
              <>
                <button
                  disabled={isUpdatingStatus}
                  onClick={() => handleStatusUpdate('success')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Succeeded</span>
                </button>
                <button
                  disabled={isUpdatingStatus}
                  onClick={() => handleStatusUpdate('failed')}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Mark Failed</span>
                </button>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
