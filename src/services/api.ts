import { Task, Project, UserProfile, TaskStatus } from '../types';

// In development, Vite proxies /api to the local backend. In production this
// points at the separately deployed API service (for example, Render).
const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000')
  .replace(/\/api\/?$/, '')
  .replace(/\/$/, '');
const API_BASE = `${API_ORIGIN}/api`;

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('dmetrics_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    
    if (res.status === 204) {
      return {} as T;
    }

    const data = await res.json();

    if (!res.ok) {
      const message = data.message || `API error: ${res.status}`;
      const err = new Error(message) as any;
      err.statusCode = res.status;
      err.errors = data.errors || [];
      throw err;
    }

    return data.data !== undefined ? data.data : data;
  } catch (err: any) {
    console.warn(`[API] Error on ${options.method || 'GET'} ${endpoint}:`, err.message);
    throw err;
  }
}

export const api = {
  // Health
  checkHealth: () => request<{ status: string; service: string }>('/health'),

  // Tasks
  getTasks: async (filters?: Record<string, any>): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== 'all' && val !== '') {
          params.append(key, String(val));
        }
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<Task[]>(`/tasks${query}`);
  },

  getTaskById: (id: string) => request<Task>(`/tasks/${id}`),

  createTask: (taskData: any) =>
    request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    }),

  updateTask: (id: string, updates: Partial<Task>) =>
    request<Task>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  updateTaskStatus: (id: string, status: TaskStatus) =>
    request<Task>(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  deleteTask: (id: string) =>
    request<void>(`/tasks/${id}`, {
      method: 'DELETE',
    }),

  getSummaryMetrics: () => request<any>('/tasks/summary/metrics'),

  // Projects
  getProjects: (filters?: { status?: string; search?: string; scope?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.scope) params.append('scope', filters.scope);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<Project[]>(`/projects${query}`);
  },

  getProjectById: (id: string) => request<Project>(`/projects/${id}`),

  createProject: (projectData: any) =>
    request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    }),

  updateProject: (id: string, updates: Partial<Project>) =>
    request<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  // Users
  getUsers: (filters?: { search?: string; role?: string; scope?: string }) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          params.append(key, String(val));
        }
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<any[]>(`/users${query}`);
  },
  getCurrentUser: () => request<UserProfile>('/users/current/profile'),
  updateUser: (id: string, updates: Partial<UserProfile>) =>
    request<UserProfile>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
  inviteTeamMember: (data: {
    name: string;
    email: string;
    role: string;
    username?: string;
    githubUsername?: string;
    projectId?: string;
    password?: string;
  }) =>
    request<{ user: any; isExisting: boolean }>('/users/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  removeTeamMember: (memberId: string) =>
    request<{ success: boolean; message: string }>(`/users/team/${memberId}`, {
      method: 'DELETE',
    }),

  // AI Assistant (using OpenAI backend service)
  aiTaskBreakdown: (title: string, description?: string) =>
    request<{
      refinedTitle: string;
      refinedDescription: string;
      storyPoints: number;
      subtasks: string[];
      acceptanceCriteria: string[];
      tags: string[];
      isAiGenerated: boolean;
    }>('/ai/task-breakdown', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    }),

  aiPRReview: (prNumber: number | string, title: string, diffSnippet?: string) =>
    request<{
      summary: string;
      performance: string[];
      security: string[];
      testing: string[];
      recommendation: string;
      isAiGenerated: boolean;
    }>('/ai/pr-review', {
      method: 'POST',
      body: JSON.stringify({ prNumber, title, diffSnippet }),
    }),

  // DMetrics Developer Copilot
  copilotHealth: () =>
    request<{
      status: string;
      model: string;
      hasApiKey: boolean;
      features: string[];
    }>('/ai/copilot/health'),

  copilotChat: (payload: {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    currentTab?: string;
  }) =>
    request<{
      response: string;
      actionProposal?: any;
      toolsUsed: string[];
      isAiGenerated: boolean;
    }>('/ai/copilot/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  copilotExecuteAction: (action: string, data: Record<string, any>) =>
    request<{ task: any }>('/ai/copilot/action/execute', {
      method: 'POST',
      body: JSON.stringify({ action, data }),
    }),

  // Analytics & Real Telemetry
  getAnalytics: (filters?: { scope?: string }) => {
    const params = new URLSearchParams();
    if (filters?.scope) params.append('scope', filters.scope);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<{
      sprintVelocity: Array<{ sprint: string; committed: number; completed: number; carryOver: number }>;
      workCategories: Array<{ name: string; percentage: number; color: string; hours: number; count: number }>;
      activityDays: Array<{ date: string; count: number; level: number; dayOfWeek: number; weekIndex: number }>;
    }>(`/analytics${query}`);
  },

  getPullRequests: (filters?: Record<string, any>) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== 'all' && val !== '') {
          params.append(key, String(val));
        }
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<any[]>(`/prs${query}`);
  },
  getPRMetrics: (filters?: { scope?: string; projectId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.scope) params.append('scope', filters.scope);
    if (filters?.projectId) params.append('projectId', filters.projectId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<any>(`/prs/metrics${query}`);
  },
  createPR: (prData: any) =>
    request<any>('/prs', {
      method: 'POST',
      body: JSON.stringify(prData),
    }),
  reviewPR: (id: string, reviewData: { action: 'approve' | 'request_changes'; comment?: string; reviewer?: any }) =>
    request<any>(`/prs/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(reviewData),
    }),
  updatePR: (id: string, updates: any) =>
    request<any>(`/prs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
  mergePR: (id: string, actor?: any) =>
    request<any>(`/prs/${id}/merge`, {
      method: 'POST',
      body: JSON.stringify({ actor }),
    }),

  getAuditEvents: (filters?: { scope?: string }) => {
    const params = new URLSearchParams();
    if (filters?.scope) params.append('scope', filters.scope);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<any[]>(`/audit${query}`);
  },
  logAuditEvent: (eventData: any) =>
    request<any>('/audit', {
      method: 'POST',
      body: JSON.stringify(eventData),
    }),

  // Deployments (Full production-style CRUD & real-time telemetry)
  getDeployments: (filters?: Record<string, any>) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== 'all' && val !== '') {
          params.append(key, String(val));
        }
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<{
      deployments: any[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    } | any[]>(`/deployments${query}`);
  },

  getDeploymentById: (id: string) => request<any>(`/deployments/${id}`),

  createDeployment: (deploymentData: any) =>
    request<any>('/deployments', {
      method: 'POST',
      body: JSON.stringify(deploymentData),
    }),

  updateDeployment: (id: string, updates: any) =>
    request<any>(`/deployments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  deleteDeployment: (id: string) =>
    request<void>(`/deployments/${id}`, {
      method: 'DELETE',
    }),

  getDeploymentMetrics: (filters?: { scope?: string; timeRange?: string }) => {
    const params = new URLSearchParams();
    if (filters?.scope) params.append('scope', filters.scope);
    if (filters?.timeRange) params.append('timeRange', filters.timeRange);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<{
      totalDeployments: number;
      successfulDeployments: number;
      failedDeployments: number;
      inProgressDeployments: number;
      successRate: number;
      meanTimeToRecoveryMinutes: number;
      deploymentFrequency: string;
      dailyDeploymentVelocity: number;
      avgDurationSeconds: number;
    }>(`/deployments/metrics${query}`);
  },

  getDeploymentTrends: (filters?: { scope?: string; timeRange?: string }) => {
    const params = new URLSearchParams();
    if (filters?.scope) params.append('scope', filters.scope);
    if (filters?.timeRange) params.append('timeRange', filters.timeRange);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<Array<{
      date: string;
      fullDate: string;
      successful: number;
      failed: number;
      inProgress: number;
      total: number;
    }>>(`/deployments/trends${query}`);
  },

  getDeploymentEnvironments: (filters?: { scope?: string; timeRange?: string }) => {
    const params = new URLSearchParams();
    if (filters?.scope) params.append('scope', filters.scope);
    if (filters?.timeRange) params.append('timeRange', filters.timeRange);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<Array<{
      environment: string;
      key: string;
      count: number;
      percentage: number;
      color: string;
    }>>(`/deployments/environments${query}`);
  },

  // GitHub Integration (using GITHUB_TOKEN backend service)
  getGitHubUser: () => request<any>('/github/user'),
  getGitHubPullRequests: () => request<any[]>('/github/pull-requests'),
  syncGithubRepo: (repoUrl: string, projectId?: string, token?: string, leadId?: string) =>
    request<any>('/github/sync-repo', {
      method: 'POST',
      body: JSON.stringify({ repoUrl, projectId, token, leadId }),
    }),
  getGithubRepoAnalytics: (repoUrl: string) =>
    request<any>(`/github/repo-analytics?repoUrl=${encodeURIComponent(repoUrl)}`),

  // Auth
  register: async (userData: any) => {
    const res = await request<{ user: UserProfile; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (res.token) {
      localStorage.setItem('dmetrics_token', res.token);
    }
    return res;
  },

  login: async (credentials: { login: string; password: string }) => {
    const res = await request<{ user: UserProfile; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (res.token) {
      localStorage.setItem('dmetrics_token', res.token);
    }
    return res;
  },

  getMe: () => request<UserProfile>('/auth/me'),
  verifyLead: () => request<{ authorized: boolean; user: any }>('/auth/verify-lead'),

  logout: () => {
    localStorage.removeItem('dmetrics_token');
  },
};
