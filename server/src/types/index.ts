export type TaskStatus = 'backlog' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ProjectStatus = 'on_track' | 'at_risk' | 'delayed';
export type ProjectCategory = 'team' | 'individual';

export interface DeveloperSkill {
  name: string;
  category: 'languages' | 'distributed' | 'cloud' | 'security';
  level: 'Expert' | 'Senior' | 'Advanced';
  mastery: number;
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

export interface UserIntegration {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  syncStatus: string;
  lastSync: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  username: string;
  passwordHash?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  githubUsername?: string;
  githubUrl?: string;
  githubToken?: string;
  productivityScore?: number;
  activeStreak?: number;
  weeklyGoalHours?: number;
  currentGoalHours?: number;
  completedTasksCount?: number;
  openPRsCount?: number;
  mergedPRsCount?: number;
  focusStatus?: string;
  skills?: DeveloperSkill[];
  contributions?: AuthoredContribution[];
  integrations?: UserIntegration[];
  invitedBy?: string;
  teamMemberIds?: string[];
  createdAt: string;
  updatedAt: string;
}

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
  leadId: string;
  lead?: User;
  teamIds: string[];
  team?: User[];
  deadline: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  key: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  projectName?: string;
  assigneeId: string;
  assignee?: User;
  assignerId?: string;
  assigner?: User;
  storyPoints: number;
  dueDate: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type DeploymentEnvironment = 'production' | 'staging' | 'development' | 'preview' | 'canary';
export type DeploymentStatus = 'pending' | 'in_progress' | 'building' | 'success' | 'failed' | 'cancelled';

export interface Deployment {
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
  createdAt: string;
  updatedAt: string;
}

export interface DeploymentMetrics {
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

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message?: string;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  error: string;
  message: string;
  errors?: ApiErrorDetail[];
  timestamp: string;
  path: string;
}

export interface PullRequestItem {
  id: string;
  number: number;
  prNumber: string;
  title: string;
  repo: string;
  branch: string;
  targetBranch?: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    username: string;
    role?: string;
    email?: string;
  };
  reviewers: Array<{
    id: string;
    name: string;
    avatar: string;
    username?: string;
    role?: string;
    status?: 'approved' | 'changes_requested' | 'pending';
  }>;
  projectId?: string;
  projectType?: 'team' | 'individual';
  status: 'open' | 'merged' | 'closed';
  checksStatus: 'passed' | 'running' | 'failed';
  ciStatus?: 'passing' | 'running' | 'failed';
  additions: number;
  deletions: number;
  commentsCount: number;
  filesChangedCount?: number;
  waitingHours: number;
  slaStatus: 'healthy' | 'at_risk' | 'breached';
  isReviewed: boolean;
  isMerged?: boolean;
  reviewedBy?: {
    id: string;
    name: string;
    avatar: string;
    role?: string;
  };
  mergedBy?: {
    id: string;
    name: string;
    avatar: string;
    role?: string;
  };
  queueType?: 'review_requested' | 'to_review' | 'authored_by_me' | 'my_prs' | 'merged';
  diffSnippet?: string;
  aiInsights?: {
    summary?: string;
    performance: string[];
    security: string[];
    testing: string[];
  };
  turnaroundHours?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PRReviewActionPayload {
  action: 'approve' | 'request_changes';
  comment?: string;
  reviewer?: {
    id?: string;
    name: string;
    avatar?: string;
    role?: string;
    username?: string;
  };
}

export interface PRMetricsSummary {
  totalPRs: number;
  openPRs: number;
  mergedPRs: number;
  toReviewCount: number;
  authoredByMeCount: number;
  avgTurnaroundHours: number;
  slaDistribution: {
    healthy: number;
    atRisk: number;
    breached: number;
  };
}
