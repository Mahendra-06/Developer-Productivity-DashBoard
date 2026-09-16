import React, { useState, useEffect, useCallback } from 'react';
import { 
  Rocket, 
  RefreshCw, 
  Plus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Loader2, 
  GitBranch, 
  GitCommit, 
  Globe, 
  FolderKanban, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Activity,
  Layers,
  Server,
  Zap,
  Filter,
  BarChart3,
  Calendar
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';
import { api } from '../../services/api';
import { 
  DeploymentItem, 
  DeploymentMetricsSummary, 
  DeploymentTrendPoint, 
  DeploymentEnvironmentPoint, 
  DeploymentEnvironment, 
  DeploymentStatus,
  TimeRange 
} from '../../types';
import { NewDeploymentModal } from './NewDeploymentModal';
import { DeploymentDetailsModal } from './DeploymentDetailsModal';
import { useToast } from '../../context/ToastContext';
import { useDashboard } from '../../context/DashboardContext';

export const DeploymentsView: React.FC = () => {
  const { toast } = useToast();
  const { deployments: contextDeployments } = useDashboard();

  // Data states
  const [deployments, setDeployments] = useState<DeploymentItem[]>([]);
  const [metrics, setMetrics] = useState<DeploymentMetricsSummary | null>(null);
  const [trends, setTrends] = useState<DeploymentTrendPoint[]>([]);
  const [environments, setEnvironments] = useState<DeploymentEnvironmentPoint[]>([]);

  // Loading & Error states
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEnv, setSelectedEnv] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('month');

  // Modal states
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [selectedDeployment, setSelectedDeployment] = useState<DeploymentItem | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);

  // Fetch all real deployment telemetry from backend API
  const fetchDeploymentsData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setHasError(false);

    try {
      const [depsRes, metricsRes, trendsRes, envsRes] = await Promise.all([
        api.getDeployments({
          search: searchQuery || undefined,
          environment: selectedEnv !== 'all' ? selectedEnv : undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          timeRange: selectedTimeRange,
        }),
        api.getDeploymentMetrics({ timeRange: selectedTimeRange }),
        api.getDeploymentTrends({ timeRange: selectedTimeRange }),
        api.getDeploymentEnvironments({ timeRange: selectedTimeRange }),
      ]);

      const list = Array.isArray(depsRes) ? depsRes : depsRes?.deployments || [];
      const existingIds = new Set(list.map((d: any) => d.id));
      const combined = [...list, ...contextDeployments.filter(d => !existingIds.has(d.id))];
      setDeployments(combined);
      setMetrics(metricsRes || null);
      setTrends(trendsRes || []);
      setEnvironments(envsRes || []);

      if (isRefresh) {
        toast.info('Deployment metrics refreshed from database');
      }
    } catch (err: any) {
      console.error('Error fetching deployments:', err);
      setHasError(true);
      setErrorMessage(err.message || 'Failed to fetch deployment records from server');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery, selectedEnv, selectedStatus, selectedTimeRange, contextDeployments, toast]);

  useEffect(() => {
    fetchDeploymentsData();
  }, [fetchDeploymentsData]);

  // Reactive CI/CD sync: Immediately reflect any new deployment triggered by PR merge or project creation
  useEffect(() => {
    if (contextDeployments.length > 0) {
      setDeployments(prev => {
        const ids = new Set(prev.map(d => d.id));
        const missing = contextDeployments.filter(d => !ids.has(d.id));
        if (missing.length > 0) {
          return [...missing, ...prev];
        }
        return prev;
      });
    }
  }, [contextDeployments]);

  const handleOpenDetails = (dep: DeploymentItem) => {
    setSelectedDeployment(dep);
    setIsDetailsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Success</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Failed</span>
          </span>
        );
      case 'in_progress':
      case 'building':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
            <span>In Progress</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
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
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. HEADER SECTION */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/70 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30 flex items-center gap-1.5">
                <Rocket className="w-3.5 h-3.5" />
                Release Orchestration &amp; CI/CD Telemetry
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Deployments</h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
              Track and monitor application deployments across all environments.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchDeploymentsData(true)}
              disabled={isRefreshing || isLoading}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
              title="Refetch deployment data from backend"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-brand-400' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <button
              onClick={() => setIsNewModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/25 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Deployment</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. SUMMARY METRIC CARDS (REAL DATABASE-DERIVED NUMBERS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Deployments */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Deployments</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Rocket className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                {isLoading ? '...' : (metrics?.totalDeployments ?? deployments.length)}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">releases</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {metrics ? `${metrics.successfulDeployments} successful • ${metrics.failedDeployments} failed` : 'Calculated from database'}
            </p>
          </div>
        </div>

        {/* 2. Success Rate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Success Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                {isLoading ? '...' : `${metrics?.successRate ?? 0}%`}
              </span>
              <span className="text-xs text-emerald-500 font-mono font-semibold">pass rate</span>
            </div>
            <p className="text-[11px] text-emerald-500 font-medium mt-1">
              {metrics && metrics.totalDeployments > 0 ? 'Verified clean deployments' : 'No release failures'}
            </p>
          </div>
        </div>

        {/* 3. Mean Time to Recovery (MTTR) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Mean Time to Recovery</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                {isLoading ? '...' : `${metrics?.meanTimeToRecoveryMinutes ?? 0}`}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">min</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {metrics && metrics.avgDurationSeconds ? `Avg duration: ${metrics.avgDurationSeconds}s` : 'Incident recovery velocity'}
            </p>
          </div>
        </div>

        {/* 4. Deployment Frequency */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Deployment Frequency</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                {isLoading ? '...' : (metrics?.deploymentFrequency ?? '0/week')}
              </span>
            </div>
            <p className="text-[11px] text-cyan-500 font-medium mt-1">
              DORA Elite standard pace
            </p>
          </div>
        </div>
      </div>

      {/* 3. RECHARTS VISUALIZATION GRID: DEPLOYMENT TREND & ENV DISTRIBUTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Deployment Trend (Recharts Area Chart) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Deployment Trend Over Time</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Release cadence across successful, failed, and in-progress builds</p>
              </div>
            </div>

            {/* Timeframe Switcher */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
              {(['today', 'week', 'sprint', 'month'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTimeRange(t)}
                  className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-all ${
                    selectedTimeRange === t
                      ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 font-semibold shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Recharts Area Chart */}
          <div className="h-64 w-full pt-2">
            {trends.length === 0 || trends.every(t => t.total === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <Rocket className="w-8 h-8 text-slate-400 mb-2 opacity-60" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No deployment trend data recorded yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Trigger a new deployment to populate the real-time velocity curve.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b" 
                    fontSize={10} 
                    tickLine={false}
                    axisLine={{ stroke: '#334155', strokeWidth: 0.5 }}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={10} 
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#334155', 
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#f8fafc',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                    }} 
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="successful" 
                    name="Successful" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorSuccess)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="failed" 
                    name="Failed" 
                    stroke="#f43f5e" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorFailed)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="inProgress" 
                    name="In Progress" 
                    stroke="#6366f1" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorProgress)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right 1 Col: Deployments by Environment (Recharts Bar / Donut) */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Deployments by Environment</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Distribution volume across target environments</p>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            {environments.length === 0 || environments.every(e => e.count === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <Layers className="w-8 h-8 text-slate-400 mb-2 opacity-60" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No environment data yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Records will be grouped by production, staging, and dev.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {environments.map((env) => (
                  <div key={env.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: env.color }} />
                        {env.environment}
                      </span>
                      <span className="font-mono text-slate-500">
                        {env.count} ({env.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${env.percentage}%`,
                          backgroundColor: env.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. RECENT DEPLOYMENTS TABLE & FILTERS */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-5">
        {/* Table Header & Search Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Recent Deployment History
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time audit records of builds, commits, and environment releases
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search version, commit, author..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Environment Filter */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
              {['all', 'production', 'staging', 'development', 'canary'].map((env) => (
                <button
                  key={env}
                  onClick={() => setSelectedEnv(env)}
                  className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-all ${
                    selectedEnv === env
                      ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 font-semibold shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {env === 'all' ? 'All Envs' : env}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
              {['all', 'success', 'in_progress', 'failed'].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2.5 py-1 rounded-lg capitalize font-medium transition-all ${
                    selectedStatus === st
                      ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 font-semibold shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {st === 'all' ? 'All Status' : st === 'in_progress' ? 'In Progress' : st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error State */}
        {hasError && (
          <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
            <h4 className="text-sm font-semibold text-rose-300">Unable to load deployment records</h4>
            <p className="text-xs text-rose-400/80">{errorMessage}</p>
            <button
              onClick={() => fetchDeploymentsData()}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !hasError && (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/40 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !hasError && deployments.length === 0 && (
          <div className="p-12 text-center space-y-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto ring-1 ring-brand-500/20">
              <Rocket className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">No deployments yet</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                No deployment events matched your active filters or database records. Trigger a deployment to start your telemetry feed.
              </p>
            </div>
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 mx-auto transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Deployment</span>
            </button>
          </div>
        )}

        {/* Table Rows */}
        {!isLoading && !hasError && deployments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pl-2">Version &amp; Service</th>
                  <th className="pb-3">Environment</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Commit &amp; Branch</th>
                  <th className="pb-3">Author</th>
                  <th className="pb-3">Duration</th>
                  <th className="pb-3">Deployed At</th>
                  <th className="pb-3 pr-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {deployments.map((dep) => (
                  <tr
                    key={dep.id}
                    onClick={() => handleOpenDetails(dep)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    {/* Version & Service */}
                    <td className="py-3.5 pl-2">
                      <div className="font-mono font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-400 transition-colors">
                        {dep.version}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                        {dep.serviceName}
                      </div>
                    </td>

                    {/* Environment */}
                    <td className="py-3.5">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getEnvBadge(dep.environment)}`}>
                        {dep.environment}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5">
                      {getStatusBadge(dep.status)}
                    </td>

                    {/* Commit & Branch */}
                    <td className="py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold max-w-[200px] truncate">
                        <GitCommit className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{dep.commitMessage || dep.commitSha}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                        <GitBranch className="w-3 h-3 text-slate-500" />
                        <span>{dep.branch || 'main'}</span>
                        <span>•</span>
                        <span>{dep.commitSha?.substring(0, 7)}</span>
                      </div>
                    </td>

                    {/* Author */}
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <img
                          src={dep.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                          alt={dep.author?.name}
                          className="w-5 h-5 rounded-full object-cover ring-1 ring-brand-500/30 shrink-0"
                        />
                        <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[100px]">
                          {dep.author?.name?.split(' ')[0] || 'Engineer'}
                        </span>
                      </div>
                    </td>

                    {/* Duration */}
                    <td className="py-3.5 font-mono text-slate-500">
                      {dep.durationSeconds}s
                    </td>

                    {/* Deployed At */}
                    <td className="py-3.5 text-slate-500 text-[11px]">
                      {dep.deployedAt || (dep.createdAt ? new Date(dep.createdAt).toLocaleDateString() : 'Just now')}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 pr-2 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetails(dep);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-500 dark:hover:text-brand-400 transition-colors inline-flex items-center gap-1 text-[11px] font-semibold"
                      >
                        <span>Details</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODALS */}
      <NewDeploymentModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreated={() => fetchDeploymentsData(true)}
      />

      <DeploymentDetailsModal
        deployment={selectedDeployment}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedDeployment(null);
        }}
        onUpdated={() => fetchDeploymentsData(true)}
      />
    </div>
  );
};
