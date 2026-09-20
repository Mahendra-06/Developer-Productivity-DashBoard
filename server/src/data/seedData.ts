import { User, Project, Task } from '../types/index.js';

export interface PullRequestData {
  id: string;
  prNumber: string;
  title: string;
  repo: string;
  branch: string;
  targetBranch: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    username: string;
  };
  reviewers: Array<{
    id: string;
    name: string;
    avatar: string;
    status: 'approved' | 'changes_requested' | 'pending';
  }>;
  status: 'open' | 'merged' | 'closed';
  checksStatus: 'passed' | 'running' | 'failed';
  additions: number;
  deletions: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  turnaroundHours: number;
}

export interface DeploymentData {
  id: string;
  environment: 'production' | 'staging' | 'canary';
  serviceName: string;
  version: string;
  commitSha: string;
  commitMessage: string;
  author: {
    name: string;
    avatar: string;
  };
  status: 'success' | 'building' | 'failed' | 'cancelled';
  durationSeconds: number;
  deployedAt: string;
  url: string;
  sloPassRate: number;
}

export interface AuditEventData {
  id: string;
  category: 'tasks' | 'prs' | 'deployments' | 'system' | 'compliance';
  actor: {
    name: string;
    avatar: string;
    role: string;
  };
  action: string;
  target: string;
  timestamp: string;
  relativeTime: string;
  metadata?: string;
  status?: 'success' | 'warning' | 'info';
}

// Initial collections for clean production operation (live data only)
export const initialUsers: User[] = [];
export const initialProjects: Project[] = [];
export const initialTasks: Task[] = [];
export const initialPullRequests: PullRequestData[] = [];
export const initialDeployments: DeploymentData[] = [];
export const initialAuditEvents: AuditEventData[] = [];

// Empty arrays for backwards compatibility
export const testUsers: User[] = [];
export const testProjects: Project[] = [];
export const testTasks: Task[] = [];
export const testPullRequests: PullRequestData[] = [];
export const testDeployments: DeploymentData[] = [];
export const testAuditEvents: AuditEventData[] = [];
