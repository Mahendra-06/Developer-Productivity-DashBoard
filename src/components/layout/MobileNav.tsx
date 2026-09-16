import React from 'react';
import { 
  LayoutDashboard, 
  KanbanSquare, 
  ListTodo, 
  FolderKanban, 
  BarChart3, 
  UserCheck, 
  X, 
  Cpu,
  Flame,
  GitPullRequest,
  Radio,
  Rocket,
  Plus
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { ViewMode } from '../../types';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab
}) => {
  const { user, tasks, projects, prs, presences, auditEvents, setViewMode, openCreateModal } = useDashboard();

  if (!isOpen) return null;

  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const pendingPRsCount = prs.filter(p => !p.isReviewed && !p.isMerged).length;
  const freeLobbyCount = presences.filter(p => p.status === 'available').length;

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard, badge: undefined },
    { id: 'tasks', label: 'Tasks', icon: KanbanSquare, badge: inProgressCount > 0 ? `${inProgressCount}` : tasks.length > 0 ? `${tasks.length}` : undefined },
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
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-3/4 max-w-xs bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between shadow-2xl z-10 animate-fade-in">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <img 
                src="/logo.png" 
                alt="DMetrics Logo" 
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-white/10" 
              />
              <span className="font-bold text-sm text-slate-100">DMetrics</span>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <div className="py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-brand-500/20 text-brand-400 font-semibold' 
                      : 'text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* User Card & Create button */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <button
            onClick={() => {
              openCreateModal();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-medium rounded-xl text-xs shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Task</span>
          </button>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user.role}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
