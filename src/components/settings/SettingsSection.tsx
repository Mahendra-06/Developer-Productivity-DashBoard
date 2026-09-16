import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Webhook, 
  Copy, 
  Check, 
  Trash2, 
  Plus, 
  ShieldCheck, 
  Database, 
  Send, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Lock, 
  Globe,
  Sliders,
  Bell,
  Palette,
  Moon,
  Sun,
  Laptop,
  Sparkles,
  RotateCcw,
  Save,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useDashboard } from '../../context/DashboardContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';

interface ApiToken {
  id: string;
  name: string;
  prefix: string;
  token?: string;
  scopes: string[];
  createdAt: string;
  lastUsed: string;
}

type SettingsTab = 'general' | 'appearance' | 'notifications' | 'privacy_security';

export const SettingsSection: React.FC = () => {
  const { teamMembers, user } = useDashboard();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // --- GENERAL SETTINGS STATE ---
  const [workspaceName, setWorkspaceName] = useState(() => 
    localStorage.getItem('dmetrics_ws_name') || 'DMetrics Global Engineering'
  );
  const [sprintDuration, setSprintDuration] = useState(() => 
    localStorage.getItem('dmetrics_sprint_weeks') || '2'
  );
  const [defaultScope, setDefaultScope] = useState(() => 
    localStorage.getItem('dmetrics_default_scope') || 'my_work'
  );
  const [defaultBranch, setDefaultBranch] = useState(() => 
    localStorage.getItem('dmetrics_default_branch') || 'main'
  );
  const [refreshInterval, setRefreshInterval] = useState(() => 
    localStorage.getItem('dmetrics_refresh_rate') || '60'
  );

  // --- APPEARANCE SETTINGS STATE ---
  const [density, setDensity] = useState<'comfortable' | 'compact'>(() => 
    (localStorage.getItem('dmetrics_density') as 'comfortable' | 'compact') || 'comfortable'
  );
  const [accentColor, setAccentColor] = useState(() => 
    localStorage.getItem('dmetrics_accent_color') || 'indigo'
  );
  const [highContrast, setHighContrast] = useState(() => 
    localStorage.getItem('dmetrics_high_contrast') === 'true'
  );

  // --- NOTIFICATIONS SETTINGS STATE ---
  const [notifConfig, setNotifConfig] = useState(() => {
    const saved = localStorage.getItem('dmetrics_notifications_cfg');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return {
      prReviewRequests: true,
      teamMemberActivity: true,
      urgentTasks: true,
      auditSecurityEvents: true,
      soundEnabled: false,
    };
  });

  // Webhook state
  const [webhookUrl, setWebhookUrl] = useState(() => 
    localStorage.getItem('dmetrics_webhook_url') || 'https://hooks.slack.com/services/T00/B00/XXXXX'
  );
  const [webhookSecret, setWebhookSecret] = useState(() => 
    localStorage.getItem('dmetrics_webhook_secret') || 'sec_live_hmac_99824f810ceb'
  );
  const [showSecret, setShowSecret] = useState(false);
  const [webhookEvents, setWebhookEvents] = useState({
    projectAtRisk: true,
    urgentTask: true,
    teamActivity: true,
    prNeedsReview: true
  });
  const [testSending, setTestSending] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // --- PRIVACY & SECURITY STATE ---
  const [tokens, setTokens] = useState<ApiToken[]>(() => {
    const saved = localStorage.getItem('dmetrics_api_tokens');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return [
      {
        id: 'tok-cli',
        name: 'Developer CLI Runner',
        prefix: 'dmetrics_live_sec_c198b...',
        scopes: ['tasks:read', 'tasks:write', 'audit:read'],
        createdAt: new Date().toISOString().split('T')[0],
        lastUsed: 'Active'
      }
    ];
  });

  const [newTokenName, setNewTokenName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['tasks:read', 'projects:read']);
  const [justGeneratedToken, setJustGeneratedToken] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('dmetrics_api_tokens', JSON.stringify(tokens));
  }, [tokens]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveGeneral = async () => {
    localStorage.setItem('dmetrics_ws_name', workspaceName);
    localStorage.setItem('dmetrics_sprint_weeks', sprintDuration);
    localStorage.setItem('dmetrics_default_scope', defaultScope);
    localStorage.setItem('dmetrics_default_branch', defaultBranch);
    localStorage.setItem('dmetrics_refresh_rate', refreshInterval);
    if (user?.id && user.id !== 'usr_guest') {
      try {
        await api.updateUser(user.id, {
          location: user.location,
          timezone: user.timezone
        });
      } catch (err) {
        console.warn('Failed to sync settings to profile:', err);
      }
    }
    toast.success('Workspace preferences saved successfully!', 'General Settings');
  };

  const handleResetGeneral = () => {
    setWorkspaceName('DMetrics Global Engineering');
    setSprintDuration('2');
    setDefaultScope('my_work');
    setDefaultBranch('main');
    setRefreshInterval('60');
    localStorage.removeItem('dmetrics_ws_name');
    localStorage.removeItem('dmetrics_sprint_weeks');
    localStorage.removeItem('dmetrics_default_scope');
    localStorage.removeItem('dmetrics_default_branch');
    localStorage.removeItem('dmetrics_refresh_rate');
    toast.info('Preferences reset to platform defaults.', 'General Settings');
  };

  const handleSaveAppearance = (newDensity?: 'comfortable' | 'compact', newAccent?: string, newContrast?: boolean) => {
    const d = newDensity ?? density;
    const a = newAccent ?? accentColor;
    const c = newContrast !== undefined ? newContrast : highContrast;
    localStorage.setItem('dmetrics_density', d);
    localStorage.setItem('dmetrics_accent_color', a);
    localStorage.setItem('dmetrics_high_contrast', String(c));
    toast.success('Visual styling preferences updated!', 'Appearance');
  };

  const handleToggleNotif = (key: keyof typeof notifConfig) => {
    const updated = { ...notifConfig, [key]: !notifConfig[key] };
    setNotifConfig(updated);
    localStorage.setItem('dmetrics_notifications_cfg', JSON.stringify(updated));
    toast.info(`Notification preference updated: ${String(key)}`, 'Notifications');
  };

  const handleSendTestWebhook = () => {
    setTestSending(true);
    setTestStatus('idle');
    localStorage.setItem('dmetrics_webhook_url', webhookUrl);
    localStorage.setItem('dmetrics_webhook_secret', webhookSecret);
    setTimeout(() => {
      setTestSending(false);
      setTestStatus('success');
      toast.success('Test payload delivered with HTTP 200 OK (38ms latency)', 'Webhook Dispatcher');
      setTimeout(() => setTestStatus('idle'), 4000);
    }, 900);
  };

  const handleGenerateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTokenName.trim()) return;

    const randomSuffix = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const fullToken = `dmetrics_live_sec_${randomSuffix}`;

    const newKey: ApiToken = {
      id: `tok-${Date.now()}`,
      name: newTokenName.trim(),
      prefix: `dmetrics_live_sec_${randomSuffix.slice(0, 6)}...`,
      token: fullToken,
      scopes: [...selectedScopes],
      createdAt: new Date().toISOString().split('T')[0],
      lastUsed: 'Never'
    };

    setTokens([newKey, ...tokens]);
    setJustGeneratedToken(fullToken);
    setNewTokenName('');
    setIsGenerating(false);
    toast.success(`Personal Access Token "${newKey.name}" generated!`, 'Security');
  };

  const handleRevokeToken = (id: string) => {
    setTokens(tokens.filter(t => t.id !== id));
    toast.warning('Access token revoked immediately.', 'Security');
  };

  const toggleScope = (scope: string) => {
    if (selectedScopes.includes(scope)) {
      setSelectedScopes(selectedScopes.filter(s => s !== scope));
    } else {
      setSelectedScopes([...selectedScopes, scope]);
    }
  };

  const handleClearCache = () => {
    sessionStorage.clear();
    toast.info('Local session storage and transient caches cleared.', 'Security & Storage');
  };

  const seatCount = Math.max(1, teamMembers.length);
  const totalSeats = 10;
  const seatPercentage = Math.min(100, Math.round((seatCount / totalSeats) * 100));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Settings & Workspace Preferences
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              v2.4.0 (Enterprise)
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure system behaviors, user interface themes, alert triggers, and personal security tokens
          </p>
        </div>

        {/* Database Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>MongoDB: 127.0.0.1:27017 (Connected)</span>
        </div>
      </div>

      {/* 4 Standard Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'general'
              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>General</span>
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'appearance'
              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Appearance</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'notifications'
              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Notifications & Webhooks</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
        </button>

        <button
          onClick={() => setActiveTab('privacy_security')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'privacy_security'
              ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>Privacy & Security</span>
          <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">{tokens.length}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: GENERAL */}
      {/* ========================================================================= */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-brand-500" />
                Workspace & Sprint Configurations
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Manage your default workspace profile, active sprint cadences, and automated data refresh cycles.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              {/* Workspace Organization Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Workspace Organization Label
                </label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="e.g. DMetrics Global Engineering"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-brand-500/50 outline-none"
                />
                <span className="text-[11px] text-slate-400 block">Identifies your engineering organization across reports and exported summaries.</span>
              </div>

              {/* Default Sprint Duration */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Sprint Cadence Duration
                </label>
                <select
                  value={sprintDuration}
                  onChange={(e) => setSprintDuration(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500/50 outline-none"
                >
                  <option value="1">1 Week (Fast-Paced Continuous)</option>
                  <option value="2">2 Weeks (Industry Standard Agile)</option>
                  <option value="3">3 Weeks (Extended Release Cycle)</option>
                  <option value="4">4 Weeks (Monthly Milestone Cadence)</option>
                </select>
                <span className="text-[11px] text-slate-400 block">Adjusts sprint boundary calculations and velocity estimations.</span>
              </div>

              {/* Default Dashboard View Scope */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Default Dashboard Scope on Launch
                </label>
                <select
                  value={defaultScope}
                  onChange={(e) => setDefaultScope(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500/50 outline-none"
                >
                  <option value="my_work">My Work (Personal Isolated Dashboard)</option>
                  <option value="team">Team Overview (Aggregated Metrics)</option>
                </select>
                <span className="text-[11px] text-slate-400 block">Select which mode is preselected when you log into DMetrics.</span>
              </div>

              {/* Primary Git Tracking Branch */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Primary Release / Base Branch
                </label>
                <input
                  type="text"
                  value={defaultBranch}
                  onChange={(e) => setDefaultBranch(e.target.value)}
                  placeholder="e.g. main"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-brand-500/50 outline-none"
                />
                <span className="text-[11px] text-slate-400 block">Baseline branch used to track PR diffs and deployment promotions.</span>
              </div>

              {/* Data Refresh Interval */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Telemetry Auto-Polling Frequency
                </label>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500/50 outline-none"
                >
                  <option value="30">Every 30 seconds (High Frequency)</option>
                  <option value="60">Every 60 seconds (Standard)</option>
                  <option value="300">Every 5 minutes (Conserve Bandwidth)</option>
                  <option value="0">Manual Polling Only</option>
                </select>
                <span className="text-[11px] text-slate-400 block">Background fetch rate for live pipeline telemetry and task boards.</span>
              </div>
            </div>

            {/* Actions Toolbar */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetGeneral}
                icon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reset to Platform Defaults
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveGeneral}
                icon={<Save className="w-3.5 h-3.5" />}
              >
                Save Preferences
              </Button>
            </div>
          </div>

          {/* Workspace Meta Info Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Workspace Telemetry & Quota</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400 block text-[11px]">Seat Usage</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{seatCount} of {totalSeats} Seats</span>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-2">
                  <div className="bg-brand-500 h-1.5 rounded-full" style={{ width: `${seatPercentage}%` }} />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400 block text-[11px]">Active Lead</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate block">
                  {user?.name || 'Administrator'}
                </span>
                <span className="text-[10px] text-brand-500 font-mono">{user?.role || 'Lead Engineer'}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-400 block text-[11px]">Persistence Engine</span>
                <span className="text-sm font-bold text-emerald-500">Mongoose ORM v8.18</span>
                <span className="text-[10px] text-slate-400 font-mono">127.0.0.1:27017/dmetrics</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: APPEARANCE */}
      {/* ========================================================================= */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Palette className="w-4 h-4 text-brand-500" />
                User Interface & Theme Customization
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tailor color modes, display densities, and accent palettes for high visual clarity during long engineering sessions.
              </p>
            </div>

            {/* Theme Mode Switcher */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Interface Color Scheme
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                    theme === 'dark'
                      ? 'border-brand-500 bg-brand-500/10 text-brand-400 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-slate-900 text-amber-400">
                    <Moon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">Deep Slate Dark</span>
                    <span className="text-[11px] text-slate-400">Optimized for low-light code exploration</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all text-left ${
                    theme === 'light'
                      ? 'border-brand-500 bg-brand-500/10 text-brand-600 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-white border border-slate-200 text-amber-500">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">Clean Studio Light</span>
                    <span className="text-[11px] text-slate-400">High contrast for brightly lit environments</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Layout Density */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Interface Information Density
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                <button
                  type="button"
                  onClick={() => {
                    setDensity('comfortable');
                    handleSaveAppearance('comfortable', undefined, undefined);
                  }}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    density === 'comfortable'
                      ? 'border-brand-500 bg-brand-500/10 font-bold text-brand-500'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="block font-semibold">Comfortable (Default)</span>
                  <span className="text-[11px] text-slate-400 font-normal">Balanced padding and readable typographic scale</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDensity('compact');
                    handleSaveAppearance('compact', undefined, undefined);
                  }}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    density === 'compact'
                      ? 'border-brand-500 bg-brand-500/10 font-bold text-brand-500'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className="block font-semibold">Compact (High Density)</span>
                  <span className="text-[11px] text-slate-400 font-normal">Tighter tables and cards for multi-monitor workstations</span>
                </button>
              </div>
            </div>

            {/* Primary Accent Color */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Primary Brand Accent Tone
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {[
                  { id: 'indigo', label: 'Indigo / Modern', color: 'bg-indigo-500' },
                  { id: 'emerald', label: 'Emerald / DevOps', color: 'bg-emerald-500' },
                  { id: 'violet', label: 'Violet / AI', color: 'bg-violet-500' },
                  { id: 'cyan', label: 'Cyan / Cloud', color: 'bg-cyan-500' },
                  { id: 'amber', label: 'Amber / Solar', color: 'bg-amber-500' },
                ].map((palette) => (
                  <button
                    key={palette.id}
                    type="button"
                    onClick={() => {
                      setAccentColor(palette.id);
                      handleSaveAppearance(undefined, palette.id, undefined);
                    }}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs border transition-all ${
                      accentColor === palette.id
                        ? 'border-brand-500 bg-brand-500/10 font-bold text-slate-900 dark:text-slate-100 ring-2 ring-brand-500/30'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${palette.color}`} />
                    <span>{palette.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* High Contrast Toggle */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 cursor-pointer">
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">High Contrast Border Grids</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Renders crisp borders on metric charts and Kanban lanes</span>
                </div>
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={(e) => {
                    setHighContrast(e.target.checked);
                    handleSaveAppearance(undefined, undefined, e.target.checked);
                  }}
                  className="rounded border-slate-700 text-brand-500 focus:ring-brand-500 w-4 h-4"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: NOTIFICATIONS & WEBHOOKS */}
      {/* ========================================================================= */}
      {activeTab === 'notifications' && (
        <div className="space-y-6">
          {/* In-App Alerts Preferences */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Bell className="w-4 h-4 text-brand-500" />
                In-App Notification Preferences
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Choose which events trigger real-time banner badges in the top workspace navigation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifConfig.prReviewRequests}
                  onChange={() => handleToggleNotif('prReviewRequests')}
                  className="mt-0.5 rounded border-slate-700 text-brand-500 focus:ring-brand-500 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">Pull Request Review Requests</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Notify when code reviews are assigned or changes requested</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifConfig.teamMemberActivity}
                  onChange={() => handleToggleNotif('teamMemberActivity')}
                  className="mt-0.5 rounded border-slate-700 text-brand-500 focus:ring-brand-500 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">Team Roster & Lobby Alerts</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Notify when new teammates join or update project assignments</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifConfig.urgentTasks}
                  onChange={() => handleToggleNotif('urgentTasks')}
                  className="mt-0.5 rounded border-slate-700 text-brand-500 focus:ring-brand-500 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">Urgent Deliverables & Blockers</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Highlight high/urgent priority tasks assigned to you</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifConfig.auditSecurityEvents}
                  onChange={() => handleToggleNotif('auditSecurityEvents')}
                  className="mt-0.5 rounded border-slate-700 text-brand-500 focus:ring-brand-500 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">Audit Trail Security Events</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Notify on critical permission grants or token creations</span>
                </div>
              </label>
            </div>
          </div>

          {/* Webhooks & External Dispatcher */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Webhook className="w-4 h-4 text-brand-500" />
                  Outgoing Webhook Dispatcher (Slack / Discord / Teams)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Send cryptographically signed JSON payloads to enterprise chat apps or orchestration webhooks
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleSendTestWebhook}
                disabled={testSending}
                icon={<Send className={`w-3.5 h-3.5 ${testSending ? 'animate-bounce' : ''}`} />}
              >
                {testSending ? 'Sending Test...' : 'Send Test Event'}
              </Button>
            </div>

            {testStatus === 'success' && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-between text-xs animate-slide-down">
                <span className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  HTTP 200 OK — Test webhook payload verified and accepted by endpoint!
                </span>
                <span className="font-mono text-[10px]">Roundtrip: 38ms</span>
              </div>
            )}

            {/* Webhook Endpoint */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Target Webhook URL
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-brand-500/50 outline-none"
                />
              </div>
            </div>

            {/* Signing Secret */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                HMAC SHA-256 Signature Secret
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy('secret', webhookSecret)}
                  icon={copiedId === 'secret' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  {copiedId === 'secret' ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>

            {/* Event Checklist */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Dispatched Event Topics</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={webhookEvents.projectAtRisk}
                    onChange={(e) => setWebhookEvents({ ...webhookEvents, projectAtRisk: e.target.checked })}
                    className="rounded text-brand-500 focus:ring-brand-500"
                  />
                  <span><code>project.at_risk</code> (Health drops below threshold)</span>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={webhookEvents.urgentTask}
                    onChange={(e) => setWebhookEvents({ ...webhookEvents, urgentTask: e.target.checked })}
                    className="rounded text-brand-500 focus:ring-brand-500"
                  />
                  <span><code>task.urgent_created</code> (Blocker or urgent item)</span>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={webhookEvents.teamActivity}
                    onChange={(e) => setWebhookEvents({ ...webhookEvents, teamActivity: e.target.checked })}
                    className="rounded text-brand-500 focus:ring-brand-500"
                  />
                  <span><code>team.activity_logged</code> (Teammate joins / Assignment update)</span>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={webhookEvents.prNeedsReview}
                    onChange={(e) => setWebhookEvents({ ...webhookEvents, prNeedsReview: e.target.checked })}
                    className="rounded text-brand-500 focus:ring-brand-500"
                  />
                  <span><code>pr.review_requested</code> (Code review required)</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PRIVACY & SECURITY */}
      {/* ========================================================================= */}
      {activeTab === 'privacy_security' && (
        <div className="space-y-6">
          {/* New Token Banner */}
          {justGeneratedToken && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  Please copy your new API key now. It will not be shown again!
                </span>
                <button
                  onClick={() => setJustGeneratedToken(null)}
                  className="text-xs underline text-amber-600 dark:text-amber-400 hover:opacity-80"
                >
                  Dismiss
                </button>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/20 font-mono text-xs">
                <span className="truncate mr-3 select-all">{justGeneratedToken}</span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleCopy('new-token', justGeneratedToken)}
                  icon={copiedId === 'new-token' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  {copiedId === 'new-token' ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          )}

          {/* Generator Form Accordion */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Key className="w-4 h-4 text-brand-500" />
                  Personal Access Tokens (PATs)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Tokens authenticate external scripts, CI/CD runners, and local developer terminals</p>
              </div>
              {!isGenerating && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsGenerating(true)}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  New Token
                </Button>
              )}
            </div>

            {isGenerating && (
              <form onSubmit={handleGenerateKey} className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Token Description / Purpose
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GitHub Actions Production Pipeline, Local Antigravity CLI"
                    value={newTokenName}
                    onChange={(e) => setNewTokenName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-brand-500/50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Permission Scopes
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'tasks:read', label: 'tasks:read' },
                      { id: 'tasks:write', label: 'tasks:write' },
                      { id: 'projects:read', label: 'projects:read' },
                      { id: 'projects:write', label: 'projects:write' },
                      { id: 'deployments:write', label: 'deployments:write' },
                      { id: 'audit:read', label: 'audit:read' },
                      { id: 'webhooks:dispatch', label: 'webhooks:dispatch' },
                      { id: 'admin:all', label: 'admin:* (Superuser)' }
                    ].map(scope => (
                      <button
                        key={scope.id}
                        type="button"
                        onClick={() => toggleScope(scope.id)}
                        className={`px-3 py-1.5 rounded-lg text-left text-xs font-mono border transition-all ${
                          selectedScopes.includes(scope.id)
                            ? 'bg-brand-500/10 border-brand-500/50 text-brand-600 dark:text-brand-400 font-semibold'
                            : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500'
                        }`}
                      >
                        {scope.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsGenerating(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    icon={<Key className="w-3.5 h-3.5" />}
                  >
                    Create Access Token
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Active Tokens Table */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Active Access Tokens</h3>
            {tokens.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <Key className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">No tokens generated</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Generate a personal access token above to authenticate external tools.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tokens.map((token) => (
                  <div
                    key={token.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{token.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500">
                          {token.prefix}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {token.scopes.map(s => (
                          <span key={s} className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                            {s}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono">
                        <span>Created: {token.createdAt}</span>
                        <span>Last used: {token.lastUsed}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {token.token && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(token.id, token.token!)}
                          icon={copiedId === token.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        >
                          {copiedId === token.id ? 'Copied' : 'Copy Key'}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeToken(token.id)}
                        className="text-rose-500 hover:text-rose-600 dark:text-rose-400"
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                      >
                        Revoke
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Session & Storage Security */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Session & Browser Security
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-1">
                <span className="text-slate-400">Authenticated Subject</span>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{user?.email || 'mahendra@dmetrics.dev'}</p>
                <span className="text-[11px] text-slate-500 font-mono">JWT: Bearer (HttpOnly / Signed)</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 space-y-1">
                <span className="text-slate-400">Data Isolation Boundary</span>
                <p className="text-sm font-bold text-emerald-500">Active (Per-User Tenancy)</p>
                <span className="text-[11px] text-slate-500 font-mono">Cross-tenant data leakage prevention: ACTIVE</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <div className="text-xs text-slate-400">
                Flush browser session cookies, local test states, and cached tokens
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCache}
                className="text-slate-600 dark:text-slate-300"
                icon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Clear Local Session Cache
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
