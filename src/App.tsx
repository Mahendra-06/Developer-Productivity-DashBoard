import React, { useState, useEffect } from 'react';
import { useDashboard } from './context/DashboardContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { MetricCard } from './components/dashboard/MetricCard';
import { ActivityHeatmap } from './components/dashboard/ActivityHeatmap';
import { VelocityChart } from './components/dashboard/VelocityChart';
import { CategoryBreakdown } from './components/dashboard/CategoryBreakdown';
import { LucidPipelineFlowDiagram } from './components/dashboard/LucidPipelineFlowDiagram';
import { EngineeringRadarMatrix } from './components/dashboard/EngineeringRadarMatrix';
import { SprintVelocityAreaChart } from './components/dashboard/SprintVelocityAreaChart';
import { WorkCategoryPieChart } from './components/dashboard/WorkCategoryPieChart';
import { TaskPipelineHistogram } from './components/dashboard/TaskPipelineHistogram';
import { PRHealthDistribution } from './components/dashboard/PRHealthDistribution';
import { ProjectsHealthMesh } from './components/dashboard/ProjectsHealthMesh';
import { RecentActivityFeed } from './components/dashboard/RecentActivityFeed';
import { TaskKanban } from './components/tasks/TaskKanban';
import { TaskListView } from './components/tasks/TaskListView';
import { TaskFilterBar } from './components/tasks/TaskFilterBar';
import { TaskModal } from './components/tasks/TaskModal';
import { ProjectList } from './components/projects/ProjectList';
import { ProjectCard } from './components/projects/ProjectCard';
import { ProfileSection } from './components/profile/ProfileSection';
import { AIStandupModal } from './components/ai/AIStandupModal';
import { DeveloperCopilotDrawer } from './components/copilot/DeveloperCopilotDrawer';
import { FloatingCopilotButton } from './components/copilot/FloatingCopilotButton';
import { DeepWorkTimerModal } from './components/focus/DeepWorkTimerModal';
import { CommandPalette } from './components/command/CommandPalette';
import { SprintExportModal } from './components/export/SprintExportModal';
import { PRReviewQueue } from './components/reviews/PRReviewQueue';
import { DeploymentsView } from './components/deployments/DeploymentsView';
import { TeamPairingLobby } from './components/pairing/TeamPairingLobby';
import { ActiveHuddleModal } from './components/pairing/ActiveHuddleModal';
import { EngineeringInsightsView } from './components/analytics/EngineeringInsightsView';
import { AuthModal } from './components/auth/AuthModal';
import { AuthPage } from './components/auth/AuthPage';
import { MetricSkeleton, TaskCardSkeleton } from './components/ui/Skeleton';
import { ErrorFallback } from './components/ui/ErrorFallback';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Button } from './components/ui/Button';
import { PRDiffInspectorModal } from './components/reviews/PRDiffInspectorModal';
import { DeploymentDetailsModal } from './components/deployments/DeploymentDetailsModal';
import { 
  Plus, 
  Download,
  KanbanSquare, 
  ListTodo, 
  Layers, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  Shield, 
  ExternalLink,
  ChevronRight,
  Flame,
  AlertCircle,
  Activity,
  User,
  Users
} from 'lucide-react';

