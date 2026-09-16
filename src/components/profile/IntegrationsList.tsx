import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import {
  Github,
  CheckSquare,
  GitPullRequest,
  Activity,
  Boxes,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Settings
} from 'lucide-react';
import { Button } from '../ui/Button';
import { GitHubTeamSyncModal } from './GitHubTeamSyncModal';

export const IntegrationsList: React.FC = () => {
  const { user, toggleIntegration, syncIntegration } = useDashboard();
  const [syncingAll, setSyncingAll] = React.useState(false);
  const [isGitHubSyncOpen, setIsGitHubSyncOpen] = useState(false);

  const getIntegrationIcon = (name: string) => {
    switch (name) {
      case 'Github': return <Github className="w-5 h-5" />;
      case 'CheckSquare': return <CheckSquare className="w-5 h-5" />;
      case 'GitPullRequest': return <GitPullRequest className="w-5 h-5" />;
      case 'Activity': return <Activity className="w-5 h-5" />;
      case 'Container': default: return <Boxes className="w-5 h-5" />;
    }
  };

  const handleSyncAll = () => {
    setSyncingAll(true);
    user.integrations.forEach(i => syncIntegration(i.id));
    setTimeout(() => setSyncingAll(false), 1200);
  };

  const activeCount = user.integrations.filter(i => i.connected).length;

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Connected Developer Tooling & Integrations</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Manage telemetry sync webhooks and OAuth providers</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-800/60 w-fit">
            {activeCount} Active Webhooks
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncAll}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${syncingAll ? 'animate-spin' : ''}`} />}
          >
            {syncingAll ? 'Syncing...' : 'Sync All'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
        {user.integrations.map((integ) => (
          <div
            key={integ.id}
            className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-3 group hover:border-brand-500/40 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-700/80 text-slate-800 dark:text-slate-200 flex items-center justify-center shrink-0">
                {getIntegrationIcon(integ.icon)}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{integ.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${integ.connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                  <span className="text-[10px] text-slate-400 font-mono">{integ.syncStatus}</span>
                  <span className="text-[10px] text-slate-500">• {integ.lastSync}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {integ.connected && (
                <button
                  onClick={() => syncIntegration(integ.id)}
                  className="text-slate-400 hover:text-brand-400 p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Sync telemetry now"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${integ.syncStatus === 'Syncing...' ? 'animate-spin text-brand-400' : ''}`} />
                </button>
              )}
              {integ.name === 'GitHub Enterprise' && integ.connected && (
                <button
                  onClick={() => setIsGitHubSyncOpen(true)}
                  className="text-slate-400 hover:text-brand-400 p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  title="Configure team roster & repository mapping"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => toggleIntegration(integ.id)}
                className={`text-[10px] font-mono px-2 py-1 rounded transition-colors ${
                  integ.connected 
                    ? 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10' 
                    : 'text-brand-400 bg-brand-500/10 hover:bg-brand-500/20'
                }`}
                title={integ.connected ? 'Disconnect webhook' : 'Connect webhook'}
              >
                {integ.connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <GitHubTeamSyncModal isOpen={isGitHubSyncOpen} onClose={() => setIsGitHubSyncOpen(false)} />
    </div>
  );
};

export default IntegrationsList;
