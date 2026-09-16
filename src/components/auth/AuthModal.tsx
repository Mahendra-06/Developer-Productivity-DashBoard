import React, { useState, useEffect } from 'react';
import { 
  LogIn, 
  UserPlus, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Github, 
  Key, 
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  User,
  Mail,
  AtSign,
  Briefcase
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useDashboard } from '../../context/DashboardContext';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
}

const ENGINEERING_ROLES = [
  'Staff Software Engineer',
  'Senior Full-Stack Engineer',
  'Frontend Engineer',
  'Backend Systems Engineer',
  'DevOps & Cloud Architect',
  'Tech Lead / Engineering Manager',
  'Security & Infrastructure Engineer',
  'Junior Software Engineer',
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
}) => {
  const { loginUser, registerUser } = useDashboard();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialMode);
  
  // Login State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regRole, setRegRole] = useState('Senior Full-Stack Engineer');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  
  // GitHub Integration State
  const [githubUsername, setGithubUsername] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [useCustomAvatar, setUseCustomAvatar] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Sync mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialMode);
      setErrorMessage('');
    }
  }, [isOpen, initialMode]);

  // Compute live preview avatar
  const previewAvatar = useCustomAvatar && customAvatarUrl.trim()
    ? customAvatarUrl.trim()
    : githubUsername.trim()
    ? `https://github.com/${githubUsername.trim()}.png`
    : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(regUsername.trim() || regName.trim() || 'developer')}`;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setErrorMessage('Please enter your email/username and password.');
      return;
    }

    setIsLoading(true);
    try {
      await loginUser({
        login: loginIdentifier.trim(),
        password: loginPassword.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!regName.trim() || regName.trim().length < 2) {
      setErrorMessage('Full name must be at least 2 characters.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!regUsername.trim() || regUsername.trim().length < 2) {
      setErrorMessage('Username must be at least 2 characters.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    try {
      await registerUser({
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        username: regUsername.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_'),
        role: regRole,
        password: regPassword,
        avatar: previewAvatar,
        githubUsername: githubUsername.trim() || undefined,
        githubToken: githubToken.trim() || undefined,
      });

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Username or email may already be registered.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={activeTab === 'login' ? 'Developer Authentication' : 'Create Developer Identity'}
      subtitle={
        activeTab === 'login'
          ? 'Sign in to access your synchronized engineering workspace and personal telemetry.'
          : 'Register your engineering profile to become the active developer across all dashboards.'
      }
      maxWidth={activeTab === 'register' ? 'max-w-xl' : 'max-w-md'}
    >
      <div className="space-y-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setErrorMessage(''); }}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'login'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('register'); setErrorMessage(''); }}
            className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'register'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200/60 dark:border-slate-700/60'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register Developer</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: Sign In */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Email or Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="name@dmetrics.dev or username"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  tabIndex={-1}
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500"
                />
                <span>Remember session</span>
              </label>
              <span className="text-[11px] text-brand-500 flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                JWT Encrypted
              </span>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isLoading}
                className="w-full justify-center gap-2 shadow-brand-500/20 shadow-md py-2.5"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Workspace</span>
                  </>
                )}
              </Button>
            </div>

            <div className="pt-2 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Don't have a developer identity yet?{' '}
                <button
                  type="button"
                  onClick={() => { setActiveTab('register'); setErrorMessage(''); }}
                  className="text-brand-500 hover:text-brand-400 font-semibold underline underline-offset-2 ml-1"
                >
                  Register new identity
                </button>
              </p>
            </div>
          </form>
        )}

        {/* TAB 2: Register Developer Identity */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 max-h-[70vh] overflow-y-auto pr-1">
            {/* Identity & Avatar Live Preview Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-brand-500/10 via-purple-500/10 to-transparent border border-brand-500/20 flex items-center gap-4">
              <div className="relative shrink-0">
                <img
                  src={previewAvatar}
                  alt="Avatar preview"
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-brand-500/40 shadow-md bg-slate-800"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(regUsername || 'dev')}`;
                  }}
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-slate-900 flex items-center justify-center">
                  <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {regName.trim() || 'New Developer'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-300 font-semibold border border-brand-500/30">
                    @{regUsername.trim() || 'handle'}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {regRole}
                  </span>
                  {githubUsername.trim() && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Github className="w-3 h-3" />
                      {githubUsername.trim()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Core Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maya Lin"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Workspace Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="maya@dmetrics.dev"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Username & Role Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Developer Handle <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <AtSign className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="mayalin_dev"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Workspace Role <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition cursor-pointer"
                  >
                    {ENGINEERING_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* GitHub Integration Box */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/70 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Github className="w-3.5 h-3.5 text-slate-900 dark:text-slate-100" />
                  <span>Link GitHub Profile (Optional)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Enables live telemetry & repos
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    GitHub Username
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. torvalds"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center justify-between">
                    <span>Personal Access Token</span>
                    <span className="text-[10px] text-amber-500 font-mono">Optional</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="ghp_••••••••••••"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition font-mono"
                    />
                    <Key className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-tight">
                Providing your GitHub handle will automatically sync your avatar, commit activity, and scoped work.
              </p>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 6 chars"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    tabIndex={-1}
                  >
                    {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  required
                  placeholder="Repeat password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition"
                />
              </div>
            </div>

            {/* Custom Avatar Toggle */}
            <div className="pt-1">
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={useCustomAvatar}
                    onChange={(e) => setUseCustomAvatar(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500"
                  />
                  <span>Provide custom avatar URL</span>
                </label>
              </div>

              {useCustomAvatar && (
                <div className="mt-2 animate-fade-in">
                  <input
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={customAvatarUrl}
                    onChange={(e) => setCustomAvatarUrl(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 font-mono"
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isLoading}
                className="w-full justify-center gap-2 shadow-brand-500/20 shadow-md py-2.5"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Registering & Authenticating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Create Developer Identity & Authenticate</span>
                  </>
                )}
              </Button>
            </div>

            <div className="text-center pt-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => { setActiveTab('login'); setErrorMessage(''); }}
                  className="text-brand-500 hover:text-brand-400 font-semibold underline underline-offset-2 ml-1"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