export const App: React.FC = () => {
  const { 
    viewMode, 
    setViewMode, 
    isLoading, 
    hasError, 
    retryFetch, 
    metrics, 
    tasks, 
    projects, 
    user,
    isAuthChecking,
    isAuthenticated,
    openCreateModal,
    triggerErrorState,
    isAuthModalOpen,
    authModalMode,
    closeAuthModal,
    filters,
    updateFilter,
    inspectedPR,
    inspectedDeployment,
    closeInspectors,
    activeHuddleRoom,
    setActiveHuddleRoom
  } = useDashboard();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isDeepWorkOpen, setIsDeepWorkOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [taskViewMode, setTaskViewMode] = useState<'board' | 'list'>('board');

  // Global Ctrl + K / Cmd + K and Ctrl + J / Cmd + J listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsCopilotOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. Initial encrypted session verification splash
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans text-slate-100 selection:bg-brand-500/20">
        <div className="flex flex-col items-center space-y-4 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-500 p-0.5 shadow-xl shadow-brand-500/30 ring-2 ring-brand-400/20 animate-pulse">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Activity className="w-7 h-7 text-brand-400 animate-spin" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-base font-black tracking-tight text-white font-mono">DMetrics</h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">Verifying encrypted developer session...</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Strict Authentication Gate: if not authenticated, gate all dashboard content
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const urgentTasks = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 selection:bg-brand-500/20 selection:text-brand-300">
      <div className="flex flex-1 min-h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Mobile Navigation Drawer */}
        <MobileNav
          isOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Navigation Bar */}
          <Navbar 
            onOpenMobileMenu={() => setMobileNavOpen(true)} 
            onOpenCopilot={() => setIsCopilotOpen(true)}
            onOpenAiStandup={() => setIsCopilotOpen(true)}
            onOpenDeepWork={() => setIsDeepWorkOpen(true)}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            onOpenProfile={() => setActiveTab('profile')}
            onNavigate={setActiveTab}
          />

          {/* Subheader / Breadcrumbs */}
          <div className="px-4 sm:px-8 py-3 border-b border-slate-200 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/30 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Engineering Workspace</span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="capitalize text-brand-600 dark:text-brand-400 font-medium">
                {activeTab === 'dashboard' 
                  ? 'Overview & Metrics' 
                  : (activeTab === 'tasks' || activeTab === 'kanban' || activeTab === 'list')
                  ? 'Sprint Tasks'
                  : activeTab === 'lobby' || activeTab === 'pairing'
                  ? 'Team Pairing Lobby & Radar'
                  : activeTab.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Main Body Container */}
          <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl w-full mx-auto">
            {/* Error State Fallback Banner */}
            {hasError && (
              <ErrorFallback
                title="Service Telemetry Stream Interrupted"
                message="Could not stream real-time CI/CD metrics from Kubernetes clusters. Showing cached state."
                onRetry={retryFetch}
              />
            )}

            {/* TAB: DASHBOARD / OVERVIEW */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6 animate-fade-in">
                {/* Hero Greeting & Status */}
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-brand-900/40 via-slate-900 to-slate-900 border border-brand-500/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-medium mb-3">
                      <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                      <span>{tasks.length > 0 ? 'Active Sprint' : 'No Active Sprint'}</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {isAuthenticated && user?.name ? `Welcome back, ${user.name} 👋` : 'Welcome to DMetrics Engineering Hub 👋'}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
                      {tasks.length > 0 ? (
                        <>
                          You are operating at <strong className="text-emerald-400 font-semibold">{user.productivityScore}% velocity efficiency</strong>. 
                          You have {urgentTasks.length} urgent tasks requiring your review today.
                        </>
                      ) : (
                        <>
                          Workspace initialized with zero deliverables. Ready to define your architecture, import a repository, and create work items.
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 relative z-10">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsExportModalOpen(true)}
                      icon={<Download className="w-4 h-4" />}
                    >
                      Export Sprint
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setActiveTab('kanban');
                        setViewMode('kanban');
                      }}
                      icon={<KanbanSquare className="w-4 h-4" />}
                    >
                      Open Task Board
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={openCreateModal}
                      icon={<Plus className="w-4 h-4" />}
                    >
                      New Work Item
                    </Button>
                  </div>
                </div>

                {/* Real Data Scope Switcher */}
                <div className="flex items-center justify-between flex-wrap gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
                      Dashboard Scope:
                    </span>
                    <button
                      onClick={() => updateFilter('assigneeId', user.id || 'usr_1')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        filters.assigneeId !== 'all'
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>My Work ({tasks.filter(t => t.assignee?.id === user.id || t.assignee?.name === user.name).length})</span>
                    </button>
                    <button
                      onClick={() => updateFilter('assigneeId', 'all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        filters.assigneeId === 'all'
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Team Overview ({tasks.length})</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>
                      {filters.assigneeId !== 'all' ? `Scored to @${user.username || user.name}` : 'Aggregated Team Deliverables'}
                    </span>
                  </div>
                </div>

                {/* Lucid Architecture Pipeline Lifecycle Flow Diagram */}
                <LucidPipelineFlowDiagram onNavigateTab={(tab) => setActiveTab(tab as any)} />

                {/* KPI Metrics Cards Row (or Skeleton loaders) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {isLoading ? (
                    <>
                      <MetricSkeleton />
                      <MetricSkeleton />
                      <MetricSkeleton />
                      <MetricSkeleton />
                    </>
                  ) : (
                    metrics.map((metric) => <MetricCard key={metric.id} data={metric} />)
                  )}
                </div>

                {/* Primary Chart Suite: Live Sprint Velocity Area Burndown & Engineering Radar Matrix */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SprintVelocityAreaChart />
                  <EngineeringRadarMatrix />
                </div>

                {/* Secondary Chart Suite: Work Domain Donut & Pipeline Flow Histogram */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <WorkCategoryPieChart />
                  <TaskPipelineHistogram />
                </div>

                {/* Code Review SLAs & Microservices Delivery Mesh */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <PRHealthDistribution />
                  <ProjectsHealthMesh onNavigateToProjects={() => setActiveTab('projects')} />
                </div>

                {/* Activity & Velocity Matrix */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <ActivityHeatmap />
                  </div>
                  <div className="lg:col-span-2">
                    <RecentActivityFeed />
                  </div>
                </div>

                {/* Urgent & In-Progress Focus Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Current Sprint High-Priority Work Items
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Items requiring immediate attention or review
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab('kanban');
                        setViewMode('kanban');
                      }}
                      className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                    >
                      <span>View All ({tasks.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {inProgressTasks.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-2">
                      <KanbanSquare className="w-8 h-8 text-slate-400 mx-auto" />
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">No high-priority work items in progress</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">All tasks have been cleared. Add work items to start your sprint pipeline.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {inProgressTasks.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] font-mono font-semibold text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded">
                                {task.key}
                              </span>
                              <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                                In Progress
                              </span>
                            </div>
                            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 mb-1">
                              {task.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                              {task.description}
                            </p>
                          </div>

                          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                            <span className="font-mono text-[10px] text-slate-400">{task.storyPoints} Story Points</span>
                            <div className="flex items-center gap-1.5">
                              <img src={task.assignee.avatar} alt={task.assignee.name} className="w-5 h-5 rounded-full object-cover" />
                              <span className="text-[11px] text-slate-600 dark:text-slate-300">{task.assignee.name.split(' ')[0]}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: TASKS (UNIFIED BOARD & LIST) */}
            {(activeTab === 'tasks' || activeTab === 'kanban' || activeTab === 'list') && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      Sprint Tasks & Work Items
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {taskViewMode === 'board' 
                        ? 'Drag and drop cards across engineering pipeline lanes' 
                        : 'Tabular spreadsheet view with quick inline status changers'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* View Switcher: Board vs List */}
                    <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                      <button
                        onClick={() => setTaskViewMode('board')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                          taskViewMode === 'board'
                            ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm font-semibold'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <KanbanSquare className="w-3.5 h-3.5" />
                        <span>Board View</span>
                      </button>
                      <button
                        onClick={() => setTaskViewMode('list')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                          taskViewMode === 'list'
                            ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm font-semibold'
                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <ListTodo className="w-3.5 h-3.5" />
                        <span>List View</span>
                      </button>
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      icon={<Download className="w-4 h-4" />} 
                      onClick={() => setIsExportModalOpen(true)}
                    >
                      Export Sprint
                    </Button>
                    <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
                      Add New Task
                    </Button>
                  </div>
                </div>

                <TaskFilterBar />
                {taskViewMode === 'board' ? <TaskKanban /> : <TaskListView />}
              </div>
            )}

            {/* TAB: PROJECTS */}
            {activeTab === 'projects' && <ProjectList />}

            {/* TAB: PR REVIEWS */}
            {activeTab === 'reviews' && <PRReviewQueue />}

            {/* TAB: DEPLOYMENTS */}
            {activeTab === 'deployments' && <DeploymentsView />}

            {/* TAB: ENGINEERING INSIGHTS & ANALYTICS */}
            {activeTab === 'analytics' && <EngineeringInsightsView />}

            {/* TAB: TEAM PAIRING LOBBY */}
            {(activeTab === 'lobby' || activeTab === 'pairing') && <TeamPairingLobby />}

            {/* TAB: PROFILE & SETTINGS */}
            {activeTab === 'profile' && <ProfileSection />}
          </main>
        </div>
      </div>

      {/* Global Modals */}
      <TaskModal />
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={closeAuthModal}
      />
      <AIStandupModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
      <DeepWorkTimerModal isOpen={isDeepWorkOpen} onClose={() => setIsDeepWorkOpen(false)} />
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenCreateTask={openCreateModal}
        onOpenAiStandup={() => setIsAiModalOpen(true)}
        onOpenDeepWork={() => setIsDeepWorkOpen(true)}
        setActiveTab={setActiveTab}
      />
      <SprintExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* Global Inspectors & Deep Link Target Modals */}
      <ErrorBoundary
        fallbackTitle="Failed to load PR Inspector"
        onReset={closeInspectors}
      >
        <PRDiffInspectorModal
          isOpen={Boolean(inspectedPR)}
          onClose={closeInspectors}
          pr={inspectedPR}
        />
      </ErrorBoundary>
      <ActiveHuddleModal
        isOpen={Boolean(activeHuddleRoom)}
        onClose={() => setActiveHuddleRoom(null)}
        room={activeHuddleRoom}
      />
      <DeploymentDetailsModal
        isOpen={Boolean(inspectedDeployment)}
        onClose={closeInspectors}
        deployment={inspectedDeployment}
        onUpdated={() => {}}
      />

      {/* DMetrics Developer AI Copilot */}
      <DeveloperCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        currentTab={activeTab}
      />
      <FloatingCopilotButton
        isOpen={isCopilotOpen}
        onClick={() => setIsCopilotOpen(true)}
      />
    </div>
  );
};
