import React, { useState, useEffect } from 'react';
import { 
  X, 
  Rocket, 
  GitBranch, 
  GitCommit, 
  Server, 
  FolderKanban, 
  GitPullRequest, 
  User, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Clock,
  Globe,
  Activity
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { DeploymentEnvironment, DeploymentStatus } from '../../types';

interface NewDeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const NewDeploymentModal: React.FC<NewDeploymentModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { toast } = useToast();

  const [version, setVersion] = useState('');
  const [serviceName, setServiceName] = useState('dmetrics-core-service');
  const [environment, setEnvironment] = useState<DeploymentEnvironment>('production');
  const [status, setStatus] = useState<DeploymentStatus>('success');
  const [branch, setBranch] = useState('main');
  const [commitSha, setCommitSha] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [pullRequestId, setPullRequestId] = useState<string>('');
  const [developerId, setDeveloperId] = useState<string>('');
  const [durationSeconds, setDurationSeconds] = useState<number>(75);
  const [summary, setSummary] = useState('');
  const [url, setUrl] = useState('');
  const [sloPassRate, setSloPassRate] = useState<number>(99.9);

  // Dynamic dropdown references loaded from backend
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [prs, setPrs] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRefs, setIsLoadingRefs] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadReferences = async () => {
      setIsLoadingRefs(true);
      try {
        const [projRes, userRes, prRes] = await Promise.all([
          api.getProjects().catch(() => ({ data: [] })),
          api.getUsers().catch(() => ({ data: [] })),
          api.getPullRequests().catch(() => ({ data: [] })),
        ]);

        const fetchedProjects = Array.isArray(projRes) ? projRes : (projRes.data || []);
        const fetchedUsers = Array.isArray(userRes) ? userRes : (userRes.data || []);
        const fetchedPrs = Array.isArray(prRes) ? prRes : (prRes.data || []);

        setProjects(fetchedProjects);
        setUsers(fetchedUsers);
        setPrs(fetchedPrs);

        if (fetchedProjects.length > 0 && !projectId) {
          setProjectId(fetchedProjects[0].id);
        }
        if (fetchedUsers.length > 0 && !developerId) {
          setDeveloperId(fetchedUsers[0].id);
        }
        if (fetchedPrs.length > 0 && !pullRequestId) {
          setPullRequestId(fetchedPrs[0].id);
          setBranch(fetchedPrs[0].sourceBranch || 'feature/release');
          setCommitMessage(`Merge PR #${fetchedPrs[0].number || 1}: ${fetchedPrs[0].title}`);
          setCommitSha(Math.random().toString(16).substring(2, 9));
        } else {
          setCommitSha(Math.random().toString(16).substring(2, 9));
        }
      } catch (err) {
        console.error('Failed to load references for deployment modal', err);
      } finally {
        setIsLoadingRefs(false);
      }
    };

    loadReferences();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!version.trim()) {
      toast.error('Version is required (e.g. v2.4.1)');
      return;
    }
    if (!serviceName.trim()) {
      toast.error('Service name is required');
      return;
    }
    if (!commitSha.trim()) {
      toast.error('Commit SHA is required');
      return;
    }
    if (!commitMessage.trim()) {
      toast.error('Commit message is required');
      return;
    }

    const selectedUser = users.find((u) => u.id === developerId);
    const selectedProj = projects.find((p) => p.id === projectId);

    const payload = {
      version: version.trim(),
      serviceName: serviceName.trim(),
      environment,
      status,
      branch: branch.trim() || 'main',
      commitSha: commitSha.trim(),
      commitMessage: commitMessage.trim(),
      projectId: projectId || undefined,
      pullRequestId: pullRequestId || undefined,
      developerId: developerId || undefined,
      repositoryUrl: selectedProj?.repoUrl || undefined,
      durationSeconds: Number(durationSeconds) || 60,
      summary: summary.trim() || `${serviceName} release ${version} to ${environment}`,
      url: url.trim() || (environment === 'production' ? 'https://app.innovate.dev' : `https://${environment}.innovate.dev`),
      sloPassRate: Number(sloPassRate) || 99.9,
      author: selectedUser
        ? {
            id: selectedUser.id,
            name: selectedUser.name,
            avatar: selectedUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            email: selectedUser.email,
            username: selectedUser.username,
          }
        : undefined,
    };

    setIsSubmitting(true);
    try {
      await api.createDeployment(payload);
      toast.success(`Deployment ${version} triggered to ${environment}`);
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create deployment');
    } finally {
      setIsSubmitting(false);
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
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-fade-in my-8">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center ring-1 ring-brand-500/20">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Trigger New Deployment</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Register a verified release artifact across target environments
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Row 1: Version & Service Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Release Version <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="e.g. v2.4.1"
                  required
                  className="w-full pl-3 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Service / Cluster Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="e.g. dmetrics-core-service"
                  required
                  className="w-full pl-3 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Environment & Initial Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Environment <span className="text-rose-500">*</span>
              </label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as DeploymentEnvironment)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="production">Production (Live)</option>
                <option value="staging">Staging (Pre-release)</option>
                <option value="development">Development (QA)</option>
                <option value="canary">Canary / Preview</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Deployment Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DeploymentStatus)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="success">Success (Completed)</option>
                <option value="in_progress">In Progress (Active)</option>
                <option value="building">Building (Containerizing)</option>
                <option value="pending">Pending (Queued)</option>
                <option value="failed">Failed (Error Triggered)</option>
              </select>
            </div>
          </div>

          {/* Row 3: Git Branch & Commit SHA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Git Branch <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <GitBranch className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Commit SHA <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <GitCommit className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={commitSha}
                  onChange={(e) => setCommitSha(e.target.value)}
                  placeholder="e.g. 7f8a9b2"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Commit Message */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Commit Message / Headline <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="e.g. Release zero-downtime distributed cache mesh"
              required
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Row 5: Relational Links (Project, PR, Developer) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-brand-500" />
                <span>Linked Project</span>
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Not linked</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.key})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <GitPullRequest className="w-3.5 h-3.5 text-purple-500" />
                <span>Linked Pull Request</span>
              </label>
              <select
                value={pullRequestId}
                onChange={(e) => setPullRequestId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Not linked</option>
                {prs.map((pr) => (
                  <option key={pr.id} value={pr.id}>
                    PR #{pr.number || pr.prNumber}: {pr.title?.substring(0, 24)}...
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-500" />
                <span>Deployer / Author</span>
              </label>
              <select
                value={developerId}
                onChange={(e) => setDeveloperId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Default (Session User)</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 6: Duration, URL & SLO */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Build Duration (sec)
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="number"
                  min="1"
                  max="3600"
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(parseInt(e.target.value, 10) || 60)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Endpoint URL
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://app.innovate.dev"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                SLO Pass Rate (%)
              </label>
              <div className="relative">
                <Activity className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={sloPassRate}
                  onChange={(e) => setSloPassRate(parseFloat(e.target.value) || 99.9)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* Row 7: Summary Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Deployment Summary & Release Notes
            </label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Add release scope, migration notes, or canary verification details..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/25 flex items-center gap-2 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deploying...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>Trigger Deployment</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
