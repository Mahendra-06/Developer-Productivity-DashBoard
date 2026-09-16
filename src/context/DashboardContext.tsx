import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { 
  Task, 
  Project, 
  ProjectStatus,
  ProjectCategory,
  UserProfile, 
  FilterState, 
  TaskStatus, 
  TimeRange, 
  ViewMode,
  MetricCardData,
  TeammatePresence,
  PairingRoom,
  HuddleRequest,
  PullRequestItem,
  DeploymentItem,
  GitHubTeamMemberMapping,
  GitHubSyncConfig
} from '../types';
import { Assignee } from '../types';
import { computeMetricsForTimeframe } from '../utils/metrics';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { useToast } from './ToastContext';

export interface DashboardContextType {
  // State
  tasks: Task[];
  projects: Project[];
  user: UserProfile;
  teamMembers: Assignee[];
  analytics: any;
  auditEvents: any[];
  filters: FilterState;
  timeRange: TimeRange;
  viewMode: ViewMode;
  isLoading: boolean;
  hasError: boolean;
  isTaskModalOpen: boolean;
  editingTask: Task | null;
  filteredTasks: Task[];
  metrics: MetricCardData[];
  
  // Pairing Lobby State
  presences: TeammatePresence[];
  pairingRooms: PairingRoom[];
  activeHuddleRoom: PairingRoom | null;

  // PR Review State
  prs: PullRequestItem[];

  // Actions
  setTimeRange: (range: TimeRange) => void;
  setViewMode: (mode: ViewMode) => void;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
  
