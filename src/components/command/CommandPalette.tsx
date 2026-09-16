import React, { useState, useEffect, useRef } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  Search, 
  LayoutDashboard, 
  KanbanSquare, 
  ListTodo, 
  FolderKanban, 
  BarChart3, 
  UserCheck, 
  Plus, 
  Sparkles, 
  Clock, 
  Sun, 
  Moon, 
  RefreshCw, 
  RotateCcw, 
  ArrowRight, 
  Command, 
  Hash, 
  CornerDownLeft, 
  Check,
  Radio,
  Rocket,
  Sliders
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateTask: () => void;
  onOpenAiStandup: () => void;
  onOpenDeepWork: () => void;
  setActiveTab: (tab: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenCreateTask,
  onOpenAiStandup,
  onOpenDeepWork,
  setActiveTab
}) => {
  const { theme, toggleTheme } = useTheme();
  const { tasks, projects, setViewMode, resetFilters, toggleLoadingState, triggerErrorState } = useDashboard();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Command items collection
  const actions = [
    {
      id: 'create_task',
      title: 'Create New Task',
      subtitle: 'Open task composer dialog',
      category: 'Quick Actions',
      icon: Plus,
      run: () => onOpenCreateTask()
    },
    {
      id: 'ai_standup',
      title: 'Generate AI Standup',
      subtitle: 'Synthesize daily progress & cognitive load',
      category: 'Quick Actions',
      icon: Sparkles,
      run: () => onOpenAiStandup()
    },
    {
      id: 'deep_work',
      title: 'Start Deep Work Focus Timer',
      subtitle: 'Launch Pomodoro flow protocol',
      category: 'Quick Actions',
      icon: Clock,
      run: () => onOpenDeepWork()
    },
    {
      id: 'toggle_theme',
      title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
      subtitle: 'Toggle dashboard interface theme',
      category: 'Quick Actions',
      icon: theme === 'dark' ? Sun : Moon,
      run: () => toggleTheme()
    },
    {
      id: 'sim_load',
      title: 'Toggle Skeleton Loading State',
      subtitle: 'Simulate network latency & shimmer skeletons',
      category: 'Developer Tools',
      icon: RefreshCw,
      run: () => toggleLoadingState()
    },
    {
      id: 'reset_filters',
      title: 'Reset All Filters & Search',
      subtitle: 'Clear active task filter parameters',
      category: 'Developer Tools',
      icon: RotateCcw,
      run: () => resetFilters()
    },
    // Navigation
    {
      id: 'nav_dashboard',
      title: 'Jump to Overview Dashboard',
      subtitle: 'KPIs, Activity matrix, Velocity burndown',
      category: 'Navigation',
      icon: LayoutDashboard,
      run: () => setActiveTab('dashboard')
    },
    {
      id: 'nav_tasks',
      title: 'Jump to Tasks (Board & List View)',
      subtitle: 'Pipeline lanes, drag-and-drop, story points',
      category: 'Navigation',
      icon: KanbanSquare,
      run: () => {
        setActiveTab('tasks');
        setViewMode('kanban');
      }
    },
    {
      id: 'nav_projects',
      title: 'Jump to Projects & Repositories',
      subtitle: 'Active codebases, GitHub sync & milestone tracking',
      category: 'Navigation',
      icon: FolderKanban,
      run: () => setActiveTab('projects')
    },
    {
      id: 'nav_deployments',
      title: 'Jump to Deployments & CI/CD Telemetry',
      subtitle: 'Release orchestration, environment builds, and status audit',
      category: 'Navigation',
      icon: Rocket,
      run: () => setActiveTab('deployments')
    },
    {
      id: 'nav_lobby',
      title: 'Jump to Team Lobby & Member Roster',
      subtitle: 'Live engineer presence, member roles & project assignments',
      category: 'Navigation',
      icon: Radio,
      run: () => setActiveTab('lobby')
    },
    {
      id: 'nav_analytics',
      title: 'Jump to Engineering Insights',
      subtitle: 'Detailed telemetry & code review velocity',
      category: 'Navigation',
      icon: BarChart3,
      run: () => setActiveTab('analytics')
    },
    {
      id: 'nav_settings',
      title: 'Jump to Settings & Workspace Preferences',
      subtitle: 'Theme, density, notifications, and security tokens in Profile',
      category: 'Navigation',
      icon: Sliders,
      run: () => setActiveTab('profile')
    },
    {
      id: 'nav_profile',
      title: 'Jump to Developer Profile',
      subtitle: 'Achievements, streak score, integrations',
      category: 'Navigation',
      icon: UserCheck,
      run: () => setActiveTab('profile')
    }
  ];

  // Dynamic task items
  const taskCommands = tasks.map((t) => ({
    id: `task_${t.id}`,
    title: `[${t.key}] ${t.title}`,
    subtitle: `${t.projectName} • ${t.status.replace('_', ' ')} • ${t.storyPoints} pts`,
    category: 'Work Items',
    icon: Hash,
    run: () => {
      setActiveTab('tasks');
      setViewMode('kanban');
    }
  }));

  const allItems = [...actions, ...taskCommands];

  const filteredItems = allItems.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  }).slice(0, 10);

  // Keyboard navigation inside list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault();
      filteredItems[selectedIndex].run();
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Palette Container */}
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-10 animate-slide-down"
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-brand-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, search tasks, or jump to view..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full text-sm bg-transparent border-none text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
          />
          <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            <span>ESC</span>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-100 dark:divide-slate-800/40">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.run();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-300'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-brand-500/20 text-brand-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold truncate">{item.title}</p>
                      <p className="text-[11px] text-slate-400 truncate">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400">
                      {item.category}
                    </span>
                    {isSelected && <CornerDownLeft className="w-3.5 h-3.5 text-brand-500" />}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-slate-400">
              No matching commands or work items found for "{query}"
            </div>
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-brand-500">Ctrl + K Active</span>
        </div>
      </div>
    </div>
  );
};
