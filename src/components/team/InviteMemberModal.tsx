import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { 
  Mail, 
  User, 
  AtSign, 
  Briefcase, 
  Github, 
  FolderGit2, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
}

const ROLES = [
  'Staff Software Engineer',
  'Senior Full-Stack Engineer',
  'Frontend Engineer',
  'Backend Systems Engineer',
  'DevOps & Cloud Architect',
  'Tech Lead / Engineering Manager',
  'Security & Infrastructure Engineer',
  'Junior Software Engineer',
];

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  defaultProjectId
}) => {
  const { projects, addTeamMember } = useDashboard();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('Senior Full-Stack Engineer');
  const [githubUsername, setGithubUsername] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [initialTaskTitle, setInitialTaskTitle] = useState('');
  const [storyPoints, setStoryPoints] = useState<number>(3);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ name: string; email: string } | null>(null);

  const resetForm = () => {
    setName('');
    setEmail('');
    setUsername('');
    setRole('Senior Full-Stack Engineer');
    setGithubUsername('');
    setProjectId(defaultProjectId || '');
    setInitialTaskTitle('');
    setErrorMessage(null);
    setSuccessInfo(null);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    setErrorMessage(null);
    if (!username || username === name.toLowerCase().replace(/[^a-z0-9]/g, '_')) {
      setUsername(val.toLowerCase().replace(/[^a-z0-9]/g, '_'));
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !email.trim()) {
      setErrorMessage('Please enter both Full Name and Work Email.');
      return;
    }

    setIsLoading(true);
    try {
      await addTeamMember({
        name: name.trim(),
        email: email.trim(),
        username: username.trim() || name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_'),
        role,
        githubUsername: githubUsername.trim() || undefined,
        projectId: projectId || undefined,
        initialTaskTitle: initialTaskTitle.trim() || undefined,
        storyPoints,
      });

      setSuccessInfo({ name: name.trim(), email: email.trim() });
      setTimeout(() => {
        resetForm();
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Invite member error:', err);
      const message = err?.message || 'Failed to onboard team member. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const previewAvatar = githubUsername.trim()
    ? `https://github.com/${githubUsername.trim().replace(/^https?:\/\/github\.com\//i, '')}.png`
    : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username || name || 'developer')}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { resetForm(); onClose(); }}
      title="Onboard Team Member & Assign Work"
      subtitle="Add an existing developer to your workspace with project assignment and deliverable tracking."
      maxWidth="max-w-xl"
    >
      {successInfo ? (
        <div className="py-8 text-center space-y-3 animate-fade-in">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-base font-bold text-white">Teammate Successfully Added!</h3>
          <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
            <span className="font-semibold text-brand-300">{successInfo.name}</span> has been linked to your team and workspace lobby.
          </p>
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 inline-block text-left">
            <div>Member: <span className="text-emerald-400">{successInfo.email}</span></div>
            <div>Status: <span className="text-emerald-400">Linked to Team</span></div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Inline Error Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              <div className="text-xs leading-relaxed">
                <span className="font-semibold text-rose-200">Unable to invite member: </span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Identity Preview Card */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-brand-500/10 via-purple-500/10 to-transparent border border-brand-500/20 flex items-center gap-3.5">
            <div className="relative shrink-0">
              <img
                src={previewAvatar}
                alt="Teammate avatar"
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-brand-500/40 shadow bg-slate-800"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username || 'dev')}`;
                }}
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-slate-950 flex items-center justify-center">
                <CheckCircle2 className="w-2 h-2 text-white" />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-white truncate">
                  {name.trim() || 'New Teammate'}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 font-semibold border border-brand-500/30">
                  @{username.trim() || 'handle'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[11px] text-slate-400 font-medium">
                  {role}
                </span>
                {githubUsername.trim() && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 flex items-center gap-1">
                    <Github className="w-2.5 h-2.5" />
                    {githubUsername.trim().replace(/^https?:\/\/github\.com\//i, '')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Elena Rostova"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Work Email <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="elena@dmetrics.dev"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Handle & Workspace Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Developer Handle <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <AtSign className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="elena_dev"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setErrorMessage(null); }}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Engineering Role <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Briefcase className="w-3.5 h-3.5" />
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition cursor-pointer"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* GitHub Integration */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Github className="w-3.5 h-3.5 text-slate-400" />
                <span>Personal GitHub Username</span>
              </span>
              <span className="text-[10px] text-brand-400 font-mono">Links avatar & git PRs</span>
            </label>
            <input
              type="text"
              placeholder="e.g. facebook or octocat"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition font-mono"
            />
          </div>

          {/* Initial Project Allocation & Work Assignment */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <FolderGit2 className="w-3.5 h-3.5 text-brand-400" />
                <span>Initial Project & Work Allocation</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">Reflects in Lobby</span>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Assign to Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition cursor-pointer"
              >
                <option value="">Unassigned (General Workspace)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.key})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Initial Deliverable / Task Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Architect Event-Driven Message Queue"
                  value={initialTaskTitle}
                  onChange={(e) => setInitialTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Story Points
                </label>
                <select
                  value={storyPoints}
                  onChange={(e) => setStoryPoints(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition cursor-pointer"
                >
                  <option value={1}>1 Point (Minor)</option>
                  <option value={2}>2 Points (Quick)</option>
                  <option value={3}>3 Points (Standard)</option>
                  <option value={5}>5 Points (Medium)</option>
                  <option value={8}>8 Points (Major)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => { resetForm(); onClose(); }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isLoading}
              className="gap-2 shadow-brand-500/20 shadow-md bg-brand-600 hover:bg-brand-500"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Onboarding Teammate...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Onboard Teammate to Workspace</span>
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