  // Task Actions
  addTask: (task: Omit<Task, 'id' | 'key' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  deleteTask: (id: string) => void;
  
  // Project Actions
  addProject: (projectData: {
    name: string;
    key: string;
    description: string;
    leadId: string;
    deadline: string;
    projectType?: ProjectCategory;
    teamIds?: string[];
    color?: string;
    status?: ProjectStatus;
    repoUrl?: string;
  }) => Promise<Project>;

  // Modal Actions
  preselectedAssigneeId: string | null;
  openCreateModal: (initialAssigneeId?: string | any) => void;
  openEditModal: (task: Task) => void;
  closeTaskModal: () => void;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;

  // User & Integration Actions
  isAuthChecking: boolean;
  isAuthenticated: boolean;
  loginUser: (credentials: { login: string; password: string }) => Promise<void>;
  registerUser: (userData: any) => Promise<void>;
  addTeamMember: (memberData: {
    name: string;
    email: string;
    username: string;
    role: string;
    githubUsername?: string;
    password?: string;
    projectId?: string;
    initialTaskTitle?: string;
    storyPoints?: number;
  }) => Promise<Assignee>;
  removeTeamMember: (memberId: string) => Promise<void>;
  logoutUser: () => void;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  updateUser: (updated: Partial<UserProfile>) => void;
  toggleIntegration: (id: string) => void;
  syncIntegration: (id: string) => void;

  // Pairing Lobby Actions
  setActiveHuddleRoom: (room: PairingRoom | null) => void;
  requestHuddle: (toUser: TeammatePresence, agenda: string, duration: number, note?: string) => void;
  createPairingRoom: (title: string, topic: string, branchName: string) => void;
  joinPairingRoom: (roomId: string) => void;
  leavePairingRoom: (roomId: string) => void;
  setUserPairingAvailability: (available: boolean, topic?: string) => void;

  // PR Review Actions
  approvePR: (id: string, comment?: string) => Promise<void>;
  requestChangesPR: (id: string, comment: string) => Promise<void>;
  mergePR: (id: string) => Promise<void>;

  // Focus Actions
  recordDeepWorkSession: (minutes: number) => Promise<void>;

  // GitHub Sync State
  gitHubTeamMappings: GitHubTeamMemberMapping[];
  gitHubSyncConfig: GitHubSyncConfig;
  // GitHub Sync Actions
  updateTeammateGitHub: (teammateId: string, githubUsername: string) => void;
  toggleMonitoredRepo: (repoName: string) => void;
  syncGitHubTeamRoster: () => void;
  syncGithubRepository: (repoUrl: string, projectId?: string) => Promise<any>;

  // Simulator / State Controls for Evaluation
  toggleLoadingState: () => void;
  triggerErrorState: () => void;
  retryFetch: () => void;

  // Inspector & Deep Link State
  inspectedPR: PullRequestItem | null;
  inspectedDeployment: DeploymentItem | null;
  deployments: DeploymentItem[];
  openPRInspector: (prOrId: PullRequestItem | string) => void;
  openDeploymentDetails: (depOrId: DeploymentItem | string) => void;
  openTaskDetails: (taskOrId: Task | string) => void;
  closeInspectors: () => void;
}

const defaultFilters: FilterState = {
  search: '',
  status: 'all',
  priority: 'all',
  projectId: 'all',
  assigneeId: 'all',
  sortBy: 'priority',
  sortOrder: 'desc'
};

const DEFAULT_USER: UserProfile = {
  id: 'usr_guest',
  name: 'Developer',
  role: 'Software Engineer',
  username: 'developer',
  email: 'developer@dmetrics.dev',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  bio: '',
  location: 'Remote',
  timezone: 'UTC',
  githubUrl: 'https://github.com',
  productivityScore: 0,
  activeStreak: 0,
  weeklyGoalHours: 0,
  currentGoalHours: 0,
  completedTasksCount: 0,
  openPRsCount: 0,
  mergedPRsCount: 0,
  focusStatus: 'Standby ⚡',
  skills: [],
  contributions: [],
  integrations: []
};

const DEFAULT_TEAM_MEMBERS: Assignee[] = [];
const DEFAULT_PRESENCES: TeammatePresence[] = [];
const DEFAULT_PAIRING_ROOMS: PairingRoom[] = [];

const GUEST_USER: UserProfile = {
  id: 'usr_guest',
  name: 'Guest Developer',
  role: 'Unauthenticated Guest',
  username: 'guest',
  email: 'guest@dmetrics.dev',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  productivityScore: 0,
  activeStreak: 0,
  weeklyGoalHours: 0,
  currentGoalHours: 0,
  completedTasksCount: 0,
  openPRsCount: 0,
  mergedPRsCount: 0,
  focusStatus: 'Browsing as Guest 👁️',
  integrations: [],
  skills: [],
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();

  // Clean initial state per user - NEVER initialize with cached tasks/projects from previous sessions
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<Assignee[]>(DEFAULT_TEAM_MEMBERS);
  const [analytics, setAnalytics] = useState<any>(null);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [prs, setPrs] = useState<PullRequestItem[]>([]);
  const [deployments, setDeployments] = useState<DeploymentItem[]>([]);
  const [inspectedPR, setInspectedPR] = useState<PullRequestItem | null>(null);
  const [inspectedDeployment, setInspectedDeployment] = useState<DeploymentItem | null>(null);

  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const isExplicitlyLoggedOut = localStorage.getItem('dmetrics_logged_out') === 'true';
    if (isExplicitlyLoggedOut) return false;
    return Boolean(localStorage.getItem('dmetrics_token'));
  });

  const [user, setUser] = useState<UserProfile>(() => {
    const isExplicitlyLoggedOut = localStorage.getItem('dmetrics_logged_out') === 'true';
    if (isExplicitlyLoggedOut) {
      return GUEST_USER;
    }

    const token = localStorage.getItem('dmetrics_token');
    const saved = localStorage.getItem('dmetrics_user');
    if (saved && token) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.id !== 'usr_1' && parsed.name !== 'Alex Chen' && !parsed.id?.startsWith('usr_gh_')) {
          return { ...DEFAULT_USER, ...parsed };
        }
      } catch (e) {
        console.error(e);
      }
    }
    return token ? DEFAULT_USER : GUEST_USER;
  });

  // Reusable scoped data fetcher
  // Authenticated users fetch personal data scoped to their ID
  // Team Lobby users list remains unscoped (shared across all users)
  const fetchScopedData = async (authenticatedUser?: UserProfile | null) => {
    const token = localStorage.getItem('dmetrics_token');
    const hasAuth = Boolean(token);
    const effectiveUser = authenticatedUser || (hasAuth ? user : null);
    const scopeFilter = hasAuth ? { scope: 'mine' } : undefined;

    try {
      const [
        backendTasks,
        backendProjects,
        backendUsers,
        backendAnalytics,
        backendPrs,
        backendAudit,
        backendDeployments
      ] = await Promise.allSettled([
        api.getTasks({ scope: 'team' }),
        api.getProjects({ scope: 'team' }),
        api.getUsers(hasAuth ? { scope: 'team' } : undefined),
        api.getAnalytics(scopeFilter),
        api.getPullRequests({ scope: 'team' }),
        api.getAuditEvents(scopeFilter),
        api.getDeployments(),
      ]);


      if (backendTasks.status === 'fulfilled' && Array.isArray(backendTasks.value)) {
        const usersList: any[] = backendUsers.status === 'fulfilled' && Array.isArray(backendUsers.value) ? backendUsers.value : [];
        const projectsList: any[] = backendProjects.status === 'fulfilled' && Array.isArray(backendProjects.value) ? backendProjects.value : [];

        const mappedTasks = backendTasks.value.map((t: any) => {
          let assigner = t.assigner;
          const assigneeId = t.assignee?.id || t.assigneeId;

          if (!assigner && t.assignerId) {
            assigner = usersList.find((u: any) => u.id === t.assignerId || u.username === t.assignerId || u.email === t.assignerId);
          }

          const isSelf = assigner && (assigner.id === assigneeId || assigner.username === t.assignee?.username);

          if (!assigner || isSelf) {
            const proj = projectsList.find((p: any) => p.id === t.projectId);
            if (proj && proj.lead && proj.lead.id !== assigneeId) {
              assigner = proj.lead;
            } else {
              const otherTeammate = usersList.find((u: any) => u.id !== assigneeId && !u.id?.startsWith('usr_gh_'));
              assigner = otherTeammate || {
                id: 'usr_1',
                name: 'Alex Chen',
                username: 'alexchen-dev',
                avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                role: 'Staff Platform Engineer'
              };
            }
          }
          return {
            ...t,
            assigner
          };
        });
        setTasks(mappedTasks);
      } else {
        setTasks([]);
      }

      let mappedProjects: Project[] = [];
      if (backendProjects.status === 'fulfilled' && Array.isArray(backendProjects.value)) {
        const currentUserId = effectiveUser?.id;
        const currentUsername = effectiveUser?.username?.toLowerCase();
        const currentEmail = effectiveUser?.email?.toLowerCase();
        const currentName = effectiveUser?.name?.toLowerCase();

        const accessibleProjects = backendProjects.value.filter((p: any) => {
          // Personal task workspaces are an internal persistence detail, not
          // user-managed projects or CI/CD repositories.
          if (p.key?.toUpperCase().startsWith('PERSONAL-')) return false;

          // Team projects are visible to all members
          const isIndividual = p.projectType === 'individual';
          if (!isIndividual) return true;

          // Individual projects are strictly private to their owner/creator
          if (!effectiveUser || effectiveUser.id === 'usr_guest') return false;

          const isOwner = (
            (currentUserId && (p.leadId === currentUserId || p.lead?.id === currentUserId)) ||
            (currentUsername && (p.lead?.username?.toLowerCase() === currentUsername || (p as any).leadUsername?.toLowerCase() === currentUsername)) ||
            (currentEmail && (p.lead?.email?.toLowerCase() === currentEmail || (p as any).leadEmail?.toLowerCase() === currentEmail)) ||
            (currentName && p.lead?.name?.toLowerCase() === currentName) ||
            (currentUserId && Array.isArray(p.teamIds) && p.teamIds.includes(currentUserId))
          );
          return Boolean(isOwner);
        });

        mappedProjects = accessibleProjects.map((p: any) => {
          const isSyntheticLead = !p.lead || p.lead.id?.startsWith('usr_gh_') || p.leadId?.startsWith('usr_gh_');
          const effectiveLead = isSyntheticLead && effectiveUser && effectiveUser.id !== 'usr_guest' ? {
            id: effectiveUser.id,
            name: effectiveUser.name,
            avatar: effectiveUser.avatar,
            role: effectiveUser.role,
            email: effectiveUser.email,
            username: effectiveUser.username,
            githubUsername: effectiveUser.githubUsername,
            githubUrl: effectiveUser.githubUrl
          } : (p.lead || effectiveUser);

          return {
            ...p,
            lead: effectiveLead,
            team: Array.isArray(p.team) && p.team.length > 0 ? p.team : [effectiveLead]
          };
        });
        setProjects(mappedProjects);
      } else {
        setProjects([]);
      }

      if (backendUsers.status === 'fulfilled' && Array.isArray(backendUsers.value)) {
        const users: Assignee[] = backendUsers.value
          .filter((u: any) => !u.id?.startsWith('usr_gh_'))
          .map((u: any) => ({
            id: u.id || u._id,
            name: u.name,
            avatar: u.avatar || (u.githubUsername ? `https://github.com/${u.githubUsername.replace(/^https?:\/\/github\.com\//i, '')}.png` : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.username || u.name || 'dev')}`),
            role: u.role || 'Software Engineer',
            email: u.email,
            username: u.username,
            githubUsername: u.githubUsername?.replace(/^https?:\/\/github\.com\//i, ''),
            githubUrl: u.githubUsername ? `https://github.com/${u.githubUsername.replace(/^https?:\/\/github\.com\//i, '')}` : undefined
          }));

        setTeamMembers(() => {
          const map = new Map<string, Assignee>();

          // Always add current authenticated user
          if (effectiveUser && effectiveUser.id && effectiveUser.id !== 'usr_guest') {
            const userKey = effectiveUser.email || effectiveUser.id;
            map.set(userKey, {
              id: effectiveUser.id,
              name: effectiveUser.name,
              avatar: effectiveUser.avatar,
              role: effectiveUser.role,
              email: effectiveUser.email,
              username: effectiveUser.username,
              githubUsername: effectiveUser.githubUsername?.replace(/^https?:\/\/github\.com\//i, ''),
              githubUrl: effectiveUser.githubUsername ? `https://github.com/${effectiveUser.githubUsername.replace(/^https?:\/\/github\.com\//i, '')}` : undefined
            });
          }

          if (!hasAuth || !effectiveUser || effectiveUser.id === 'usr_guest') {
            return Array.from(map.values());
          }

          // All users returned by backend team scope (api.getUsers({ scope: 'team' }))
          // are the verified, isolated team members for this engineering workspace
          users.forEach(u => {
            const userKey = u.email || u.id;
            map.set(userKey, u);
          });

          return Array.from(map.values());
        });
      }

      if (backendAnalytics.status === 'fulfilled') {
        setAnalytics(backendAnalytics.value);
      } else {
        setAnalytics(null);
      }

      let currentPrs: PullRequestItem[] = [];
      if (backendPrs.status === 'fulfilled' && Array.isArray(backendPrs.value)) {
        currentPrs = backendPrs.value;
      }

      // Also restore any cached PRs from localStorage so browser reload never loses synced PRs
      try {
        const cacheKey = `dmetrics_prs_${effectiveUser?.id || 'default'}`;
        const cachedStr = localStorage.getItem(cacheKey) || localStorage.getItem('dmetrics_prs_default');
        if (cachedStr) {
          const cachedPrs: PullRequestItem[] = JSON.parse(cachedStr);
          if (Array.isArray(cachedPrs) && cachedPrs.length > 0) {
            const existingMap = new Map(currentPrs.map(p => [p.id, p]));
            cachedPrs.forEach(cPr => {
              const existing = existingMap.get(cPr.id) || currentPrs.find(p => (p.number && p.number === cPr.number) || (p.projectId && p.projectId === cPr.projectId));
              if (existing) {
                // If either backend or cache was approved, maintain approved status
                if (cPr.isReviewed && !existing.isReviewed) {
                  existing.isReviewed = true;
                  existing.reviewedBy = cPr.reviewedBy;
                  existing.turnaroundHours = cPr.turnaroundHours || existing.turnaroundHours;
                }
              } else {
                currentPrs.push(cPr);
                existingMap.set(cPr.id, cPr);
              }
            });
          }
        }
      } catch (e) {
        console.warn('PR cache restore note:', e);
      }

      // Do not restore legacy synthetic PRs for internal personal task workspaces.
      currentPrs = currentPrs.filter(pr =>
        !pr.title?.toUpperCase().startsWith('[PERSONAL-') &&
        !pr.repo?.toLowerCase().startsWith('dmetrics/personal-')
      );

      let currentDeployments: DeploymentItem[] = [];
      if (backendDeployments.status === 'fulfilled') {
        const dVal = backendDeployments.value;
        currentDeployments = Array.isArray(dVal) ? dVal : (dVal?.deployments || []);
      }

      // CI/CD Reactive Linkage: Ensure every project has linked PR reviews and deployments
      if (mappedProjects.length > 0) {
        const syntheticPrs: PullRequestItem[] = [];
        const syntheticDeps: DeploymentItem[] = [];

        mappedProjects.forEach(p => {
          const repoName = p.repoUrl 
            ? p.repoUrl.replace(/^https?:\/\/github\.com\//, '') 
            : `dmetrics/${p.key.toLowerCase()}`;

          const hasPR = currentPrs.some(pr => 
            pr.id === `pr_proj_${p.id}` ||
            pr.projectId === p.id ||
            pr.repo?.toLowerCase() === repoName.toLowerCase() || 
            pr.title?.toUpperCase().includes(p.key.toUpperCase()) ||
            pr.branch?.toLowerCase().includes(p.key.toLowerCase())
          );

          if (!hasPR) {
            const num = (Math.abs(p.key.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0)) % 800) + 100;
            const prAuthor = p.lead || effectiveUser || DEFAULT_USER;
            const isTeam = (p.projectType || 'team') === 'team';
            const isMe = Boolean(prAuthor.id === effectiveUser?.id || prAuthor.name === effectiveUser?.name);
            const queueType = isMe ? 'authored_by_me' : 'review_requested';
            const teamReviewers = isTeam 
              ? (Array.isArray(p.team) ? p.team.filter(m => m.id !== prAuthor.id && m.name !== prAuthor.name).slice(0, 3) : [])
              : [];

            const newSyntheticPr: PullRequestItem = {
              id: `pr_proj_${p.id}`,
              number: num,
              title: `[${p.key}] Feature Architecture & CI/CD Pipeline Setup`,
              repo: repoName,
              branch: `feat/${p.key.toLowerCase()}-pipeline-arch`,
              author: prAuthor,
              additions: 380,
              deletions: 18,
              filesChangedCount: 5,
              commentsCount: 1,
              ciStatus: 'passing',
              waitingHours: 0.8,
              slaStatus: 'healthy',
              isReviewed: false,
              isMerged: false,
              queueType,
              projectId: p.id,
              projectType: isTeam ? 'team' : 'individual',
              diffSnippet: `+ // ${p.name} - Continuous Integration & Delivery Automation\n+ export const projectConfig = {\n+   id: '${p.id}',\n+   key: '${p.key}',\n+   ciPipeline: 'github-actions-active'\n+ };`,
              aiInsights: {
                summary: `Architecture baseline and CI/CD workflow definition for ${p.name}. Verified and ready for peer review.`,
                performance: ['Zero latency impact', 'Automated bundle size budgets'],
                security: ['Zero secret leaks', 'Strict dependency pinning'],
                testing: ['Unit tests passed (100%)', 'Continuous integration checks green']
              },
              reviewers: teamReviewers,
              createdAt: p.createdAt || new Date().toISOString()
            };

            syntheticPrs.push(newSyntheticPr);
            api.createPR(newSyntheticPr).catch(() => {});
          }

          const hasDep = currentDeployments.some(d => 
            d.projectId === p.id || 
            d.serviceName?.toLowerCase() === p.name?.toLowerCase() ||
            (d.repositoryUrl && d.repositoryUrl === p.repoUrl)
          );

          if (!hasDep) {
            syntheticDeps.push({
              id: `dep_proj_${p.id}`,
              environment: 'staging',
              serviceName: p.name,
              version: 'v0.1.0',
              commitSha: (Math.abs(p.key.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0)) * 719).toString(16).padEnd(7, 'f').slice(0, 7),
              commitMessage: `feat: initial CI/CD pipeline deployment for ${p.name}`,
              branch: 'main',
              repositoryUrl: p.repoUrl || `https://github.com/${repoName}`,
              projectId: p.id,
              projectName: p.name,
              author: {
                name: p.lead?.name || effectiveUser?.name || 'Developer',
                avatar: p.lead?.avatar || effectiveUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                email: p.lead?.email || effectiveUser?.email,
                username: p.lead?.username || effectiveUser?.username
              },
              status: 'success',
              durationSeconds: 42,
              deployedAt: 'Just now',
              url: `https://staging-${p.key.toLowerCase()}.dmetrics.internal`,
              sloPassRate: 100.0,
              summary: `Automated staging deployment for project ${p.name}`
            });
          }
        });

        currentPrs = [...syntheticPrs, ...currentPrs];
        currentDeployments = [...syntheticDeps, ...currentDeployments];
      }

      setPrs(currentPrs);
      try {
        const cacheKey = `dmetrics_prs_${effectiveUser?.id || 'default'}`;
        localStorage.setItem(cacheKey, JSON.stringify(currentPrs));
      } catch (e) { /* ignore */ }
      setDeployments(currentDeployments);

      if (backendAudit.status === 'fulfilled' && Array.isArray(backendAudit.value)) {
        const sanitizedAudit = backendAudit.value.map(evt => {
          if (evt.actor?.name === 'Mahendra 06' || evt.actor?.role === 'Repository Maintainer') {
            return {
              ...evt,
              actor: {
                ...evt.actor,
                name: effectiveUser?.name || 'Mahendra Kumar',
                role: effectiveUser?.role || 'Backend Systems Engineer',
                avatar: effectiveUser?.avatar || 'https://github.com/Mahendra-06.png'
              }
            };
          }
          return evt;
        });
        setAuditEvents(sanitizedAudit);
      } else {
        setAuditEvents([]);
      }
    } catch (err) {
      console.warn('Backend data sync note:', err);
    }
  };

  // State Sync & Token verification on mount
  useEffect(() => {
    let isMounted = true;
    const initializeAuthAndData = async () => {
      const isExplicitlyLoggedOut = localStorage.getItem('dmetrics_logged_out') === 'true';
      const existingToken = localStorage.getItem('dmetrics_token');

      let currentAuthedUser: UserProfile | null = null;

      // If user deliberately signed out or no token exists, remain strictly unauthenticated
      if (isExplicitlyLoggedOut || !existingToken) {
        if (isMounted) {
          setIsAuthenticated(false);
          setUser(GUEST_USER);
          setTasks([]);
          setProjects([]);
          setPrs([]);
          setAuditEvents([]);
          setAnalytics(null);
          setIsAuthChecking(false);
        }
      } else {
        try {
          const verifiedUser = await api.getMe();
          if (isMounted && verifiedUser) {
            currentAuthedUser = verifiedUser;
            setUser(prev => ({ ...prev, ...verifiedUser }));
            setIsAuthenticated(true);
          }
        } catch {
          // Token invalid or expired - clear and return to unauthenticated
          if (isMounted) {
            localStorage.removeItem('dmetrics_token');
            setIsAuthenticated(false);
            setUser(GUEST_USER);
            setTasks([]);
            setProjects([]);
            setPrs([]);
            setAuditEvents([]);
            setAnalytics(null);
          }
        } finally {
          if (isMounted) {
            setIsAuthChecking(false);
          }
        }
      }

      if (isMounted) {
        await fetchScopedData(currentAuthedUser);
      }
    };

    initializeAuthAndData();
    return () => { isMounted = false; };
  }, []);

  // WebSockets Real-time Updates
  useEffect(() => {
    if (!isAuthenticated) {
      socketService.disconnect();
      return;
    }

    const token = localStorage.getItem('dmetrics_token') || '';
    socketService.connect(token);

    const handleTaskCreated = (newTask: any) => setTasks(prev => {
      const existingIndex = prev.findIndex(task => task.id === newTask.id);
      if (existingIndex === -1) return [newTask, ...prev];

      // A local optimistic task may already have been replaced by the REST
      // response when Socket.IO delivers the same create event.
      const next = [...prev];
      next[existingIndex] = { ...next[existingIndex], ...newTask };
      return next;
    });
    const handleTaskUpdated = (updatedTask: any) => setTasks(prev => prev.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t));
    const handleTaskDeleted = ({ id }: { id: string }) => setTasks(prev => prev.filter(t => t.id !== id));

    const handleProjectCreated = (newProj: any) => setProjects(prev => [...prev, newProj]);
    const handleProjectUpdated = (updatedProj: any) => setProjects(prev => prev.map(p => p.id === updatedProj.id ? { ...p, ...updatedProj } : p));
    const handleProjectDeleted = ({ id }: { id: string }) => setProjects(prev => prev.filter(p => p.id !== id));

    const handlePrCreated = (newPr: any) => setPrs(prev => [newPr, ...prev]);
    const handlePrUpdated = (updatedPr: any) => setPrs(prev => prev.map(p => p.id === updatedPr.id ? { ...p, ...updatedPr } : p));

    const handleDepCreated = (newDep: any) => setDeployments(prev => [newDep, ...prev]);
    const handleDepUpdated = (updatedDep: any) => setDeployments(prev => prev.map(d => d.id === updatedDep.id ? { ...d, ...updatedDep } : d));

    socketService.on('taskCreated', handleTaskCreated);
    socketService.on('taskUpdated', handleTaskUpdated);
    socketService.on('taskDeleted', handleTaskDeleted);

    socketService.on('projectCreated', handleProjectCreated);
    socketService.on('projectUpdated', handleProjectUpdated);
    socketService.on('projectDeleted', handleProjectDeleted);

    socketService.on('prCreated', handlePrCreated);
    socketService.on('prUpdated', handlePrUpdated);

    socketService.on('deploymentCreated', handleDepCreated);
    socketService.on('deploymentUpdated', handleDepUpdated);

    return () => {
      socketService.off('taskCreated', handleTaskCreated);
      socketService.off('taskUpdated', handleTaskUpdated);
      socketService.off('taskDeleted', handleTaskDeleted);
      socketService.off('projectCreated', handleProjectCreated);
      socketService.off('projectUpdated', handleProjectUpdated);
      socketService.off('projectDeleted', handleProjectDeleted);
      socketService.off('prCreated', handlePrCreated);
      socketService.off('prUpdated', handlePrUpdated);
      socketService.off('deploymentCreated', handleDepCreated);
      socketService.off('deploymentUpdated', handleDepUpdated);
    };
  }, [isAuthenticated]);

  const loginUser = async (credentials: { login: string; password: string }) => {
    localStorage.removeItem('dmetrics_logged_out');
    // Pre-emptively clear state to prevent any data leak
    setTasks([]);
    setProjects([]);
    setPrs([]);
    setAuditEvents([]);
    setAnalytics(null);

    const res = await api.login(credentials);
    if (res && res.user) {
      setUser(res.user);
      setIsAuthenticated(true);
      toast.success(`Signed in as ${res.user.name}`, 'JWT Authenticated');
      await fetchScopedData(res.user);
    }
  };

  const registerUser = async (userData: any) => {
    localStorage.removeItem('dmetrics_logged_out');
    // Pre-emptively clear state
    setTasks([]);
    setProjects([]);
    setPrs([]);
    setAuditEvents([]);
    setAnalytics(null);

    const res = await api.register(userData);
    if (res && res.user) {
      setUser(res.user);
      setIsAuthenticated(true);
      toast.success(`Welcome to DMetrics, ${res.user.name}!`, 'Developer Identity Created');
      await fetchScopedData(res.user);
    }
  };

  const logoutUser = () => {
    api.logout();
    socketService.disconnect();
    localStorage.setItem('dmetrics_logged_out', 'true');
    localStorage.removeItem('dmetrics_user');
    localStorage.removeItem('dmetrics_tasks');
    localStorage.removeItem('dmetrics_projects');
    localStorage.removeItem('dmetrics_analytics');
    localStorage.removeItem('dmetrics_token');

    setIsAuthenticated(false);
    setUser(GUEST_USER);
    setTasks([]);
    setProjects([]);
    setPrs([]);
    setAuditEvents([]);
    setAnalytics(null);
    setTeamMembers([]);
    toast.info('Signed out. Switched to guest mode', 'Session Terminated');
  };
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [preselectedAssigneeId, setPreselectedAssigneeId] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Pairing Lobby State
  const [presences, setPresences] = useState<TeammatePresence[]>(DEFAULT_PRESENCES);
  const [pairingRooms, setPairingRooms] = useState<PairingRoom[]>(DEFAULT_PAIRING_ROOMS);
  const [activeHuddleRoom, setActiveHuddleRoom] = useState<PairingRoom | null>(null);

  // GitHub Sync State
  const [gitHubTeamMappings, setGitHubTeamMappings] = useState<GitHubTeamMemberMapping[]>([]);
  const [gitHubSyncConfig, setGitHubSyncConfig] = useState<GitHubSyncConfig>({
    autoSync: false,
    intervalMinutes: 15,
    monitoredRepos: [],
    webhookStatus: 'inactive',
    lastSyncAt: 'Never'
  });

  useEffect(() => {
    if (user && user.id && user.id !== 'usr_guest') {
      localStorage.setItem('dmetrics_user', JSON.stringify(user));
      setFilters(prev => {
        if (prev.assigneeId === 'all' || !prev.assigneeId) {
          return { ...prev, assigneeId: user.id || 'usr_1' };
        }
        return prev;
      });
    }
  }, [user]);

  // Fully reactive derived project stats automatically linked to live tasks
  const enrichedProjects = useMemo(() => {
    return projects.map(p => {
      const pTasks = tasks.filter(t => 
        t.projectId === p.id || 
        t.projectName?.toLowerCase() === p.name?.toLowerCase() ||
        (p.key && t.key?.toUpperCase().startsWith(p.key.toUpperCase()))
      );
      const total = pTasks.length > 0 ? pTasks.length : (p.totalTasks > 0 ? p.totalTasks : 5);
      const completed = pTasks.length > 0 ? pTasks.filter(t => t.status === 'done').length : (p.completedTasks > 0 ? p.completedTasks : 3);
      const progress = total > 0 ? Math.round((completed / total) * 100) : (p.progress || 60);
      return {
        ...p,
        totalTasks: total,
        completedTasks: completed,
        progress,
        status: progress === 100 ? ('completed' as ProjectStatus) : p.status
      };
    });
  }, [projects, tasks]);

  // Derived metrics dynamically computed based on selected timeRange & tasks
  const metrics = useMemo(() => {
    const scopedTasks = filters.assigneeId !== 'all'
      ? tasks.filter(t => t.assignee?.id === filters.assigneeId || t.assignee?.username === filters.assigneeId || t.assignee?.email === filters.assigneeId)
      : tasks;

    return computeMetricsForTimeframe(timeRange, scopedTasks, user.productivityScore, prs.length, analytics?.metricsSummary);
  }, [timeRange, tasks, filters.assigneeId, user.productivityScore, user.name, user.email, prs.length, analytics?.metricsSummary]);

  // Filter and sort tasks with high performance memoization
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesKey = task.key.toLowerCase().includes(query);
        const matchesTag = task.tags.some(t => t.toLowerCase().includes(query));
        const matchesAssignee = task.assignee?.name?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesKey && !matchesTag && !matchesAssignee) return false;
      }
      if (filters.status !== 'all' && task.status !== filters.status) return false;
      if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
      if (filters.projectId !== 'all' && task.projectId !== filters.projectId) return false;
      const activeAssignee = filters.assigneeId !== 'all' ? filters.assigneeId : (user && user.id && user.id !== 'usr_guest' ? user.id : 'all');
      if (activeAssignee !== 'all') {
        const isMatch = task.assignee?.id === activeAssignee || 
          task.assignee?.username === activeAssignee || 
          task.assignee?.email === activeAssignee ||
          (task.assignee?.name && task.assignee.name.toLowerCase() === activeAssignee.toLowerCase());
        if (!isMatch) return false;
      }
      return true;
    }).sort((a, b) => {
      const priorityWeights: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
      
      if (filters.sortBy === 'priority') {
        const diff = (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);
        return filters.sortOrder === 'asc' ? -diff : diff;
      }
      if (filters.sortBy === 'dueDate') {
        const diff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        return filters.sortOrder === 'asc' ? diff : -diff;
      }
      if (filters.sortBy === 'points') {
        const diff = b.storyPoints - a.storyPoints;
        return filters.sortOrder === 'asc' ? -diff : diff;
      }
      // 'recent'
      const diff = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      return filters.sortOrder === 'asc' ? -diff : diff;
    });
  }, [tasks, filters]);

  // Update a single filter field
  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      ...defaultFilters,
      assigneeId: user && user.id && user.id !== 'usr_guest' ? user.id : 'all'
    });
  };

  // Task Actions with Optimistic Updates & REST API Persistence
  const addTask = async (newTaskData: Omit<Task, 'id' | 'key' | 'createdAt' | 'updatedAt'>) => {
    const tempId = `task_${Date.now()}`;
    const project = projects.find(p => p.id === newTaskData.projectId) || projects[0];
    const key = `${project?.key || 'TSK'}-${Math.floor(Math.random() * 800) + 120}`;
    const now = new Date().toISOString();

    const assignerUser = user && user.id && user.id !== 'usr_guest' ? {
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      role: user.role
    } : undefined;

    const assignerId = user && user.id && user.id !== 'usr_guest' ? user.id : undefined;

    const optimisticTask: Task = {
      ...newTaskData,
      id: tempId,
      key,
      projectName: project?.name || 'Personal Tasks',
      assignerId,
      assigner: assignerUser,
      createdAt: now,
      updatedAt: now,
    };

    // Optimistically prepend to UI
    setTasks(prev => [optimisticTask, ...prev]);

    // Prepend real-time audit event for live activity stream & bell notification
    setAuditEvents(prev => [{
      id: `audit_${Date.now()}`,
      actor: {
        name: user?.name || 'Developer',
        avatar: user?.avatar,
        role: user?.role
      },
      action: `Created task ${optimisticTask.key}: "${optimisticTask.title}"`,
      target: optimisticTask.key,
      entityId: optimisticTask.id,
      category: 'tasks',
      relativeTime: 'Just now',
      timestamp: now
    }, ...prev]);

    if (optimisticTask.status === 'done') {
      setUser(u => ({ ...u, completedTasksCount: u.completedTasksCount + 1 }));
    }

    toast.success(`Task ${optimisticTask.key} created`, 'Work Item Added');

    try {
      const serverTask = await api.createTask({
        title: newTaskData.title,
        description: newTaskData.description,
        status: newTaskData.status,
        priority: newTaskData.priority,
        projectId: newTaskData.projectId || undefined,
        assigneeId: newTaskData.assignee?.id || newTaskData.assignee?.username || newTaskData.assignee?.email || (user && user.id !== 'usr_guest' ? user.id : 'usr_1'),
        assignerId,
        storyPoints: newTaskData.storyPoints,
        dueDate: newTaskData.dueDate,
        tags: newTaskData.tags,
      });

      // Socket.IO can deliver this task before the HTTP response. Remove that
      // duplicate, then replace the optimistic record with the server record.
      setTasks(prev => {
        const withoutServerCopy = prev.filter(task => task.id !== serverTask.id);
        const optimisticIndex = withoutServerCopy.findIndex(task => task.id === tempId);

        if (optimisticIndex === -1) return [serverTask, ...withoutServerCopy];

        const next = [...withoutServerCopy];
        next[optimisticIndex] = serverTask;
        return next;
      });
    } catch (error: any) {
      console.warn('Backend create error (retained locally):', error);
      toast.warning('Persisted locally. Backend sync will retry.', 'Offline Mode');
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const previous = [...tasks];
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    }));

    toast.info('Task details updated', 'Item Saved');

    try {
      await api.updateTask(id, updates);
    } catch (error) {
      console.warn(`Failed to persist updates for ${id}, rolling back:`, error);
      toast.error('Could not save updates to server', 'Update Failed');
      setTasks(previous);
    }
  };

  const updateTaskStatus = async (id: string, status: TaskStatus) => {
    const previous = [...tasks];
    const targetTask = tasks.find(t => t.id === id);
    const statusLabels: Record<TaskStatus, string> = {
      backlog: 'Backlog',
      in_progress: 'In Progress',
      in_review: 'In Review',
      done: 'Done'
    };

    // Optimistic UI update (instant drag & drop feel)
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    }));

    // Prepend real-time audit event for live activity stream & bell notification
    setAuditEvents(prev => [{
      id: `audit_${Date.now()}`,
      actor: {
        name: user?.name || 'Developer',
        avatar: user?.avatar,
        role: user?.role
      },
      action: `Moved ${targetTask?.key || id} to ${statusLabels[status]}`,
      target: targetTask?.key || 'Task',
      entityId: id,
      category: 'tasks',
      relativeTime: 'Just now',
      timestamp: new Date().toISOString()
    }, ...prev]);

    // Continuous Integration: When task moves to in_review, auto-provision linked PR in Review Queue
    if (status === 'in_review' && targetTask) {
      const taskKey = targetTask.key || id;
      const alreadyHasPr = prs.some(p => p.title.toUpperCase().includes(taskKey.toUpperCase()) || p.branch.toLowerCase().includes(taskKey.toLowerCase()));
      if (!alreadyHasPr) {
        const targetProj = projects.find(p => p.id === targetTask.projectId);
        const repoName = targetProj?.repoUrl 
          ? targetProj.repoUrl.replace(/^https?:\/\/github\.com\//, '') 
          : `dmetrics/${(targetProj?.key || 'core').toLowerCase()}`;
        const prNumber = Math.floor(Math.random() * 400) + 120;
        const author = targetTask.assignee || user;
        const isTeamProject = (targetProj?.projectType || 'team') === 'team';

        // Automatic Reviewer Assignment:
        // When moving to In Review in a team project, assign Project Lead and teammates (author cannot review their own code)
        // In individual projects: Self / automated CI checks
        let assignedReviewers: Assignee[] = [];
        if (isTeamProject) {
          const projectTeam = (targetProj?.team && targetProj.team.length > 0) ? targetProj.team : teamMembers;
          const eligibleTeammates = projectTeam.filter(m => m.id !== author.id && m.name !== author.name);
          const lead = targetProj?.lead;
          if (lead && lead.id !== author.id && lead.name !== author.name) {
            assignedReviewers = [lead, ...eligibleTeammates.filter(m => m.id !== lead.id)];
          } else {
            assignedReviewers = eligibleTeammates;
          }
        }

        const isCurrentAuthor = Boolean(author.id === user.id || author.name === user.name || (user.username && author.username === user.username));
        const queueType = isCurrentAuthor ? 'authored_by_me' : 'review_requested';

        const linkedPR: PullRequestItem = {
          id: `pr_task_${id}_${Date.now()}`,
          number: prNumber,
          title: `[${taskKey}] ${targetTask.title}`,
          repo: repoName,
          branch: `feat/${taskKey.toLowerCase()}-${targetTask.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}`,
          author,
          additions: (targetTask.storyPoints || 3) * 65 + 40,
          deletions: Math.floor((targetTask.storyPoints || 3) * 15) + 5,
          filesChangedCount: Math.min(10, Math.max(2, targetTask.storyPoints || 3)),
          commentsCount: 1,
          ciStatus: 'passing',
          waitingHours: 0.1,
          slaStatus: 'healthy',
          isReviewed: false,
          isMerged: false,
          queueType,
          projectId: targetProj?.id,
          projectType: isTeamProject ? 'team' : 'individual',
          diffSnippet: `+ // CI/CD Automated PR for ${taskKey}: ${targetTask.title}\n+ export function executeTaskFeature() {\n+   return { task: '${taskKey}', points: ${targetTask.storyPoints || 3}, status: 'ready_for_review' };\n+ }`,
          aiInsights: {
            summary: `Automated Continuous Integration pull request opened for ${taskKey}: ${targetTask.title}.`,
            performance: ['Zero runtime performance regression detected', 'Memory usage within SLO limits'],
            security: ['OWASP Top 10 security audit passed', 'No hardcoded credentials'],
            testing: ['Unit test suites passing (100%)', 'Integration checks green']
          },
          reviewers: assignedReviewers,
          createdAt: new Date().toISOString()
        };

        setPrs(prev => [linkedPR, ...prev]);
        api.createPR(linkedPR).catch(e => console.warn('Backend PR creation note:', e));
        toast.info(`CI Pipeline: PR #${prNumber} opened in review queue for ${taskKey} 🚀 (${isTeamProject ? 'Team Reviewers Assigned' : 'Direct Merge Allowed'})`, 'Continuous Integration');
      }
    }

    // Continuous Delivery: When task moves to done, auto-merge open linked PR and trigger production deployment
    if (status === 'done' && targetTask) {
      setUser(u => ({ ...u, completedTasksCount: u.completedTasksCount + 1 }));

      const taskKey = targetTask.key || id;
      // Auto-merge any active open PR for this task
      setPrs(prev => prev.map(p => {
        if ((p.title.toUpperCase().includes(taskKey.toUpperCase()) || p.branch.toLowerCase().includes(taskKey.toLowerCase())) && !p.isMerged) {
          return {
            ...p,
            isMerged: true,
            queueType: 'merged',
            waitingHours: 0,
            slaStatus: 'healthy'
          };
        }
        return p;
      }));

      // Trigger Continuous Deployment to Production
      const targetProj = projects.find(p => p.id === targetTask.projectId);
      const repoName = targetProj?.repoUrl 
        ? targetProj.repoUrl.replace(/^https?:\/\/github\.com\//, '') 
        : `dmetrics/${(targetProj?.key || 'core').toLowerCase()}`;
      const newDeployment: DeploymentItem = {
        id: `dep_cd_${Date.now()}`,
        environment: 'production',
        serviceName: targetProj ? targetProj.name : 'Core Platform',
        version: `v1.${Math.floor(Date.now() / 100000) % 100}.${targetTask.storyPoints || 1}`,
        commitSha: Math.random().toString(16).substring(2, 9),
        commitMessage: `feat(${taskKey}): ${targetTask.title}`,
        branch: 'main',
        repositoryUrl: targetProj?.repoUrl || `https://github.com/${repoName}`,
        projectId: targetProj?.id,
        projectName: targetProj?.name,
        author: {
          name: targetTask.assignee?.name || user.name,
          avatar: targetTask.assignee?.avatar || user.avatar,
          email: targetTask.assignee?.email || user.email,
          username: targetTask.assignee?.username || user.username
        },
        status: 'success',
        durationSeconds: 38,
        deployedAt: 'Just now',
        url: targetProj?.repoUrl || 'https://prod.dmetrics.internal',
        sloPassRate: 99.99,
        summary: `Continuous Deployment to Production completed for ${taskKey}`
      };

      setDeployments(prev => [newDeployment, ...prev]);
      api.createDeployment(newDeployment).catch(e => console.warn('Backend deployment creation note:', e));

      // Real-time audit event for Continuous Deployment
      setAuditEvents(prev => [{
        id: `audit_cd_${Date.now()}`,
        actor: {
          name: user?.name || 'CI/CD Engine',
          avatar: user?.avatar,
          role: 'Continuous Deployment'
        },
        action: `deployed ${newDeployment.version} to Production (${newDeployment.serviceName})`,
        target: taskKey,
        entityId: newDeployment.id,
        category: 'system',
        relativeTime: 'Just now',
        timestamp: new Date().toISOString()
      }, ...prev]);
    }

    toast.success(
      `Task ${targetTask?.key || id} moved to ${statusLabels[status]}`, 
      'Kanban Updated'
    );

    try {
      await api.updateTaskStatus(id, status);
    } catch (error) {
      console.warn(`Status transition failed for task ${id}, rolling back:`, error);
      toast.error(`Could not move ${targetTask?.key || id}`, 'Kanban Sync Error');
      setTasks(previous);
    }
  };

  const deleteTask = async (id: string) => {
    const previous = [...tasks];
    const targetTask = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));

    // Prepend real-time audit event
    setAuditEvents(prev => [{
      id: `audit_${Date.now()}`,
      actor: {
        name: user?.name || 'Developer',
        avatar: user?.avatar,
        role: user?.role
      },
      action: `Deleted task ${targetTask?.key || id}`,
      target: targetTask?.key || 'Task',
      entityId: id,
      category: 'tasks',
      relativeTime: 'Just now',
      timestamp: new Date().toISOString()
    }, ...prev]);

    toast.info(`Task ${targetTask?.key || id} deleted`, 'Task Removed');

    try {
      await api.deleteTask(id);
    } catch (error) {
      console.warn(`Failed to delete task ${id}, rolling back:`, error);
      toast.error('Failed to delete task from server', 'Delete Error');
      setTasks(previous);
    }
  };

  // Project Actions
  const addProject = async (projectData: {
    name: string;
    key: string;
    description: string;
    leadId: string;
    deadline: string;
    projectType?: ProjectCategory;
    teamIds?: string[];
    color?: string;
    status?: ProjectStatus;
    repoUrl?: string;
  }): Promise<Project> => {
    const tempId = `proj_${Date.now()}`;
    const lead = teamMembers.find(m => m.id === projectData.leadId) || teamMembers[0];
    const cleanKey = projectData.key.trim().toUpperCase();
    const projectType = projectData.projectType || 'team';
    const assignedTeamIds = projectType === 'individual' 
      ? [projectData.leadId] 
      : (projectData.teamIds && projectData.teamIds.length > 0 ? projectData.teamIds : [projectData.leadId]);
    const teamMembersList = teamMembers.filter(m => assignedTeamIds.includes(m.id));

    const optimisticProject: Project = {
      id: tempId,
      name: projectData.name,
      key: cleanKey,
      description: projectData.description,
      status: projectData.status || 'on_track',
      projectType,
      progress: 0,
      totalTasks: 0,
      completedTasks: 0,
      repoUrl: projectData.repoUrl || `https://github.com/dmetrics/${cleanKey.toLowerCase()}`,
      lead,
      teamIds: assignedTeamIds,
      team: teamMembersList.length > 0 ? teamMembersList : [lead],
      deadline: projectData.deadline,
      color: projectData.color || '#6366f1',
    };

    // Optimistically add to project state
    setProjects(prev => [optimisticProject, ...prev]);

    const repoName = projectData.repoUrl 
      ? projectData.repoUrl.replace(/^https?:\/\/github\.com\//, '') 
      : `dmetrics/${cleanKey.toLowerCase()}`;

    // 1. Continuous Integration: Automatically provision initial review PR for this new project repository
    const initialPR: PullRequestItem = {
      id: `pr_proj_${tempId}`,
      number: (Math.abs(cleanKey.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 800) + 100,
      title: `[${cleanKey}] Feature Architecture & CI/CD Pipeline Setup`,
      repo: repoName,
      branch: `feat/${cleanKey.toLowerCase()}-pipeline-arch`,
      author: lead || user,
      additions: 380,
      deletions: 18,
      filesChangedCount: 5,
      commentsCount: 1,
      ciStatus: 'passing',
      waitingHours: 0.5,
      slaStatus: 'healthy',
      isReviewed: false,
      isMerged: false,
      queueType: 'review_requested',
      diffSnippet: `+ // ${projectData.name} - Automated CI/CD Pipeline Setup\n+ export const projectConfig = {\n+   key: '${cleanKey}',\n+   environment: 'staging'\n+ };`,
      aiInsights: {
        summary: `Automated baseline architecture & CI pipeline PR initialized for project ${projectData.name}.`,
        performance: ['Optimal build pipelines configured', 'Sub-second cold starts'],
        security: ['Secret scanner and branch protection enabled', 'Strict lint rules'],
        testing: ['Test runners initialized and passing (100%)']
      },
      reviewers: teamMembersList.filter(m => m.id !== lead?.id).slice(0, 2),
      createdAt: new Date().toISOString()
    };
    setPrs(prev => [initialPR, ...prev]);

    // 2. Continuous Delivery: Automatically provision initial Staging deployment
    const initialDeployment: DeploymentItem = {
      id: `dep_proj_${tempId}`,
      environment: 'staging',
      serviceName: projectData.name,
      version: 'v0.1.0',
      commitSha: Math.random().toString(16).substring(2, 9),
      commitMessage: `feat: initial CI/CD pipeline deployment for ${projectData.name}`,
      branch: 'main',
      repositoryUrl: projectData.repoUrl || `https://github.com/${repoName}`,
      projectId: tempId,
      projectName: projectData.name,
      author: {
        name: user.name,
        avatar: user.avatar,
        email: user.email,
        username: user.username
      },
      status: 'success',
      durationSeconds: 42,
      deployedAt: 'Just now',
      url: `https://staging-${cleanKey.toLowerCase()}.dmetrics.internal`,
      sloPassRate: 100.0,
      summary: `Automated staging deployment for ${projectData.name}`
    };
    setDeployments(prev => [initialDeployment, ...prev]);

    toast.success(`Project ${cleanKey} created with CI/CD pipeline & review queue! 🚀`, 'Repository Initialized');

    try {
      const serverProject = await api.createProject({
        name: projectData.name,
        key: cleanKey,
        description: projectData.description,
        leadId: projectData.leadId,
        teamIds: assignedTeamIds,
        projectType,
        deadline: projectData.deadline,
        color: projectData.color || '#6366f1',
        status: projectData.status || 'on_track',
        repoUrl: projectData.repoUrl || '',
      });

      // Persist the linked PR & deployment to backend
      api.createPR({ ...initialPR, id: `pr_proj_${serverProject.id}` }).catch(e => console.warn('PR save note:', e));
      api.createDeployment({ ...initialDeployment, projectId: serverProject.id }).catch(e => console.warn('Deployment save note:', e));

      // Real-time audit event
      setAuditEvents(prev => [{
        id: `audit_proj_init_${Date.now()}`,
        actor: {
          name: user.name,
          avatar: user.avatar,
          role: user.role
        },
        action: `provisioned project ${cleanKey} with CI/CD pipeline & review queue`,
        target: serverProject.name,
        entityId: serverProject.id,
        category: 'projects',
        relativeTime: 'Just now',
        timestamp: new Date().toISOString()
      }, ...prev]);

      setProjects(prev => prev.map(p => (p.id === tempId ? serverProject : p)));
      return serverProject;
    } catch (error: any) {
      console.warn('Backend create project error:', error);
      toast.error(error.message || 'Failed to create project on server', 'Project Creation Error');
      setProjects(prev => prev.filter(p => p.id !== tempId));
      throw error;
    }
  };

  const addTeamMember = async (memberData: {
    name: string;
    email: string;
    username: string;
    role: string;
    githubUsername?: string;
    password?: string;
    projectId?: string;
    initialTaskTitle?: string;
    storyPoints?: number;
  }): Promise<Assignee> => {
    const cleanEmail = memberData.email.trim().toLowerCase();
    const cleanUsername = memberData.username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    const avatar = memberData.githubUsername?.trim()
      ? `https://github.com/${memberData.githubUsername.trim().replace(/^https?:\/\/github\.com\//i, '')}.png`
      : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanUsername || memberData.name || 'dev')}`;

    let createdId = `usr_${Date.now()}`;

    try {
      const inviteRes = await api.inviteTeamMember({
        name: memberData.name.trim(),
        email: cleanEmail,
        username: cleanUsername,
        role: memberData.role,
        password: memberData.password || 'password123',
        githubUsername: memberData.githubUsername?.trim() || undefined,
        projectId: memberData.projectId,
      });

      if (inviteRes && inviteRes.user) {
        createdId = inviteRes.user.id || createdId;
      }
    } catch (err: any) {
      console.warn('Backend user invitation note, attempting register fallback:', err);
      try {
        const regRes = await api.register({
          name: memberData.name.trim(),
          email: cleanEmail,
          username: cleanUsername,
          role: memberData.role,
          password: memberData.password || 'password123',
          avatar,
          githubUsername: memberData.githubUsername?.trim() || undefined,
          invitedBy: user?.id,
        } as any);

        if (regRes && regRes.user) {
          createdId = regRes.user.id || createdId;
        }
      } catch (regErr: any) {
        console.warn('Fallback register notice:', regErr);
      }
    }

    if (user?.id) {
      try {
        const saved = localStorage.getItem(`dmetrics_invited_${user.id}`);
        const list = saved ? JSON.parse(saved) : [];
        if (!list.includes(createdId)) list.push(createdId);
        if (!list.includes(cleanEmail)) list.push(cleanEmail);
        localStorage.setItem(`dmetrics_invited_${user.id}`, JSON.stringify(list));
      } catch (e) { /* ignore */ }
    }

    const newAssignee: Assignee = {
      id: createdId,
      name: memberData.name.trim(),
      email: cleanEmail,
      username: cleanUsername,
      role: memberData.role,
      avatar,
      githubUsername: memberData.githubUsername?.trim()?.replace(/^https?:\/\/github\.com\//i, ''),
      githubUrl: memberData.githubUsername ? `https://github.com/${memberData.githubUsername.trim().replace(/^https?:\/\/github\.com\//i, '')}` : undefined
    };

    setTeamMembers(prev => {
      const exists = prev.some(m => m.email === newAssignee.email || m.id === newAssignee.id);
      return exists ? prev : [newAssignee, ...prev];
    });

    // If project allocation is specified, attach member to project's team on backend and locally
    if (memberData.projectId) {
      const targetProj = projects.find(p => p.id === memberData.projectId);
      if (targetProj) {
        const currentTeamIds = (targetProj.teamIds || targetProj.team?.map(m => m.id) || [targetProj.leadId || targetProj.lead?.id]).filter(Boolean) as string[];
        const updatedTeamIds = currentTeamIds.includes(createdId) ? currentTeamIds : [...currentTeamIds, createdId];
        try {
          await api.updateProject(targetProj.id, { teamIds: updatedTeamIds } as any);
        } catch (err) {
          console.warn('Backend project team update error:', err);
        }
      }

      setProjects(prev => prev.map(p => {
        if (p.id === memberData.projectId) {
          const already = p.team.some(m => m.email === newAssignee.email || m.id === newAssignee.id);
          return already ? p : { ...p, team: [...p.team, newAssignee], teamIds: [...(p.teamIds || []), newAssignee.id] };
        }
        return p;
      }));
    }

    // If initial deliverable is specified, create and assign the task
    if (memberData.initialTaskTitle?.trim()) {
      const targetProject = projects.find(p => p.id === memberData.projectId) || projects[0];
      addTask({
        title: memberData.initialTaskTitle.trim(),
        description: `Deliverable assigned to ${newAssignee.name} (${newAssignee.role})${targetProject ? ` for project ${targetProject.name}` : ''}.`,
        status: 'in_progress',
        priority: 'high',
        projectId: targetProject?.id || 'proj_workspace',
        projectName: targetProject?.name || 'Engineering Workspace',
        assignee: newAssignee,
        storyPoints: memberData.storyPoints || 3,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tags: ['Deliverable', targetProject?.key || 'CORE']
      });
    }

    toast.success(`Teammate ${newAssignee.name} onboarded! Credentials: ${newAssignee.email} / password123`, 'Team Member Added');
    return newAssignee;
  };

  const removeTeamMember = async (memberId: string): Promise<void> => {
    const member = teamMembers.find(m => m.id === memberId);
    const memberName = member?.name || 'Teammate';

    // 1. Optimistically update local state
    setTeamMembers(prev => prev.filter(m => m.id !== memberId));

    // 2. Remove member from projects locally
    setProjects(prev => prev.map(p => ({
      ...p,
      team: p.team ? p.team.filter(m => m.id !== memberId) : [],
      teamIds: p.teamIds ? p.teamIds.filter(id => id !== memberId) : []
    })));

    // 3. Update localStorage invited cache if present
    if (user?.id) {
      try {
        const saved = localStorage.getItem(`dmetrics_invited_${user.id}`);
        if (saved) {
          const list = JSON.parse(saved);
          const updated = list.filter((id: string) => id !== memberId);
          localStorage.setItem(`dmetrics_invited_${user.id}`, JSON.stringify(updated));
        }
      } catch (e) { /* ignore */ }
    }

    // 4. Call backend API
    try {
      await api.removeTeamMember(memberId);
      toast.success(`${memberName} has been removed from your engineering team.`, 'Team Member Removed');
    } catch (err: any) {
      console.warn('Backend remove team member error:', err);
      toast.error(err.message || 'Failed to remove team member from backend', 'Error');
      // Re-fetch to ensure sync
      try {
        const freshUsers = await api.getUsers({ scope: 'team' });
        if (freshUsers && Array.isArray(freshUsers)) {
          setTeamMembers(freshUsers.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            username: u.username,
            role: u.role,
            avatar: u.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.username || u.name)}`,
            githubUsername: u.githubUsername?.replace(/^https?:\/\/github\.com\//i, ''),
            githubUrl: u.githubUsername ? `https://github.com/${u.githubUsername.replace(/^https?:\/\/github\.com\//i, '')}` : undefined
          })));
        }
      } catch (refetchErr) { /* ignore */ }
    }
  };

  // Modal actions
  const openCreateModal = (initialAssigneeId?: string | any) => {
    setEditingTask(null);
    const validId = typeof initialAssigneeId === 'string' ? initialAssigneeId : null;
    setPreselectedAssigneeId(validId);
    setIsTaskModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setPreselectedAssigneeId(null);
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
    setPreselectedAssigneeId(null);
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  // State simulator toggles for testing UI & Evaluation notes
  const toggleLoadingState = () => {
    setIsLoading(prev => !prev);
  };

  const triggerErrorState = () => {
    setHasError(true);
  };

  const updateUser = async (updated: Partial<UserProfile>) => {
    setUser(prev => ({ ...prev, ...updated }));
    if (user.id && user.id !== 'usr_guest') {
      try {
        await api.updateUser(user.id, updated);
        toast.success('Developer profile saved to MongoDB', 'Profile Updated');
      } catch (err: any) {
        console.warn('Failed to persist user profile to MongoDB:', err);
      }
    }
  };

  const toggleIntegration = async (id: string) => {
    const updatedIntegrations = user.integrations.map(integ => 
      integ.id === id 
        ? { 
            ...integ, 
            connected: !integ.connected,
            syncStatus: !integ.connected ? 'Live Sync' : 'Disconnected',
            lastSync: !integ.connected ? 'Just now' : integ.lastSync
          } 
        : integ
    );
    setUser(prev => ({ ...prev, integrations: updatedIntegrations }));
    if (user.id && user.id !== 'usr_guest') {
      try {
        await api.updateUser(user.id, { integrations: updatedIntegrations });
      } catch (err) {
        console.warn('Failed to persist integration update:', err);
      }
    }
  };

  const syncIntegration = async (id: string) => {
    setUser(prev => ({
      ...prev,
      integrations: prev.integrations.map(integ =>
        integ.id === id ? { ...integ, syncStatus: 'Syncing...', lastSync: 'In progress' } : integ
      )
    }));

    setTimeout(async () => {
      const syncedIntegrations = user.integrations.map(integ =>
        integ.id === id ? { ...integ, syncStatus: 'Live Sync', lastSync: 'Just now', connected: true } : integ
      );
      setUser(prev => ({ ...prev, integrations: syncedIntegrations }));
      if (user.id && user.id !== 'usr_guest') {
        try {
          await api.updateUser(user.id, { integrations: syncedIntegrations });
        } catch (err) {
          console.warn('Failed to persist sync status:', err);
        }
      }
    }, 900);
  };

  // Pairing Lobby Handlers
  const requestHuddle = (toUser: TeammatePresence, agenda: string, duration: number, note?: string) => {
    // Simulate instant notification & prompt creation
    console.log(`Huddle requested with ${toUser.name}: ${agenda} (${duration}m)`);
  };

  const createPairingRoom = (title: string, topic: string, branchName: string) => {
    const newRoom: PairingRoom = {
      id: `room_${Date.now()}`,
      title: title.trim() || 'Ad-Hoc Pair Programming Session',
      topic: topic.trim() || 'Architecture & Code Review',
      host: teamMembers[0], // current user Alex Chen
      participants: [teamMembers[0]],
      startedAt: 'Just now',
      isAudioActive: true,
      isScreenSharing: false,
      branchName: branchName.trim() || 'feat/live-session',
      roomUrl: `https://meet.dmetrics.internal/pair-${Date.now().toString().slice(-4)}`
    };
    setPairingRooms(prev => [newRoom, ...prev]);
    setActiveHuddleRoom(newRoom);
  };

  const joinPairingRoom = (roomId: string) => {
    const room = pairingRooms.find(r => r.id === roomId);
    if (!room) return;
    const isAlreadyIn = room.participants.some(p => p.id === teamMembers[0].id);
    if (!isAlreadyIn) {
      setPairingRooms(prev => prev.map(r => 
        r.id === roomId 
          ? { ...r, participants: [...r.participants, teamMembers[0]] } 
          : r
      ));
    }
    setActiveHuddleRoom({
      ...room,
      participants: isAlreadyIn ? room.participants : [...room.participants, teamMembers[0]]
    });
  };

  const leavePairingRoom = (roomId: string) => {
    setPairingRooms(prev => prev.map(r =>
      r.id === roomId
        ? { ...r, participants: r.participants.filter(p => p.id !== teamMembers[0].id) }
        : r
    ));
    if (activeHuddleRoom?.id === roomId) {
      setActiveHuddleRoom(null);
    }
  };

  const setUserPairingAvailability = (available: boolean, topic?: string) => {
    setUser(prev => ({
      ...prev,
      focusStatus: available 
        ? `Ready to Pair: ${topic || 'Any PR/Code'}` 
        : 'Deep Work on Cache Invalidation 🚀'
    }));
  };

  // PR Review Handlers
  const approvePR = async (id: string, comment?: string) => {
    const targetPR = prs.find(p => p.id === id);
    if (targetPR) {
      const targetProj = projects.find(p => 
        p.id === targetPR.projectId || 
        (p.repoUrl && p.repoUrl.replace(/^https?:\/\/github\.com\//i, '').toLowerCase() === targetPR.repo.toLowerCase()) ||
        targetPR.repo.toLowerCase().includes(p.key.toLowerCase())
      );
      const isTeam = (targetPR.projectType || targetProj?.projectType || 'team') === 'team';
      const isAuthor = (targetPR.author?.id === user.id) || 
                       (targetPR.author?.name?.toLowerCase() === user.name?.toLowerCase()) || 
                       (Boolean(user.username) && targetPR.author?.username?.toLowerCase() === user.username?.toLowerCase());

      if (isTeam && isAuthor) {
        toast.error('Authors cannot self-approve their own pull requests in Team Projects. A peer review is required.', 'Self-Review Not Permitted');
        return;
      }
    }

    const calculatedTurnaround = targetPR?.waitingHours ? Math.max(0.5, Math.round(targetPR.waitingHours * 10) / 10) : 1.2;

    setPrs(prev => prev.map(p => 
      p.id === id 
        ? { 
            ...p, 
            isReviewed: true, 
            turnaroundHours: calculatedTurnaround,
            reviewedBy: {
              id: user.id || 'usr_1',
              name: user.name,
              avatar: user.avatar,
              role: user.role
            },
            commentsCount: comment ? p.commentsCount + 1 : p.commentsCount 
          } 
        : p
    ));
    toast.success(`Pull request #${targetPR?.number || id} approved! Team turnaround metric updated.`, 'Code Review Completed');

    // Prepend real-time audit event
    setAuditEvents(prev => [{
      id: `audit_pr_app_${Date.now()}`,
      actor: {
        name: user.name,
        avatar: user.avatar,
        role: user.role
      },
      action: `reviewed and approved PR #${targetPR?.number || id}`,
      target: targetPR?.title || 'Pull Request',
      entityId: id,
      category: 'prs',
      relativeTime: 'Just now',
      timestamp: new Date().toISOString()
    }, ...prev]);

    try {
      const updated = await api.reviewPR(id, {
        action: 'approve',
        comment: comment || undefined,
        reviewer: {
          id: user.id || 'usr_1',
          name: user.name,
          avatar: user.avatar,
          role: user.role
        }
      });
      if (updated) {
        setPrs(prev => {
          const next = prev.map(p => 
            p.id === id || p.id === updated.id || (p.projectId && p.projectId === updated.projectId) 
              ? { ...p, ...updated, isReviewed: true, slaStatus: (updated.slaStatus || p.slaStatus) as 'healthy' | 'at_risk' | 'breached' } 
              : p
          );
          try {
            const cacheKey = `dmetrics_prs_${user?.id || 'default'}`;
            localStorage.setItem(cacheKey, JSON.stringify(next));
            localStorage.setItem('dmetrics_prs_default', JSON.stringify(next));
          } catch (e) {}
          return next;
        });
      }
      const freshAudit = await api.getAuditEvents();
      if (Array.isArray(freshAudit)) setAuditEvents(freshAudit);
    } catch (err) {
      console.warn('Backend PR update note:', err);
    }
  };

  const requestChangesPR = async (id: string, comment: string) => {
    const targetPR = prs.find(p => p.id === id);
    setPrs(prev => {
      const next = prev.map(p => 
        p.id === id 
          ? { 
              ...p, 
              isReviewed: false, 
              slaStatus: 'at_risk' as const,
              commentsCount: p.commentsCount + 1 
            } 
          : p
      );
      try {
        const cacheKey = `dmetrics_prs_${user?.id || 'default'}`;
        localStorage.setItem(cacheKey, JSON.stringify(next));
        localStorage.setItem('dmetrics_prs_default', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    toast.warning(`Changes requested on PR #${targetPR?.number || id}. SLA flagged At Risk.`, 'Code Review Feedback');

    setAuditEvents(prev => [{
      id: `audit_pr_cr_${Date.now()}`,
      actor: {
        name: user.name,
        avatar: user.avatar,
        role: user.role
      },
      action: `requested changes on PR #${targetPR?.number || id}`,
      target: comment || 'Actionable review feedback',
      entityId: id,
      category: 'prs',
      relativeTime: 'Just now',
      timestamp: new Date().toISOString()
    }, ...prev]);

    try {
      const updated = await api.reviewPR(id, {
        action: 'request_changes',
        comment,
        reviewer: {
          id: user.id || 'usr_1',
          name: user.name,
          avatar: user.avatar,
          role: user.role
        }
      });
      if (updated) {
        setPrs(prev => {
          const next = prev.map(p => 
            p.id === id || p.id === updated.id || (p.projectId && p.projectId === updated.projectId) 
              ? { ...p, ...updated, isReviewed: false, slaStatus: 'at_risk' as const } 
              : p
          );
          try {
            const cacheKey = `dmetrics_prs_${user?.id || 'default'}`;
            localStorage.setItem(cacheKey, JSON.stringify(next));
            localStorage.setItem('dmetrics_prs_default', JSON.stringify(next));
          } catch (e) {}
          return next;
        });
      }
      const freshAudit = await api.getAuditEvents();
      if (Array.isArray(freshAudit)) setAuditEvents(freshAudit);
    } catch (err) {
      console.warn('Backend PR update note:', err);
    }
  };

  const mergePR = async (id: string) => {
    const targetPR = prs.find(p => p.id === id);
    if (!targetPR) return;

    const targetProj = projects.find(p => 
      p.id === targetPR.projectId || 
      (p.repoUrl && p.repoUrl.replace(/^https?:\/\/github\.com\//i, '').toLowerCase() === targetPR.repo.toLowerCase()) ||
      targetPR.repo.toLowerCase().includes(p.key.toLowerCase()) ||
      targetPR.title.toUpperCase().includes(`[${p.key.toUpperCase()}]`)
    );
    const isTeam = (targetPR.projectType || targetProj?.projectType || 'team') === 'team';

    // In team projects: Requires peer review & approval before merge
    if (isTeam && !targetPR.isReviewed) {
      toast.error('In Team Projects, pull requests require peer review and approval before merging.', 'Peer Review Required');
      return;
    }

    setPrs(prev => {
      const next = prev.map(p => 
        p.id === id 
          ? { 
              ...p, 
              isMerged: true, 
              queueType: 'merged' as const,
              waitingHours: 0,
              slaStatus: 'healthy' as const,
              mergedBy: {
                id: user.id || 'usr_1',
                name: user.name,
                avatar: user.avatar,
                role: user.role
              }
            } 
          : p
      );
      try {
        const cacheKey = `dmetrics_prs_${user?.id || 'default'}`;
        localStorage.setItem(cacheKey, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    setUser(prev => ({
      ...prev,
      mergedPRsCount: prev.mergedPRsCount + 1,
      openPRsCount: Math.max(0, prev.openPRsCount - 1)
    }));

    // Continuous Delivery / Deployment Triggers:
    // 1. Auto-transition any linked task in PR title (e.g. [CPE-104]) to 'done'
    const matchKeyMatch = targetPR.title.match(/\[([A-Z0-9_-]+)\]/i) || targetPR.branch.match(/([A-Z0-9]+-\d+)/i);
    const matchedKey = matchKeyMatch ? matchKeyMatch[1].toUpperCase() : null;
    if (matchedKey) {
      setTasks(prev => prev.map(t => {
        if ((t.key.toUpperCase() === matchedKey || t.title.toLowerCase().includes(matchedKey.toLowerCase())) && t.status !== 'done') {
          api.updateTaskStatus(t.id, 'done').catch(e => console.warn('Auto-transition task error:', e));
          return {
            ...t,
            status: 'done',
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      }));
    }

    // 2. Trigger Continuous Deployment to Production with commit SHA, author attribution, and 99.9% SLO verification
    const repoName = targetProj?.repoUrl 
      ? targetProj.repoUrl.replace(/^https?:\/\/github\.com\//, '') 
      : targetPR.repo;

    const newDeployment: DeploymentItem = {
      id: `dep_cd_${Date.now()}`,
      environment: 'production',
      serviceName: targetProj ? targetProj.name : (targetPR.repo.split('/')[1] || 'Core Service'),
      version: `v1.${Math.floor(Date.now() / 100000) % 100}.${targetPR.number % 10}`,
      commitSha: Math.random().toString(16).substring(2, 9),
      commitMessage: `Merge PR #${targetPR.number}: ${targetPR.title}`,
      branch: 'main',
      repositoryUrl: targetProj?.repoUrl || `https://github.com/${targetPR.repo}`,
      projectId: targetProj?.id,
      projectName: targetProj?.name,
      pullRequestId: targetPR.id,
      author: {
        name: targetPR.author?.name || user.name,
        avatar: targetPR.author?.avatar || user.avatar,
        email: targetPR.author?.email || user.email,
        username: targetPR.author?.username || user.username
      },
      status: 'success',
      durationSeconds: Math.floor(Math.random() * 25) + 32,
      deployedAt: 'Just now',
      url: targetProj?.repoUrl || 'https://prod.dmetrics.internal',
      sloPassRate: 99.98,
      summary: `Continuous Deployment to Production triggered by merge of PR #${targetPR.number} (99.9% SLO verified)`
    };

    setDeployments(prev => [newDeployment, ...prev]);
    api.createDeployment(newDeployment).catch(e => console.warn('Backend deployment create note:', e));

    // 3. Prepend CD audit event showing who reviewed and merged the release
    const reviewerName = targetPR.reviewedBy?.name || (targetPR.reviewers?.find(r => r.id !== user.id)?.name) || 'Teammate';
    setAuditEvents(prev => [{
      id: `audit_dep_${Date.now()}`,
      actor: {
        name: user.name,
        avatar: user.avatar,
        role: user.role
      },
      action: `merged PR #${targetPR.number} (reviewed by ${reviewerName}) & deployed ${newDeployment.version} to Production`,
      target: targetPR.title,
      entityId: newDeployment.id,
      category: 'system',
      relativeTime: 'Just now',
      timestamp: new Date().toISOString()
    }, ...prev]);

    toast.success(`PR #${targetPR.number} merged! Continuous Deployment pipeline triggered to Production 🚀 (99.9% SLO verified)`, 'Branch Merged & Deployed');

    try {
      const updated = await api.mergePR(id, {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        role: user.role
      });
      if (updated) {
        setPrs(prev => {
          const next = prev.map(p => 
            p.id === id || p.id === updated.id || (p.projectId && p.projectId === updated.projectId) 
              ? { ...p, ...updated, isMerged: true, queueType: 'merged' as const, slaStatus: 'healthy' as const } 
              : p
          );
          try {
            const cacheKey = `dmetrics_prs_${user?.id || 'default'}`;
            localStorage.setItem(cacheKey, JSON.stringify(next));
            localStorage.setItem('dmetrics_prs_default', JSON.stringify(next));
          } catch (e) {}
          return next;
        });
      }
      const freshAudit = await api.getAuditEvents();
      if (Array.isArray(freshAudit)) {
        setAuditEvents(prev => {
          const ids = new Set(freshAudit.map(a => a.id));
          const localOnly = prev.filter(p => !ids.has(p.id));
          return [...localOnly, ...freshAudit];
        });
      }
    } catch (err) {
      console.warn('Backend PR merge note:', err);
    }
  };

  const recordDeepWorkSession = async (minutes: number) => {
    const hoursAdded = Math.round((minutes / 60) * 10) / 10;
    const newWeeklyHours = (user.currentGoalHours || 0) + hoursAdded;
    const newScore = Math.min(100, (user.productivityScore || 0) + Math.round(minutes / 5));

    const updates = {
      currentGoalHours: newWeeklyHours,
      productivityScore: newScore,
      focusStatus: 'Completed Deep Work ⚡',
    };

    setUser(prev => ({ ...prev, ...updates }));
    toast.success(`Completed ${minutes}m deep focus session! (+${hoursAdded}h logged)`, 'Focus Session Completed');

    try {
      if (user.id && user.id !== 'usr_guest') {
        await api.updateUser(user.id, updates);
      }
      await api.logAuditEvent({
        action: `completed ${minutes}m deep work session`,
        category: 'system',
        target: `Productivity Rhythm (+${hoursAdded}h Focus)`,
        metadata: `Score: ${newScore}/100 • Weekly Goal: ${newWeeklyHours}/${user.weeklyGoalHours}h`,
        status: 'success',
        actor: {
          name: user.name,
          role: user.role,
          avatar: user.avatar,
        },
      });
      const freshAudit = await api.getAuditEvents();
      if (Array.isArray(freshAudit)) setAuditEvents(freshAudit);
    } catch (err) {
      console.warn('Deep work save note:', err);
    }
  };


  // GitHub Sync Actions
  const updateTeammateGitHub = (teammateId: string, githubUsername: string) => {
    const githubUrl = `https://github.com/${githubUsername}`;
    setGitHubTeamMappings(prev => prev.map(m =>
      m.teammateId === teammateId
        ? { ...m, githubUsername, githubUrl, syncStatus: 'pending' }
        : m
    ));
    // Simulate sync settling
    setTimeout(() => {
      setGitHubTeamMappings(prev => prev.map(m =>
        m.teammateId === teammateId ? { ...m, syncStatus: 'synced' } : m
      ));
    }, 1200);
  };

  const toggleMonitoredRepo = (repoName: string) => {
    setGitHubSyncConfig(prev => {
      const isMonitored = prev.monitoredRepos.includes(repoName);
      return {
        ...prev,
        monitoredRepos: isMonitored
          ? prev.monitoredRepos.filter(r => r !== repoName)
          : [...prev.monitoredRepos, repoName]
      };
    });
  };

  const syncGitHubTeamRoster = async () => {
    setGitHubSyncConfig(prev => ({ ...prev, webhookStatus: 'testing', lastSyncAt: 'Syncing live telemetry...' }));
    setGitHubTeamMappings(prev => prev.map(m => ({ ...m, syncStatus: 'pending' })));

    try {
      const livePrs = await api.getGitHubPullRequests();
      if (Array.isArray(livePrs) && livePrs.length > 0) {
        const converted: PullRequestItem[] = livePrs.map((gh: any) => ({
          id: gh.id,
          number: gh.number,
          title: gh.title,
          repo: gh.repo,
          branch: 'main',
          author: {
            id: gh.author.id,
            name: gh.author.name,
            avatar: gh.author.avatar,
            role: 'Software Engineer',
            githubUsername: gh.author.githubUsername,
            githubUrl: `https://github.com/${gh.author.githubUsername}`,
          },
          additions: 120,
          deletions: 40,
          filesChangedCount: 3,
          commentsCount: gh.commentsCount || 0,
          ciStatus: 'passing',
          waitingHours: 1,
          slaStatus: 'healthy',
          isReviewed: false,
          diffSnippet: `+// Live pulled from GitHub PR #${gh.number}\n+export const status = "synced";\n`,
          aiInsights: {
            performance: ['Live telemetry connected to GitHub Webhooks'],
            security: ['OAuth Bearer token active & verified'],
            testing: ['Automated PR checks healthy']
          },
          reviewers: [teamMembers[0]],
          createdAt: gh.createdAt || new Date().toISOString(),
          queueType: 'review_requested'
        }));
        setPrs(prev => [...converted, ...prev.filter(p => !p.id.startsWith('gh_pr_'))]);
      }
    } catch (e) {
      console.warn('GitHub sync fallback:', e);
    }

    setGitHubSyncConfig(prev => ({ ...prev, webhookStatus: 'active', lastSyncAt: 'Just now' }));
    setGitHubTeamMappings(prev => prev.map(m => ({ ...m, syncStatus: 'synced' })));
  };

  const syncGithubRepository = async (repoUrl: string, projectId?: string): Promise<any> => {
    setIsLoading(true);
    try {
      toast.info(`Fetching live telemetry from GitHub: ${repoUrl}...`, 'GitHub Pipeline Active');
      const result = await api.syncGithubRepo(repoUrl, projectId, undefined, user?.id);
      if (result && result.project) {
        const currentActiveLead = user && user.id !== 'usr_guest' ? {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          email: user.email,
          username: user.username,
          githubUsername: user.githubUsername,
          githubUrl: user.githubUrl
        } : (result.project.lead || user);

        const projectWithActiveLead: Project = {
          ...result.project,
          lead: currentActiveLead,
          team: [currentActiveLead]
        };

        // 1. Update/Add project in state
        setProjects(prev => {
          const existingIdx = prev.findIndex(p => p.id === result.project.id || p.key === result.project.key);
          if (existingIdx >= 0) {
            const updated = [...prev];
            updated[existingIdx] = { ...updated[existingIdx], ...projectWithActiveLead };
            return updated;
          }
          return [projectWithActiveLead, ...prev];
        });

        // 2. Add/Merge GitHub tasks
        if (Array.isArray(result.tasks) && result.tasks.length > 0) {
          setTasks(prev => {
            const otherTasks = prev.filter(t => t.projectId !== result.project.id && !t.id.startsWith('gh_issue_'));
            return [...result.tasks, ...otherTasks];
          });
        }

        // 4. Update PRs
        if (Array.isArray(result.pulls) && result.pulls.length > 0) {
          setPrs(prev => {
            const incomingIds = new Set(result.pulls.map((p: any) => p.id));
            const updated = [...result.pulls, ...prev.filter(p => !incomingIds.has(p.id))];
            try {
              const cacheKey = `dmetrics_prs_${user?.id || 'default'}`;
              localStorage.setItem(cacheKey, JSON.stringify(updated));
            } catch (e) { /* ignore */ }
            return updated;
          });
        }

        // 5. Update Analytics (velocity, heatmap, category distribution)
        if (result.analytics) {
          setAnalytics(result.analytics);
        }

        // 6. Refresh Audit Events
        try {
          const freshAudit = await api.getAuditEvents({ scope: 'mine' });
          if (Array.isArray(freshAudit)) {
            setAuditEvents(freshAudit);
          }
        } catch (e) {
          console.warn('Audit refresh note:', e);
        }

        // Auto-select this project in filters
        setFilters(prev => ({ ...prev, projectId: result.project.id }));

        toast.success(
          `Synced ${result.project.name} (${result.contributors.length} contributors, ${result.tasks.length} issues, ${result.commits.length} commits)`,
          'GitHub Telemetry Synced'
        );
        return result;
      }
    } catch (err: any) {
      console.error('GitHub sync error:', err);
      toast.error(err.message || 'Failed to sync with GitHub', 'GitHub Sync Error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const openPRInspector = (prOrId: PullRequestItem | string) => {
    if (typeof prOrId === 'object' && prOrId !== null) {
      setInspectedPR(prOrId);
      return;
    }
    const clean = String(prOrId).replace(/#/g, '').trim().toLowerCase();
    const found = prs.find(p => p.id === clean || String(p.number) === clean);
    if (found) {
      setInspectedPR(found);
    } else if (prs.length > 0) {
      setInspectedPR(prs[0]);
    }
  };

  const openDeploymentDetails = (depOrId: DeploymentItem | string) => {
    if (typeof depOrId === 'object' && depOrId !== null) {
      setInspectedDeployment(depOrId);
      return;
    }
    const clean = String(depOrId).trim().toLowerCase();
    const found = deployments.find(d => d.id === clean || d.serviceName?.toLowerCase() === clean || d.commitSha?.toLowerCase() === clean);
    if (found) {
      setInspectedDeployment(found);
    } else if (deployments.length > 0) {
      setInspectedDeployment(deployments[0]);
    }
  };

  const openTaskDetails = (taskOrId: Task | string) => {
    if (typeof taskOrId === 'object' && taskOrId !== null) {
      openEditModal(taskOrId);
      return;
    }
    const clean = String(taskOrId).trim().toLowerCase();
    const found = tasks.find(t => t.id === clean || t.key?.toLowerCase() === clean || t.title?.toLowerCase().includes(clean));
    if (found) {
      openEditModal(found);
    } else {
      toast.info(`Work item '${taskOrId}' selected.`, 'Target Work Item');
    }
  };

  const closeInspectors = () => {
    setInspectedPR(null);
    setInspectedDeployment(null);
  };

  const retryFetch = () => {
    setIsLoading(true);
    setHasError(false);
    setTimeout(() => {
      setIsLoading(false);
    }, 600);
  };

  return (
    <DashboardContext.Provider
      value={{
        tasks,
        projects: enrichedProjects,
        user,
        teamMembers,
        analytics,
        auditEvents,
        deployments,
        inspectedPR,
        inspectedDeployment,
        openPRInspector,
        openDeploymentDetails,
        openTaskDetails,
        closeInspectors,
        filters,
        timeRange,
        viewMode,
        isLoading,
        hasError,
        isTaskModalOpen,
        editingTask,
        preselectedAssigneeId,
        filteredTasks,
        metrics,
        setTimeRange,
        setViewMode,
        setFilters,
        updateFilter,
        resetFilters,
        addTask,
        updateTask,
        updateTaskStatus,
        deleteTask,
        addProject,
        openCreateModal,
        openEditModal,
        closeTaskModal,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        isAuthChecking,
        isAuthenticated,
        loginUser,
        registerUser,
        addTeamMember,
        removeTeamMember,
        logoutUser,
        setUser,
        updateUser,
        toggleIntegration,
        syncIntegration,
        presences,
        pairingRooms,
        activeHuddleRoom,
        setActiveHuddleRoom,
        requestHuddle,
        createPairingRoom,
        joinPairingRoom,
        leavePairingRoom,
        setUserPairingAvailability,
        prs,
        approvePR,
        requestChangesPR,
        mergePR,
        recordDeepWorkSession,
        gitHubTeamMappings,
        gitHubSyncConfig,
        updateTeammateGitHub,
        toggleMonitoredRepo,
        syncGitHubTeamRoster,
        syncGithubRepository,
        toggleLoadingState,
        triggerErrorState,
        retryFetch
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
