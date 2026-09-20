import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Sun, 
  Moon, 
  Bell, 
  Menu, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  Activity,
  Layers,
  User,
  LogIn,
  UserPlus,
  LogOut,
  Users,
  ArrowLeftRight,
  ShieldCheck,
  GitPullRequest,
  AlertCircle,
  X,
  Check,
  UserCheck,
  Terminal
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { Button } from '../ui/Button';
import { TimeRange } from '../../types';

interface NavbarProps {
  onOpenMobileMenu: () => void;
  onOpenAiStandup?: () => void;
  onOpenCopilot?: () => void;
  onOpenDeepWork?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenProfile?: () => void;
  onNavigate?: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenMobileMenu, 
  onOpenAiStandup, 
  onOpenCopilot,
  onOpenDeepWork,
  onOpenCommandPalette,
  onOpenProfile,
  onNavigate
}) => {
  const { 
    timeRange, 
    setTimeRange, 
    openCreateModal, 
    isLoading, 
    toggleLoadingState, 
    filters, 
    updateFilter,
    user,
    setUser,
    isAuthenticated,
    logoutUser,
    openAuthModal,
    prs,
    tasks,
    auditEvents,
    deployments,
    openPRInspector,
    openDeploymentDetails,
    openTaskDetails
  } = useDashboard();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifFilterTab, setNotifFilterTab] = useState<'unread' | 'all'>('unread');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Dynamic real engineering alerts & notifications
  const rawNotifications = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      message: string;
      time: string;
      type: 'task_assigned' | 'review' | 'task' | 'deployment' | 'system';
      targetType: 'task' | 'pr' | 'deployment' | 'tab';
      targetObj: any;
      targetTab: string;
      actorAvatar?: string;
    }> = [];

    // 1. Task Assignments (Teammate assigned a task to logged-in user)
    tasks.filter(t => {
      const isMyTask = t.assignee?.id === user?.id || t.assignee?.username === user?.username || t.assignee?.email === user?.email;
      const hasAssigner = t.assigner && t.assigner.id !== user?.id && t.assigner.name !== user?.name;
      return isMyTask && hasAssigner;
    }).forEach(t => {
      items.push({
        id: `assign-${t.id}`,
        title: `Task Assigned by ${t.assigner?.name ? t.assigner.name.split(' ')[0] : t.assigner?.username}`,
        message: `${t.assigner?.name || 'Teammate'} assigned ${t.key}: "${t.title}" to you`,
        time: t.dueDate || 'Active Sprint',
        type: 'task_assigned',
        targetType: 'task',
        targetObj: t,
        targetTab: 'tasks',
        actorAvatar: t.assigner?.avatar
      });
    });

    // 2. Pending PR reviews
    prs.filter(p => !p.isReviewed && !p.isMerged).forEach(pr => {
      items.push({
        id: `pr-${pr.id}`,
        title: `PR Review: #${pr.number}`,
        message: `${pr.title} (${pr.repo})`,
        time: 'Pending Review',
        type: 'review',
        targetType: 'pr',
        targetObj: pr,
        targetTab: 'reviews'
      });
    });

    // 3. Urgent tasks
    tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').forEach(task => {
      items.push({
        id: `task-${task.id}`,
        title: `Urgent Task: ${task.key}`,
        message: task.title,
        time: task.dueDate || 'Due soon',
        type: 'task',
        targetType: 'task',
        targetObj: task,
        targetTab: 'tasks'
      });
    });

    // 4. Deployments Telemetry Alerts
    deployments.slice(0, 3).forEach(dep => {
      const isFailed = dep.status === 'failed' || dep.status === 'cancelled';
      items.push({
        id: `dep-${dep.id}`,
        title: `Deployment ${dep.environment.toUpperCase()}: ${dep.serviceName}`,
        message: `${dep.status === 'success' ? 'Succeeded' : isFailed ? 'Failed' : 'Building'} v${dep.version} - ${dep.commitMessage}`,
        time: 'Telemetry Alert',
        type: 'deployment',
        targetType: 'deployment',
        targetObj: dep,
        targetTab: 'deployments'
      });
    });

    // 5. Recent audit activity
    auditEvents.slice(0, 3).forEach(evt => {
      items.push({
        id: `audit-${evt.id}`,
        title: evt.action,
        message: evt.target,
        time: evt.relativeTime || 'Recently',
        type: 'system',
        targetType: 'tab',
        targetObj: evt,
        targetTab: 'dashboard'
      });
    });

    return items;
  }, [prs, tasks, auditEvents, deployments, user]);

  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(`dmetrics_read_notifs_${user?.id || 'guest'}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch (e) {
      return new Set();
    }
  });

  const unreadNotifications = useMemo(() => {
    return rawNotifications.filter(n => !readIds.has(n.id));
  }, [rawNotifications, readIds]);

  const displayedNotifications = useMemo(() => {
    return notifFilterTab === 'unread' ? unreadNotifications : rawNotifications;
  }, [notifFilterTab, unreadNotifications, rawNotifications]);

  const markAllAsRead = () => {
    const allIds = new Set([...readIds, ...rawNotifications.map(n => n.id)]);
    setReadIds(allIds);
    localStorage.setItem(`dmetrics_read_notifs_${user?.id || 'guest'}`, JSON.stringify(Array.from(allIds)));
    toast.success('All notifications marked as read', 'Alerts Cleared');
  };

  const dismissNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = new Set(readIds);
    updated.add(id);
    setReadIds(updated);
    localStorage.setItem(`dmetrics_read_notifs_${user?.id || 'guest'}`, JSON.stringify(Array.from(updated)));
  };

  const handleNotificationClick = (item: any) => {
    const updated = new Set(readIds);
    updated.add(item.id);
    setReadIds(updated);
    localStorage.setItem(`dmetrics_read_notifs_${user?.id || 'guest'}`, JSON.stringify(Array.from(updated)));
    setShowNotifications(false);

    if (item.targetType === 'task' && item.targetObj) {
      openTaskDetails(item.targetObj);
    } else if (item.targetType === 'pr' && item.targetObj) {
      openPRInspector(item.targetObj);
    } else if (item.targetType === 'deployment' && item.targetObj) {
      openDeploymentDetails(item.targetObj);
    } else if (onNavigate) {
      onNavigate(item.targetTab);
    }
  };

  const timeRanges: { id: TimeRange; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'sprint', label: 'Sprint' },
    { id: 'month', label: 'Monthly' },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile trigger & Global Quick Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full flex items-center">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks, commits, keys... (Press '/' to search)"
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full pl-9 pr-16 py-1.5 text-xs sm:text-sm bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
          />
          {filters.search ? (
            <button
              onClick={() => updateFilter('search', '')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>
          ) : onOpenCommandPalette ? (
            <button
              onClick={onOpenCommandPalette}
              title="Open Universal Command Palette (Ctrl + K)"
              className="hidden sm:flex items-center gap-0.5 absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-400 dark:text-slate-400 bg-slate-200 dark:bg-slate-800 hover:bg-brand-500/20 hover:text-brand-400 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 transition-colors"
            >
              <kbd>Ctrl</kbd>+<kbd>K</kbd>
            </button>
          ) : null}
        </div>
      </div>

      {/* Right Controls: Time Range Selector, Simulator Pill, AI Copilot, Notifications, Theme, New Task */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Time range pills (desktop) */}
        <div className="hidden md:flex items-center p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs">
          {timeRanges.map((r) => (
            <button
              key={r.id}
              onClick={() => setTimeRange(r.id)}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                timeRange === r.id
                  ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Loading State Simulator Pill for Evaluation */}
        <button
          onClick={toggleLoadingState}
          title="Toggle Skeleton Loading State to evaluate component loading behavior"
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            isLoading
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 animate-pulse'
              : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Simulating Load...' : 'Simulate Load'}</span>
        </button>

        {/* DMetrics AI Developer Copilot Trigger */}
        {(onOpenCopilot || onOpenAiStandup) && (
          <button
            onClick={onOpenCopilot || onOpenAiStandup}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-500/15 via-brand-500/15 to-indigo-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 hover:border-purple-500/50 shadow-sm hover:shadow-purple-500/20 transition-all"
            title="Open DMetrics Developer Copilot (Ctrl+J)"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>
        )}

        {/* Deep Work Focus Timer Trigger */}
        {onOpenDeepWork && (
          <button
            onClick={onOpenDeepWork}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-500/15 to-emerald-500/15 text-indigo-600 dark:text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 shadow-sm hover:shadow-emerald-500/20 transition-all"
            title="Start Deep Work Pomodoro Focus Session"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Deep Work</span>
          </button>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications.length > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-brand-500 text-white text-[9px] font-mono font-bold flex items-center justify-center animate-pulse">
                {unreadNotifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div 
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-3.5 animate-slide-down space-y-2"
              onMouseLeave={() => setShowNotifications(false)}
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">Notifications Center</span>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px]">
                    <button
                      type="button"
                      onClick={() => setNotifFilterTab('unread')}
                      className={`px-2 py-0.5 rounded-md font-semibold transition ${notifFilterTab === 'unread' ? 'bg-white dark:bg-slate-700 text-brand-500 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                      Unread ({unreadNotifications.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotifFilterTab('all')}
                      className={`px-2 py-0.5 rounded-md font-semibold transition ${notifFilterTab === 'all' ? 'bg-white dark:bg-slate-700 text-brand-500 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                      All ({rawNotifications.length})
                    </button>
                  </div>
                </div>
                {unreadNotifications.length > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-[11px] text-brand-500 hover:text-brand-400 font-medium transition flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>Mark read</span>
                  </button>
                )}
              </div>

              {displayedNotifications.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {notifFilterTab === 'unread' ? 'All caught up!' : 'No notifications found'}
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
                    {notifFilterTab === 'unread' ? 'No unread task assignments, PR reviews, or deployment alerts.' : 'Activity will appear here as your team collaborates.'}
                  </p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-100 dark:divide-slate-800/60">
                  {displayedNotifications.map((notif) => {
                    const isRead = readIds.has(notif.id);
                    const Icon = notif.type === 'review'
                      ? GitPullRequest
                      : notif.type === 'task_assigned'
                      ? UserCheck
                      : notif.type === 'task'
                      ? AlertCircle
                      : notif.type === 'deployment'
                      ? Terminal
                      : Activity;

                    const iconColor = notif.type === 'review'
                      ? 'text-purple-400 bg-purple-500/10'
                      : notif.type === 'task_assigned'
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : notif.type === 'task'
                      ? 'text-amber-400 bg-amber-500/10'
                      : notif.type === 'deployment'
                      ? 'text-blue-400 bg-blue-500/10'
                      : 'text-brand-400 bg-brand-500/10';

                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`flex items-start gap-2.5 p-2 rounded-xl transition cursor-pointer group pt-2.5 ${
                          isRead
                            ? 'opacity-65 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            : 'bg-brand-500/5 dark:bg-brand-500/10 border border-brand-500/20 hover:bg-brand-500/10 dark:hover:bg-brand-500/20'
                        }`}
                      >
                        {notif.actorAvatar ? (
                          <img
                            src={notif.actorAvatar}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5 border border-brand-500/30"
                          />
                        ) : (
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${iconColor}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-xs font-semibold truncate group-hover:text-brand-500 transition-colors ${
                              isRead ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-slate-100 font-bold'
                            }`}>
                              {notif.title}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">
                              {notif.time}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                            {notif.message}
                          </p>
                        </div>
                        {!isRead && (
                          <button
                            type="button"
                            onClick={(e) => dismissNotification(notif.id, e)}
                            title="Mark as read"
                            className="text-slate-400 hover:text-slate-200 p-1 rounded opacity-0 group-hover:opacity-100 transition"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Create Task Button */}
        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={openCreateModal}
          className="hidden sm:inline-flex"
        >
          New Task
        </Button>

        {/* Sign In Button for Guests */}
        {!isAuthenticated && (
          <Button
            variant="outline"
            size="sm"
            icon={<LogIn className="w-4 h-4 text-brand-500" />}
            onClick={() => openAuthModal('login')}
            className="hidden sm:inline-flex border-brand-500/40 text-brand-600 dark:text-brand-400 hover:bg-brand-500/10 font-semibold"
          >
            Sign In
          </Button>
        )}

        {/* Interactive Profile Avatar Button & Popover */}
        <div className="relative hidden sm:block">
          <button
            type="button"
            onClick={() => {
              setShowProfileMenu(prev => !prev);
            }}
            className={`flex items-center gap-1.5 p-0.5 rounded-full transition-all cursor-pointer focus:outline-none ${
              isAuthenticated ? 'hover:ring-2 hover:ring-brand-500' : 'hover:ring-2 hover:ring-amber-500'
            }`}
            title={isAuthenticated ? `${user.name} - Developer Profile & Accounts` : 'Guest Session - Click to Sign In'}
            aria-label="Developer profile menu"
          >
            <div className={`w-8 h-8 rounded-full overflow-hidden ring-2 shrink-0 shadow-sm ${
              isAuthenticated ? 'ring-brand-500/40' : 'ring-amber-500/40'
            }`}>
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            </div>
          </button>

          {showProfileMenu && (
            <div 
              className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 z-50 animate-fade-in space-y-3"
              onMouseLeave={() => setShowProfileMenu(false)}
            >
              {isAuthenticated ? (
                /* Authenticated User View */
                <>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-500">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Active Session</span>
                    </div>
                    <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded font-medium">
                      JWT Authenticated
                    </span>
                  </div>

                  {/* User profile brief */}
                  <div className="flex items-center gap-3 pt-1 pb-1">
                    <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-brand-500/40 shrink-0">
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{user.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.role}</p>
                      <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>

                  {user.focusStatus && (
                    <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-[11px] text-brand-600 dark:text-brand-400 font-medium">
                      {user.focusStatus}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{user.productivityScore}%</div>
                      <div className="text-[10px] text-slate-500">Productivity</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{user.activeStreak} Days</div>
                      <div className="text-[10px] text-slate-500">Active Streak</div>
                    </div>
                  </div>

                  {/* Action Buttons: View Profile, Switch User, Sign Out */}
                  <div className="pt-2 space-y-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        if (onOpenProfile) onOpenProfile();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>View Full Profile</span>
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          openAuthModal('login');
                        }}
                        className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200/80 dark:border-slate-700 transition"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5 text-brand-500" />
                        <span>Switch Account</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          logoutUser();
                          setShowProfileMenu(false);
                        }}
                        className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-500/20 transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          openAuthModal('register');
                        }}
                        className="text-[11px] text-slate-400 hover:text-brand-500 dark:hover:text-brand-400 transition"
                      >
                        + Register Developer Account
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                /* Unauthenticated Guest View */
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-500">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Guest Session</span>
                    </div>
                    <span className="text-[10px] font-mono bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded font-medium">
                      Unauthenticated
                    </span>
                  </div>

                  <div className="py-1">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Guest Developer</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      You are in read-only guest mode. Sign in with your developer account or register to unlock full project orchestration.
                    </p>
                  </div>

                  <div className="pt-2 space-y-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        openAuthModal('login');
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-sm transition"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Sign In to Account</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        openAuthModal('register');
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200/80 dark:border-slate-700 transition"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-purple-500" />
                      <span>Register Developer Account</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
