import React, { useState } from 'react';
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
  Briefcase,
  Activity,
  Zap,
  GitPullRequest,
  BarChart3,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useDashboard } from '../../context/DashboardContext';

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

export const AuthPage: React.FC = () => {
  const { loginUser, registerUser } = useDashboard();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Sign In Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regRole, setRegRole] = useState('Staff Software Engineer');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // GitHub & Avatar State
  const [githubUsername, setGithubUsername] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [useCustomAvatar, setUseCustomAvatar] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Live avatar resolution
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
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your credentials or register a new identity.');
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
      setErrorMessage('Please enter a valid workspace email address.');
      return;
    }
    if (!regUsername.trim() || regUsername.trim().length < 2) {
      setErrorMessage('Developer handle must be at least 2 characters.');
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
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Username or email may already exist.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col lg:flex-row relative overflow-hidden font-sans selection:bg-brand-500/20 selection:text-brand-300">
      {/* Dynamic Background Mesh Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/15 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* LEFT PANEL: Branding, Value Prop & Live Telemetry Highlights */}
      <div className="lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative z-10 border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-slate-900/40 backdrop-blur-xl">
        <div>
          {/* Header & Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-500 p-0.5 shadow-lg shadow-brand-500/30 ring-2 ring-brand-400/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-brand-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white font-mono">DMetrics</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 font-bold">
                  v2.4 Live
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Developer Productivity & Engineering Intelligence</p>
            </div>
          </div>

          {/* Core Tagline */}
          <div className="space-y-4 max-w-lg mb-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Real Data. <br />
              <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                Genuine Engineering
              </span>{' '}
              Velocity.
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Connect your developer profile, link your personal GitHub contributions, and orchestrate deliverables without mock presets or dummy data.
            </p>
          </div>

          {/* Feature Showcase Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-lg">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-sm hover:border-brand-500/30 transition group">
              <div className="w-8 h-8 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400 mb-2.5 group-hover:scale-105 transition-transform">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-200 mb-1">Active Identity Scoping</h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Your authenticated profile anchors all dashboards, tasks, and velocity metrics in real time.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-sm hover:border-purple-500/30 transition group">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-2.5 group-hover:scale-105 transition-transform">
                <Github className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-200 mb-1">Direct GitHub Pipeline</h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Import repositories directly to ingest true pull requests, commit trees, and genuine contributors.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-sm hover:border-cyan-500/30 transition group">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-2.5 group-hover:scale-105 transition-transform">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-200 mb-1">Zero Dummy Presets</h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Strict authentication wall ensures only genuine accounts and live project deliverables populate the system.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-sm hover:border-emerald-500/30 transition group">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2.5 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-200 mb-1">JWT Authenticated Mesh</h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                Encrypted bearer tokens, role-based access control, and developer API key generation.
              </p>
            </div>
          </div>
        </div>

        {/* Footer info pill */}
        <div className="mt-8 pt-6 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Telemetry Service Online</span>
          </span>
          <span className="font-mono text-[11px]">Protected by DMetrics Auth Wall</span>
        </div>
      </div>

      {/* RIGHT PANEL: Auth Gatekeeper Form */}
      <div className="lg:w-1/2 p-6 sm:p-12 lg:p-16 flex items-center justify-center relative z-10">
        <div className="w-full max-w-md space-y-6">
          {/* Form Header & Tabs */}
          <div className="space-y-4">
            <div className="text-center sm:text-left">
              <span className="text-[11px] font-mono uppercase tracking-widest text-brand-400 font-bold">
                Authentication Gate
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                {activeTab === 'login' ? 'Sign In to Workspace' : 'Create Developer Profile'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {activeTab === 'login'
                  ? 'Enter your credentials to decrypt session and access telemetry.'
                  : 'Register your developer identity to orchestrate projects and sprints.'}
              </p>
            </div>

            {/* Tab Pill Switcher */}
            <div className="flex items-center p-1 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setErrorMessage(''); }}
                className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'login'
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
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
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Register Developer</span>
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email or Developer Handle
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="name@dmetrics.dev or handle"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-900/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-900/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition"
                    tabIndex={-1}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-brand-600 focus:ring-brand-500"
                  />
                  <span>Remember session</span>
                </label>
                <span className="text-[11px] text-brand-400 flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  JWT Signed
                </span>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isLoading}
                  className="w-full justify-center gap-2 shadow-brand-500/25 shadow-lg py-3 text-sm font-bold bg-brand-600 hover:bg-brand-500"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Authenticating Developer...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Enter Engineering Workspace</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="pt-4 text-center border-t border-slate-800/60">
                <p className="text-xs text-slate-400">
                  First time here?{' '}
                  <button
                    type="button"
                    onClick={() => { setActiveTab('register'); setErrorMessage(''); }}
                    className="text-brand-400 hover:text-brand-300 font-bold ml-1 transition"
                  >
                    Register developer profile &rarr;
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              {/* Identity & Live Avatar Preview */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-brand-500/10 via-purple-500/10 to-transparent border border-brand-500/20 flex items-center gap-3.5">
                <div className="relative shrink-0">
                  <img
                    src={previewAvatar}
                    alt="Developer Avatar"
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-brand-500/40 shadow-md bg-slate-800"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(regUsername || 'developer')}`;
                    }}
                  />
                  <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-slate-950 flex items-center justify-center">
                    <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white truncate">
                      {regName.trim() || 'New Developer'}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-300 font-semibold border border-brand-500/30">
                      @{regUsername.trim() || 'handle'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {regRole}
                    </span>
                    {githubUsername.trim() && (
                      <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-800 text-slate-300 flex items-center gap-1">
                        <Github className="w-2.5 h-2.5" />
                        {githubUsername.trim()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Full Name & Workspace Email */}
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
                      placeholder="e.g. Maya Lin"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Workspace Email <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="maya@dmetrics.dev"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Developer Handle & Role Selector */}
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
                      placeholder="mayalin_dev"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Workspace Role <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Briefcase className="w-3.5 h-3.5" />
                    </div>
                    <select
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900/80 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition cursor-pointer"
                    >
                      {ENGINEERING_ROLES.map((role) => (
                        <option key={role} value={role} className="bg-slate-900 text-slate-100">
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* GitHub Linkage */}
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Github className="w-3.5 h-3.5 text-slate-300" />
                    <span>Personal GitHub Handle</span>
                  </span>
                  <span className="text-[10px] text-brand-400 font-mono">Live Avatar Sync</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="e.g. torvalds"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition font-mono"
                  />
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="Optional PAT token"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition font-mono"
                    />
                    <Key className="w-3 h-3 text-slate-500 absolute left-2.5 top-2" />
                  </div>
                </div>
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 6 chars"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-900/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                      tabIndex={-1}
                    >
                      {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Confirm Password <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    placeholder="Repeat password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-900/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition"
                  />
                </div>
              </div>

              {/* Custom avatar toggle */}
              <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-0.5">
                <input
                  type="checkbox"
                  id="customAvatarToggle"
                  checked={useCustomAvatar}
                  onChange={(e) => setUseCustomAvatar(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-800 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="customAvatarToggle" className="cursor-pointer select-none">
                  Provide custom image URL
                </label>
              </div>

              {useCustomAvatar && (
                <input
                  type="url"
                  placeholder="https://images.example.com/avatar.jpg"
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition font-mono"
                />
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isLoading}
                  className="w-full justify-center gap-2 shadow-brand-500/25 shadow-lg py-3 text-sm font-bold bg-brand-600 hover:bg-brand-500"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating Developer Identity...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Create Profile & Launch Workspace</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="pt-3 text-center border-t border-slate-800/60">
                <p className="text-xs text-slate-400">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => { setActiveTab('login'); setErrorMessage(''); }}
                    className="text-brand-400 hover:text-brand-300 font-bold ml-1 transition"
                  >
                    Sign in here &rarr;
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
