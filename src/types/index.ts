export type TaskStatus = 'backlog' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Assignee {
  id: string;
  name: string;
  avatar: string;
  role: string;
  email?: string;
  username?: string;
  githubUsername?: string;
  githubUrl?: string;
}

export interface Task {
  id: string;
  key: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  projectName: string;
  assignee: Assignee;
  assigneeId?: string;
  assignerId?: string;
  assigner?: Assignee;
  createdById?: string;
  createdBy?: Assignee;
  storyPoints: number;
  dueDate: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = 'on_track' | 'at_risk' | 'delayed';
export type ProjectCategory = 'team' | 'individual';

export interface Project {
  id: string;
  name: string;
  key: string;
  description: string;
  status: ProjectStatus;
  projectType?: ProjectCategory;
  progress: number;
  totalTasks: number;
  completedTasks: number;
  repoUrl: string;
  leadId?: string;
  teamIds?: string[];
  lead: Assignee;
  team: Assignee[];
  deadline: string;
  color: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MetricCardData {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  change: number;
  changeType: 'increase' | 'decrease';
  trend: number[];
  period: string;
  iconName: string;
  badgeText?: string;
}

export interface ActivityDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  dayOfWeek?: number;
  weekIndex?: number;
}

export interface SprintVelocity {
  sprint: string;
  planned: number;
  completed: number;
}

export interface WorkCategory {
  category: string;
  hours: number;
  percentage: number;
  color: string;
}

export interface Integration {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  syncStatus: string;
  lastSync: string;
}

export interface DeveloperSkill {
  name: string;
  category: 'languages' | 'distributed' | 'cloud' | 'security';
  level: 'Expert' | 'Senior' | 'Advanced';
  mastery: number; // 0 - 100
  color: string;
  linesWritten: string;
}

export interface AuthoredContribution {
  id: string;
  prNumber: string;
  title: string;
  repo: string;
  additions: number;
  deletions: number;
  status: 'merged' | 'approved' | 'in_review';
  reviewTurnaround: string;
  impact: string;
  mergedAt: string;
  url: string;
}

export interface UserProfile {
  id?: string;
  name: string;
  role: string;
  username: string;
  email: string;
  isEmailVerified?: boolean;
  avatar: string;
  bio?: string;
  location?: string;
  timezone?: string;
  githubUsername?: string;
  githubUrl?: string;
  githubToken?: string;
  productivityScore: number;
  activeStreak: number;
  weeklyGoalHours: number;
  currentGoalHours: number;
  completedTasksCount: number;
  openPRsCount: number;
  mergedPRsCount: number;
  focusStatus: string;
  skills?: DeveloperSkill[];
  contributions?: AuthoredContribution[];
  integrations: Integration[];
}

export interface FilterState {
  search: string;
  status: TaskStatus | 'all';
  priority: TaskPriority | 'all';
  projectId: string | 'all';
  assigneeId: string | 'all';
  sortBy: 'priority' | 'dueDate' | 'points' | 'recent';
  sortOrder: 'asc' | 'desc';
}

export type TimeRange = 'today' | 'week' | 'sprint' | 'month';
export type ViewMode = 'kanban' | 'list' | 'projects' | 'analytics';

export type PairingStatus = 'available' | 'deep_work' | 'in_review' | 'on_call' | 'away' | 'online' | 'busy';

export interface TeammatePresence {
  id: string;
  name: string;
  role: string;
  avatar: string;
  githubUsername?: string;
  githubUrl?: string;
  status: PairingStatus;
  currentActivity?: string;
  currentFocus?: string;
  topic?: string;
  skills?: string[];
  deepWorkEndsAt?: string;
  uninterruptedMinutes?: number;
  availableForPairing?: boolean;
  pairingPreference?: string;
  activeHuddle?: boolean;
  branchName?: string;
  activeRoomId?: string;
}

export interface PairingRoom {
  id: string;
  title: string;
  topic: string;
  host: Assignee;
  participants: Assignee[];
  startedAt: string;
  isAudioActive: boolean;
  isScreenSharing: boolean;
  branchName: string;
  roomUrl: string;
}

export interface HuddleRequest {
  id: string;
  fromUser: Assignee;
  toUser: TeammatePresence;
  agenda: string;
  durationMinutes: number;
  note?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface PRAIInsights {
  summary?: string;
  performance: string[];
  security: string[];
  testing: string[];
}

export interface PullRequestItem {
  id: string;
  number: number;
  title: string;
  repo: string;
  branch: string;
  author: Assignee;
  additions: number;
  deletions: number;
  filesChangedCount: number;
  commentsCount: number;
  ciStatus: 'passing' | 'running' | 'failed';
  waitingHours: number;
  slaStatus: 'healthy' | 'at_risk' | 'breached';
  isReviewed: boolean;
  isMerged?: boolean;
  diffSnippet: string;
  aiInsights: PRAIInsights;
  reviewers: Assignee[];
  projectId?: string;
  projectType?: 'team' | 'individual';
  reviewedBy?: Assignee;
  mergedBy?: Assignee;
  createdAt: string;
  queueType: 'review_requested' | 'authored_by_me' | 'merged';
  status?: string;
  description?: string;
  turnaroundHours?: number;
  url?: string;
}

export interface GitHubTeamMemberMapping {
  teammateId: string;
  name?: string;
  teammateName?: string;
  role?: string;
  avatar?: string;
  githubUsername: string;
  githubUrl?: string;
  syncStatus: 'synced' | 'pending' | 'unlinked';
  recentCommitsCount?: number;
  openPrsCount?: number;
}

export interface GitHubSyncConfig {
  organization?: string;
  enterpriseUrl?: string;
  monitoredRepos: string[];
  autoSync?: boolean;
  autoSyncMinutes?: number;
  intervalMinutes?: number;
  lastSyncAt: string;
  webhookStatus: 'active' | 'inactive' | 'testing';
}

export type DeploymentEnvironment = 'production' | 'staging' | 'development' | 'preview' | 'canary';
export type DeploymentStatus = 'pending' | 'in_progress' | 'building' | 'success' | 'failed' | 'cancelled';

export interface DeploymentItem {
  id: string;
  environment: DeploymentEnvironment;
  serviceName: string;
  version: string;
  commitSha: string;
  commitMessage: string;
  branch: string;
  repositoryUrl?: string;
  projectId?: string;
  projectName?: string;
  pullRequestId?: string;
  developerId?: string;
  author: {
    id?: string;
    name: string;
    avatar: string;
    email?: string;
    username?: string;
  };
  status: DeploymentStatus;
  startedAt?: string;
  completedAt?: string;
  durationSeconds: number;
  deployedAt: string;
  summary?: string;
  logs?: string[];
  url?: string;
  sloPassRate: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeploymentMetricsSummary {
  totalDeployments: number;
  successfulDeployments: number;
  failedDeployments: number;
  inProgressDeployments: number;
  successRate: number;
  meanTimeToRecoveryMinutes: number;
  deploymentFrequency: string;
  dailyDeploymentVelocity: number;
  avgDurationSeconds: number;
}

export interface DeploymentTrendPoint {
  date: string;
  fullDate: string;
  successful: number;
  failed: number;
  inProgress: number;
  total: number;
}

export interface DeploymentEnvironmentPoint {
  environment: string;
  key: string;
  count: number;
  percentage: number;
  color: string;
}

export type NotificationType = 'task_assigned' | 'pr_requested' | 'pr_merged' | 'deployment_success' | 'deployment_failed' | 'system';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  actor?: {
    name: string;
    avatar?: string;
  };
  targetType: 'task' | 'pr' | 'deployment' | 'tab';
  targetId?: string;
  targetTab?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ProjectDetailsMetrics {
  totalTasks: number;
  completedTasks: number;
  tasksByStatus: {
    backlog: number;
    in_progress: number;
    in_review: number;
    done: number;
  };
  openPullRequests: number;
  deployments: number;
  progress: number;
}

export interface ProjectDetails {
  project: Project;
  metrics: ProjectDetailsMetrics;
  tasks: Task[];
  pullRequests: PullRequestItem[];
  deployments: DeploymentItem[];
  recentActivity: any[];
}

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface TeamInvitation {
  id: string;
  inviterId: string;
  inviteeEmail: string;
  inviteeName?: string;
  inviteeUsername?: string;
  role?: string;
  githubUsername?: string;
  projectId?: string;
  status: InvitationStatus;
  tokenHash?: string;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
}



