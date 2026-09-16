import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  KanbanSquare, 
  ListTodo, 
  FolderKanban, 
  BarChart3, 
  UserCheck, 
  Flame, 
  ChevronLeft, 
  ChevronRight, 
  Cpu, 
  GitPullRequest,
  Radio,
  Rocket,
  ShieldAlert, 
  Zap,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { ViewMode } from '../../types';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  activeTab,
  setActiveTab
}) => {
  const { user, tasks, projects, prs, presences, auditEvents, setViewMode } = useDashboard();

  const userTasks = user && user.id && user.id !== 'usr_guest'
    ? tasks.filter(t => t.assignee?.id === user.id || (user.email && t.assignee?.email === user.email) || (user.username && t.assignee?.username === user.username))
    : tasks;
  const inProgressCount = userTasks.filter(t => t.status === 'in_progress').length;
  const pendingPRsCount = prs.filter(p => !p.isReviewed && !p.isMerged).length;
  const freeLobbyCount = presences.filter(p => p.status === 'available').length;

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, badge: undefined },
    { id: 'tasks', label: 'Tasks', icon: KanbanSquare, badge: inProgressCount > 0 ? `${inProgressCount}` : userTasks.length > 0 ? `${userTasks.length}` : undefined },
    { id: 'projects', label: 'Projects', icon: FolderKanban, badge: projects.length > 0 ? `${projects.length}` : undefined },
    { id: 'reviews', label: 'PR Reviews', icon: GitPullRequest, badge: pendingPRsCount > 0 ? `${pendingPRsCount} Pending` : undefined },
    { id: 'deployments', label: 'Deployments', icon: Rocket, badge: undefined },
    { id: 'lobby', label: 'Team Lobby', icon: Radio, badge: freeLobbyCount > 0 ? `${freeLobbyCount} Free` : undefined },
    { id: 'analytics', label: 'Engineering Insights', icon: BarChart3, badge: undefined },
    { id: 'profile', label: 'Developer Profile', icon: UserCheck, badge: undefined },
  ];


  const handleNavClick = (id: string) => {
    setActiveTab(id);
    if (id === 'tasks') {
      setViewMode('kanban');
    } else if (id === 'projects' || id === 'analytics') {
      setViewMode(id as ViewMode);
    }
  };

  return (
    <aside
      className={`hidden lg:flex flex-col border-r border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950 transition-all duration-300 z-20 shrink-0 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center gap-3 overflow-hidden">
          <img 
            src="/logo.png" 
            alt="DMetrics Logo" 
            className="w-9 h-9 rounded-xl object-cover shadow-md shadow-brand-600/30 shrink-0 ring-1 ring-white/10" 
          />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                DMetrics <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-500 font-semibold">v1.0</span>
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Engineering Hub</span>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-900 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className={`px-2 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider ${collapsed ? 'text-center' : ''}`}>
          {collapsed ? '•••' : 'Platform Navigation'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                isActive
                  ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-brand-500" />
              )}
              <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-brand-500' : 'text-slate-500 dark:text-slate-400'}`} />
              {!collapsed && (
                <span className="flex-1 text-left truncate">{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                  item.badge === 'Live'
                    ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Profile & Streak Widget */}
      {!collapsed && (
        <div className="p-3 m-3 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 text-white shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
              <Flame className="w-4 h-4 fill-amber-400 text-amber-400 animate-bounce" />
              <span>{user.activeStreak} Day Streak</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
              Score {user.productivityScore}/100
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Weekly Focus Target</span>
              <span className="font-mono text-slate-200">{user.currentGoalHours}/{user.weeklyGoalHours}h</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-brand-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, (user.currentGoalHours / user.weeklyGoalHours) * 100)}%` }} 
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full object-cover ring-1 ring-brand-500/50" />
              <div className="truncate">
                <p className="text-xs font-medium text-slate-200 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.role}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
