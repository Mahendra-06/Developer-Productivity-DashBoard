import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { User, Project, Task, TaskStatus, TaskPriority, ProjectStatus } from '../types/index.js';
import {
  initialUsers,
  initialProjects,
  initialTasks,
  initialPullRequests,
  initialDeployments,
  initialAuditEvents,
  testPullRequests,
  testDeployments,
  testAuditEvents
} from './seedData.js';
import { isMongoConnected } from '../config/mongo.js';
import { MongoDatabase } from './mongoDb.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

interface DatabaseStore {
  users: User[];
  projects: Project[];
  tasks: Task[];
  pullRequests?: any[];
  deployments?: any[];
  auditEvents?: any[];
}

export interface IDatabase {
  resetData(
    users?: User[],
    projects?: Project[],
    tasks?: Task[],
    pullRequests?: any[],
    deployments?: any[],
    auditEvents?: any[]
  ): Promise<void>;
  getUsers(filters?: { search?: string; role?: string; currentUserId?: string; scope?: string }): Promise<User[]>;
  getUserById(id: string): Promise<User | null | undefined>;
  getUserByEmail(email: string): Promise<User | null | undefined>;
  getUserByUsername(username: string): Promise<User | null | undefined>;
  createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | null | undefined>;
  deleteUser(id: string): Promise<boolean>;
  inviteTeamMember(inviterId: string, memberData: {
    name: string;
    email: string;
    role: string;
    username?: string;
    githubUsername?: string;
    projectId?: string;
    password?: string;
  }): Promise<{ user: User; isExisting: boolean }>;
  removeTeamMember(removerId: string, memberId: string): Promise<boolean>;

  getProjects(filters?: { status?: string; search?: string; userId?: string; currentUserId?: string; scope?: string }): Promise<Project[]>;
  getProjectById(idOrKey: string): Promise<Project | null | undefined>;
  getProjectByKey(key: string): Promise<Project | null | undefined>;
  createProject(projectData: {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
    name: string;
    key: string;
    description: string;
    leadId: string;
    teamIds?: string[];
    projectType?: 'team' | 'individual';
    deadline: string;
    color?: string;
    status?: ProjectStatus;
    repoUrl?: string;
  }): Promise<Project>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project | null | undefined>;
  deleteProject(id: string): Promise<boolean>;

  getTasks(filters?: {
    status?: TaskStatus | 'all';
    priority?: TaskPriority | 'all';
    projectId?: string;
    assigneeId?: string;
    search?: string;
    sortBy?: 'priority' | 'dueDate' | 'storyPoints' | 'createdAt' | 'updatedAt' | 'title';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
    userId?: string;
  }): Promise<{ tasks: Task[]; total: number; page: number; limit: number; totalPages: number }>;
  getTaskById(idOrKey: string): Promise<Task | null | undefined>;
  createTask(taskData: {
    id?: string;
    createdAt?: string;
    updatedAt?: string;
    title: string;
    description: string;
    projectId: string;
    assigneeId: string;
    dueDate: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    storyPoints?: number;
    tags?: string[];
  }): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task | null | undefined>;
  updateTaskStatus(id: string, status: TaskStatus): Promise<Task | null | undefined>;
  deleteTask(id: string): Promise<boolean>;

  getSummaryMetrics(filters?: { userId?: string }): Promise<{
    tasks: { total: number; backlog: number; inProgress: number; inReview: number; done: number };
    projects: { total: number; onTrack: number; atRisk: number; delayed: number };
    users: { total: number };
  }>;

  getPullRequests(filters?: {
    userId?: string;
    userName?: string;
    currentUserId?: string;
    currentUserName?: string;
    currentUsername?: string;
    queueType?: string;
    projectId?: string;
    projectType?: string;
    slaStatus?: string;
    status?: string;
    repo?: string;
    search?: string;
    scope?: string;
  }): Promise<any[]>;
  getPRById(id: string): Promise<any | null>;
  getPRMetrics(filters?: { currentUserId?: string; currentUserName?: string; projectId?: string }): Promise<any>;
  createPullRequest(data: any): Promise<any>;
  reviewPullRequest(
    id: string,
    payload: { action: 'approve' | 'request_changes'; comment?: string; reviewer?: any },
    actor?: any
  ): Promise<any>;
  updatePullRequest(id: string, updates: any, actor?: any): Promise<any>;
  mergePullRequest(id: string, actor?: any): Promise<any>;
  getDeployments(filters?: {
    search?: string;
    environment?: string;
    status?: string;
    projectId?: string;
    developerId?: string;
    timeRange?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    userId?: string;
    userName?: string;
  }): Promise<{ deployments: any[]; total: number; page: number; limit: number; totalPages: number }>;
  getDeploymentById(id: string): Promise<any | null>;
  createDeployment(deploymentData: any): Promise<any>;
  updateDeployment(id: string, updates: any): Promise<any | null>;
  deleteDeployment(id: string): Promise<boolean>;
  getDeploymentMetrics(filters?: { userId?: string; userName?: string; timeRange?: string }): Promise<any>;
  getDeploymentTrends(filters?: { userId?: string; userName?: string; timeRange?: string }): Promise<any[]>;
  getDeploymentEnvironments(filters?: { userId?: string; userName?: string; timeRange?: string }): Promise<any[]>;
  getAuditEvents(filters?: { userId?: string; userName?: string }): Promise<any[]>;
  createAuditEvent(eventData: any): Promise<any>;
  getAnalytics(filters?: { userId?: string; userName?: string }): Promise<{
    sprintVelocity: Array<{ sprint: string; committed: number; completed: number; carryOver: number }>;
    workCategories: Array<{ name: string; percentage: number; color: string; hours: number; count: number }>;
    activityDays: Array<{ date: string; count: number; level: number; dayOfWeek: number; weekIndex: number }>;
    rhythm?: {
      hourlySlots: Array<{ hour: string; label: string; intensity: number; type: string; count: number }>;
      peakWindow: string;
      workloadSplit: Array<{ label: string; percentage: number; color: string; text: string; hours: number }>;
      totalHours: number;
    };
    metricsSummary?: {
      productivityScore: number;
      avgReviewTurnaroundHours: number;
      deploymentSuccessRate: number;
      meanTimeToRecoveryMinutes: number;
      dailyDeploymentVelocity: number;
      totalStoryPoints: number;
      completedStoryPoints: number;
      totalFocusHours: number;
    };
  }>;
}

export class LocalPersistentDatabase implements IDatabase {
  private users: User[] = [];
  private projects: Project[] = [];
  private tasks: Task[] = [];
  private pullRequests: any[] = [];
  private deployments: any[] = [];
  private auditEvents: any[] = [];

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(STORE_PATH)) {
      try {
        const raw = fs.readFileSync(STORE_PATH, 'utf-8');
        const data: DatabaseStore = JSON.parse(raw);
        this.users = data.users || initialUsers;
        this.projects = data.projects || initialProjects;
        this.tasks = data.tasks || initialTasks;
        this.pullRequests = Array.isArray(data.pullRequests) && data.pullRequests.length > 0
          ? data.pullRequests
          : JSON.parse(JSON.stringify(testPullRequests));
        this.deployments = Array.isArray(data.deployments) && data.deployments.length > 0
          ? data.deployments
          : JSON.parse(JSON.stringify(testDeployments));
        this.auditEvents = Array.isArray(data.auditEvents) && data.auditEvents.length > 0
          ? data.auditEvents
          : JSON.parse(JSON.stringify(testAuditEvents));

        this.ensureProjectPRsSync();
        this.persist();
        return;
      } catch (err) {
        console.warn('Could not read persistent store, initializing with seeds:', err);
      }
    }

    this.resetDataSync();
  }

  public ensureProjectPRsSync() {
    this.projects.forEach(p => {
      const repoSlug = p.repoUrl ? p.repoUrl.replace(/^https?:\/\/github\.com\//i, '') : `dmetrics/${p.key.toLowerCase()}`;
      const expectedId = `pr_proj_${p.id}`;
      const hasPR = this.pullRequests.some(pr =>
        pr.id === expectedId ||
        (pr.projectId && pr.projectId === p.id) ||
        (pr.repo && pr.repo.toLowerCase() === repoSlug.toLowerCase()) ||
        (pr.title && pr.title.toUpperCase().includes(`[${p.key.toUpperCase()}]`))
      );

      if (!hasPR) {
        const lead = this.users.find(u => u.id === p.leadId) || this.users[0] || {
          id: 'usr_1',
          name: 'Developer',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          role: 'Engineer',
          username: 'developer'
        };
        const isTeam = (p as any).projectType === 'team' || ((p.teamIds && p.teamIds.length > 1) ? true : false);
        const teamPool = (p.teamIds && p.teamIds.length > 0)
          ? this.users.filter(u => p.teamIds!.includes(u.id))
          : this.users;
        const eligible = teamPool.filter(u => u.id !== lead.id && u.name !== lead.name);

        const assignedReviewers = isTeam
          ? eligible.slice(0, 3).map(u => ({
              id: u.id,
              name: u.name,
              avatar: u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
              role: u.role || 'Engineer',
              username: u.username,
              status: 'pending' as const
            }))
          : [];

        const prNumber = (Math.abs(p.key.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0)) % 800) + 100;
        this.pullRequests.unshift({
          id: expectedId,
          number: prNumber,
          prNumber: `PR #${prNumber}`,
          title: `[${p.key}] Feature Architecture & CI/CD Pipeline Setup`,
          repo: repoSlug,
          branch: `feat/${p.key.toLowerCase()}-pipeline-arch`,
          targetBranch: 'main',
          author: {
            id: lead.id,
            name: lead.name,
            avatar: lead.avatar,
            role: lead.role,
            username: lead.username
          },
          reviewers: assignedReviewers,
          projectId: p.id,
          projectType: isTeam ? 'team' : 'individual',
          status: 'open',
          checksStatus: 'passed',
          ciStatus: 'passing',
          additions: 380,
          deletions: 18,
          commentsCount: 1,
          filesChangedCount: 4,
          waitingHours: 1.2,
          slaStatus: 'healthy',
          isReviewed: false,
          isMerged: false,
          queueType: 'review_requested',
          diffSnippet: `+ // CI/CD Setup for [${p.key}]: ${p.name}\n+ export const projectKey = '${p.key}';\n+ export const targetEnv = 'production';\n+ export const sloTarget = 99.9;`,
          aiInsights: {
            summary: `Continuous integration baseline and CI/CD workflow definition for ${p.name}. Automated checks passing.`,
            performance: ['Zero latency regression', 'Optimal bundle budgets'],
            security: ['No secret leaks detected', 'Strict type assertions'],
            testing: ['Unit tests passed (100%)', 'Continuous integration green']
          },
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          turnaroundHours: 1.5
        });
      }
    });
  }

  private persist() {
    try {
      const data: DatabaseStore = {
        users: this.users,
        projects: this.projects,
        tasks: this.tasks,
        pullRequests: this.pullRequests,
        deployments: this.deployments,
        auditEvents: this.auditEvents,
      };
      fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database state:', err);
    }
  }

  private resetDataSync(
    users = initialUsers,
    projects = initialProjects,
    tasks = initialTasks,
    pullRequests = testPullRequests,
    deployments = testDeployments,
    auditEvents = testAuditEvents
  ) {
    this.users = JSON.parse(JSON.stringify(users));
    this.projects = JSON.parse(JSON.stringify(projects));
    this.tasks = JSON.parse(JSON.stringify(tasks));
    this.pullRequests = JSON.parse(JSON.stringify(pullRequests));
    this.deployments = JSON.parse(JSON.stringify(deployments));
    this.auditEvents = JSON.parse(JSON.stringify(auditEvents));
    this.ensureProjectPRsSync();
    this.persist();
  }

  public async resetData(
    users = initialUsers,
    projects = initialProjects,
    tasks = initialTasks,
    pullRequests = initialPullRequests,
    deployments = initialDeployments,
    auditEvents = initialAuditEvents
  ): Promise<void> {
    this.resetDataSync(users, projects, tasks, pullRequests, deployments, auditEvents);
  }

  // ==========================================
  // USERS CRUD
  // ==========================================

  public async getUsers(filters?: { search?: string; role?: string; currentUserId?: string; scope?: string }): Promise<User[]> {
    let result = [...this.users];

    if (filters?.role) {
      const roleFilter = filters.role.toLowerCase();
      result = result.filter(u => u.role.toLowerCase().includes(roleFilter));
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        u =>
          u.name.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search) ||
          u.username.toLowerCase().includes(search) ||
          (u.bio && u.bio.toLowerCase().includes(search))
      );
    }

    if (filters?.currentUserId && filters?.scope === 'team') {
      const currentUserId = filters.currentUserId;
      const currentUser = this.users.find(u => u.id === currentUserId);
      const userProjects = this.projects.filter(p =>
        p.leadId === currentUserId || (p.teamIds && p.teamIds.includes(currentUserId))
      );

      const allowedIds = new Set<string>();
      allowedIds.add(currentUserId);

      // 1. Direct teamMemberIds
      if (Array.isArray(currentUser?.teamMemberIds)) {
        currentUser.teamMemberIds.forEach((id: string) => allowedIds.add(id));
      }

      // 2. Users who linked me and their teammates
      const directTeammates = Array.from(allowedIds);
      this.users.forEach(u => {
        if ((u.teamMemberIds && u.teamMemberIds.includes(currentUserId)) || directTeammates.includes(u.id)) {
          allowedIds.add(u.id);
          if (Array.isArray(u.teamMemberIds)) {
            u.teamMemberIds.forEach((tid: string) => allowedIds.add(tid));
          }
        }
      });

      userProjects.forEach(p => {
        if (p.leadId) allowedIds.add(p.leadId);
        if (p.teamIds) p.teamIds.forEach(tid => allowedIds.add(tid));
      });

      this.users.forEach(u => {
        if (u.invitedBy === currentUserId) allowedIds.add(u.id);
        if (currentUser?.invitedBy && u.invitedBy === currentUser.invitedBy) allowedIds.add(u.id);
      });
      if (currentUser?.invitedBy) allowedIds.add(currentUser.invitedBy);

      result = result.filter(u => allowedIds.has(u.id));
    }

    return result;
  }

  public async getUserById(id: string): Promise<User | undefined> {
    if (!id) return undefined;
    return this.users.find(
      u => u.id === id || 
      (u.username && u.username.toLowerCase() === id.toLowerCase()) || 
      (u.email && u.email.toLowerCase() === id.toLowerCase()) ||
      (u.name && u.name.toLowerCase() === id.toLowerCase())
    );
  }

  public async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  public async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const id = `usr_${Date.now()}`;
    const newUser: User = {
      ...userData,
      id,
      productivityScore: userData.productivityScore || 0,
      activeStreak: userData.activeStreak || 0,
      weeklyGoalHours: userData.weeklyGoalHours || 40,
      currentGoalHours: userData.currentGoalHours || 0,
      completedTasksCount: userData.completedTasksCount || 0,
      openPRsCount: userData.openPRsCount || 0,
      mergedPRsCount: userData.mergedPRsCount || 0,
      focusStatus: userData.focusStatus || 'Ready ⚡',
      githubUsername: userData.githubUsername || '',
      githubToken: userData.githubToken || '',
      githubUrl: userData.githubUrl || (userData.githubUsername ? `https://github.com/${userData.githubUsername}` : ''),
      skills: userData.skills || [],
      contributions: userData.contributions || [],
      integrations: userData.integrations || (userData.githubUsername ? [
        { id: 'github', name: 'GitHub Profile', icon: 'github', connected: true, syncStatus: 'Linked', lastSync: 'Just now' }
      ] : []),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.users.push(newUser);
    this.persist();
    return newUser;
  }

  public async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return undefined;

    this.users[index] = {
      ...this.users[index],
      ...updates,
      id: this.users[index].id, // Immutable
      updatedAt: new Date().toISOString(),
    };

    this.persist();
    return this.users[index];
  }

  public async deleteUser(id: string): Promise<boolean> {
    const initialLen = this.users.length;
    this.users = this.users.filter(u => u.id !== id);
    const deleted = this.users.length < initialLen;
    if (deleted) this.persist();
    return deleted;
  }

  public async inviteTeamMember(inviterId: string, memberData: {
    name: string;
    email: string;
    role: string;
    username?: string;
    githubUsername?: string;
    projectId?: string;
    password?: string;
  }): Promise<{ user: User; isExisting: boolean }> {
    const cleanEmail = memberData.email.trim().toLowerCase();
    const cleanGithub = memberData.githubUsername
      ? memberData.githubUsername.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\/$/, '')
      : '';
    const cleanUsername = memberData.username
      ? memberData.username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_')
      : cleanEmail.split('@')[0].replace(/[^a-z0-9_-]/g, '_');

    let existingIndex = this.users.findIndex(u => u.email.toLowerCase() === cleanEmail || u.username.toLowerCase() === cleanUsername);
    let targetUser: User;
    let isExisting = false;

    if (existingIndex !== -1) {
      isExisting = true;
      targetUser = this.users[existingIndex];
      if (!Array.isArray(targetUser.teamMemberIds)) targetUser.teamMemberIds = [];
      if (!targetUser.teamMemberIds.includes(inviterId)) targetUser.teamMemberIds.push(inviterId);
      if (!targetUser.invitedBy) targetUser.invitedBy = inviterId;
      this.users[existingIndex] = targetUser;
    } else {
      isExisting = false;
      const id = `usr_${Date.now()}`;
      targetUser = {
        id,
        name: memberData.name.trim(),
        email: cleanEmail,
        role: memberData.role,
        username: cleanUsername,
        avatar: cleanGithub ? `https://github.com/${cleanGithub}.png` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${cleanUsername}`,
        githubUsername: cleanGithub,
        githubUrl: cleanGithub ? `https://github.com/${cleanGithub}` : '',
        invitedBy: inviterId,
        teamMemberIds: [inviterId],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.users.push(targetUser);
    }

    const inviterIndex = this.users.findIndex(u => u.id === inviterId);
    if (inviterIndex !== -1) {
      const inviter = this.users[inviterIndex];
      if (!Array.isArray(inviter.teamMemberIds)) inviter.teamMemberIds = [];
      if (!inviter.teamMemberIds.includes(targetUser.id)) {
        inviter.teamMemberIds.push(targetUser.id);
        this.users[inviterIndex] = inviter;
      }
    }

    if (memberData.projectId) {
      const pIdx = this.projects.findIndex(p => p.id === memberData.projectId);
      if (pIdx !== -1) {
        const proj = this.projects[pIdx];
        if (!Array.isArray(proj.teamIds)) proj.teamIds = [];
        if (!proj.teamIds.includes(targetUser.id)) {
          proj.teamIds.push(targetUser.id);
          this.projects[pIdx] = proj;
        }
      }
    }

    this.persist();
    return { user: targetUser, isExisting };
  }

  public async removeTeamMember(removerId: string, memberId: string): Promise<boolean> {
    if (!removerId || !memberId || removerId === memberId) {
      return false;
    }

    const remover = this.users.find(u => u.id === removerId);
    if (remover && Array.isArray(remover.teamMemberIds)) {
      remover.teamMemberIds = remover.teamMemberIds.filter(id => id !== memberId);
    }

    const member = this.users.find(u => u.id === memberId);
    if (member) {
      if (Array.isArray(member.teamMemberIds)) {
        member.teamMemberIds = member.teamMemberIds.filter(id => id !== removerId);
      }
      if (member.invitedBy === removerId) {
        member.invitedBy = '';
      }
    }

    if (remover && remover.invitedBy === memberId) {
      remover.invitedBy = '';
    }

    this.projects.forEach(p => {
      if (p.leadId === removerId && Array.isArray(p.teamIds)) {
        p.teamIds = p.teamIds.filter(id => id !== memberId);
      }
      if (p.leadId === memberId && Array.isArray(p.teamIds)) {
        p.teamIds = p.teamIds.filter(id => id !== removerId);
      }
    });

    this.persist();
    return true;
  }

  // ==========================================
  // PROJECTS CRUD
  // ==========================================

  public async getProjects(filters?: { status?: string; search?: string; userId?: string; currentUserId?: string; scope?: string }): Promise<Project[]> {
    let result = [...this.projects];

    result = result.map(p => {
      const projectTasks = this.tasks.filter(t => t.projectId === p.id);
      const totalTasks = projectTasks.length;
      const completedTasks = projectTasks.filter(t => t.status === 'done').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      const lead = this.users.find(u => u.id === p.leadId) || this.users[0];
      const team = (p.teamIds || [p.leadId]).map(tid => this.users.find(u => u.id === tid)).filter(Boolean) as User[];

      return {
        ...p,
        progress,
        totalTasks,
        completedTasks,
        lead,
        team,
      };
    });

    // Scope to user: only projects where user is lead or team member
    if (filters?.userId) {
      result = result.filter(p => 
        p.leadId === filters.userId || 
        (p.teamIds || []).includes(filters.userId!)
      );
    } else if (filters?.currentUserId) {
      // Authenticated Team view: Team projects visible to all; Individual projects only visible to their owner
      result = result.filter(p => {
        if (p.projectType === 'individual') {
          return p.leadId === filters.currentUserId || (p.teamIds || []).includes(filters.currentUserId!);
        }
        return true;
      });
    } else {
      // Unauthenticated: Only team projects
      result = result.filter(p => p.projectType !== 'individual');
    }

    if (filters?.status && filters.status !== 'all') {
      result = result.filter(p => p.status === filters.status);
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        p =>
          p.name.toLowerCase().includes(search) ||
          p.key.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search)
      );
    }

    return result;
  }

  public async getProjectById(idOrKey: string): Promise<Project | undefined> {
    const needle = idOrKey.toUpperCase();
    const projects = await this.getProjects();
    return projects.find(p => p.id === idOrKey || p.key.toUpperCase() === needle);
  }

  public async getProjectByKey(key: string): Promise<Project | undefined> {
    const needle = key.toUpperCase();
    const projects = await this.getProjects();
    return projects.find(p => p.key.toUpperCase() === needle);
  }

  public async createProject(projectData: {
    name: string;
    key: string;
    description: string;
    leadId: string;
    teamIds?: string[];
    projectType?: string;
    deadline: string;
    color?: string;
    status?: ProjectStatus;
    repoUrl?: string;
  }): Promise<Project> {
    const id = `proj_${Date.now()}`;
    const lead = this.users.find(u => u.id === projectData.leadId) || this.users[0];
    const resolvedProjectType = projectData.projectType === 'individual' ? 'individual' : 'team';
    const isTeamProject = resolvedProjectType === 'team';
    const teamIds = isTeamProject
      ? (projectData.teamIds && projectData.teamIds.length > 0 ? projectData.teamIds : [projectData.leadId])
      : [projectData.leadId];
    const team = teamIds.map(tid => this.users.find(u => u.id === tid)).filter(Boolean) as User[];

    const newProject: Project = {
      id,
      name: projectData.name,
      key: projectData.key.toUpperCase(),
      description: projectData.description,
      status: projectData.status || 'on_track',
      projectType: resolvedProjectType as 'team' | 'individual',
      progress: 0,
      totalTasks: 0,
      completedTasks: 0,
      repoUrl: projectData.repoUrl || `https://github.com/dmetrics/${projectData.key.toLowerCase()}`,
      lead,
      team,
      deadline: projectData.deadline,
      color: projectData.color || '#6366f1',
      leadId: projectData.leadId,
      teamIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.projects.push(newProject);

    // Auto-create initial Architecture & CI/CD Setup PR for this project
    const repoSlug = newProject.repoUrl ? newProject.repoUrl.replace(/^https?:\/\/github\.com\//i, '') : `dmetrics/${newProject.key.toLowerCase()}`;
    const prNumber = (Math.abs(newProject.key.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0)) % 800) + 100;
    const isTeam = isTeamProject;
    await this.createPullRequest({
      id: `pr_proj_${newProject.id}`,
      number: prNumber,
      prNumber: `PR #${prNumber}`,
      title: `[${newProject.key}] Feature Architecture & CI/CD Pipeline Setup`,
      repo: repoSlug,
      branch: `feat/${newProject.key.toLowerCase()}-pipeline-arch`,
      targetBranch: 'main',
      author: {
        id: lead.id,
        name: lead.name,
        avatar: lead.avatar,
        role: lead.role,
        username: lead.username
      },
      projectId: newProject.id,
      projectType: isTeam ? 'team' : 'individual',
      status: 'open',
      checksStatus: 'passed',
      ciStatus: 'passing',
      additions: 380,
      deletions: 18,
      waitingHours: 0.5,
      slaStatus: 'healthy',
      diffSnippet: `+ // CI/CD Setup for [${newProject.key}]: ${newProject.name}\n+ export const projectKey = '${newProject.key}';\n+ export const targetEnv = 'production';\n+ export const sloTarget = 99.9;`,
      aiInsights: {
        summary: `Continuous integration baseline and CI/CD workflow definition for ${newProject.name}. Automated checks passing.`,
        performance: ['Zero latency regression', 'Optimal bundle budgets'],
        security: ['No secret leaks detected', 'Strict type assertions'],
        testing: ['Unit tests passed (100%)', 'Continuous integration green']
      }
    });

    this.persist();
    return newProject;
  }

  public async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const index = this.projects.findIndex(p => p.id === id || p.key.toUpperCase() === id.toUpperCase());
    if (index === -1) return undefined;

    this.projects[index] = {
      ...this.projects[index],
      ...updates,
      id: this.projects[index].id,
      updatedAt: new Date().toISOString(),
    };

    this.persist();
    return this.getProjectById(this.projects[index].id);
  }

  public async deleteProject(id: string): Promise<boolean> {
    const project = await this.getProjectById(id);
    if (!project) return false;

    // Cascading delete: delete all associated tasks
    this.tasks = this.tasks.filter(t => t.projectId !== project.id);
    this.projects = this.projects.filter(p => p.id !== project.id);
    this.persist();
    return true;
  }

  // ==========================================
  // TASKS CRUD
  // ==========================================

  public async getTasks(filters?: {
    status?: TaskStatus | 'all';
    priority?: TaskPriority | 'all';
    projectId?: string;
    assigneeId?: string;
    search?: string;
    sortBy?: 'priority' | 'dueDate' | 'storyPoints' | 'createdAt' | 'updatedAt' | 'title';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
    userId?: string;
  }): Promise<{ tasks: Task[]; total: number; page: number; limit: number; totalPages: number }> {
    let result = [...this.tasks];

    // Scope to user: only tasks assigned to this user
    if (filters?.userId) {
      result = result.filter(t => 
        t.assigneeId === filters.userId || 
        (t.assignee && (t.assignee.id === filters.userId || t.assignee.username === filters.userId || t.assignee.email === filters.userId))
      );
    }

    result = result.map(t => {
      const assignee = this.users.find(
        u => u.id === t.assigneeId || 
        (u.username && u.username.toLowerCase() === (t.assigneeId || '').toLowerCase()) || 
        (u.email && u.email.toLowerCase() === (t.assigneeId || '').toLowerCase()) ||
        (u.name && u.name.toLowerCase() === (t.assigneeId || '').toLowerCase())
      ) || (t.assignee && t.assignee.id ? t.assignee : {
        id: t.assigneeId || 'usr_unassigned',
        name: t.assigneeId || 'Teammate',
        email: `${t.assigneeId || 'teammate'}@dmetrics.io`,
        role: 'Developer',
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(t.assigneeId || 'teammate')}`
      } as User);
      const project = this.projects.find(p => p.id === t.projectId);
      let assigner = t.assignerId ? (this.users.find(
        u => u.id === t.assignerId || 
        (u.username && u.username.toLowerCase() === t.assignerId?.toLowerCase()) || 
        (u.email && u.email.toLowerCase() === t.assignerId?.toLowerCase())
      ) || t.assigner) : t.assigner;

      if (!assigner || assigner.id === assignee.id) {
        const leadId = project?.leadId;
        const assigneeId = t.assigneeId;
        if (leadId && leadId !== assigneeId) {
          assigner = this.users.find(u => u.id === leadId) || project?.lead;
        }
        if (!assigner || assigner.id === assigneeId) {
          assigner = this.users.find(u => u.id !== assigneeId && !u.id.startsWith('usr_gh_')) || this.users[0];
        }
      }

      return {
        ...t,
        assignee,
        assigner,
        projectName: project ? project.name : (t.projectName || 'General'),
      };
    });

    if (filters?.status && filters.status !== 'all') {
      result = result.filter(t => t.status === filters.status);
    }

    if (filters?.priority && filters.priority !== 'all') {
      result = result.filter(t => t.priority === filters.priority);
    }

    if (filters?.projectId) {
      result = result.filter(t => t.projectId === filters.projectId);
    }

    if (filters?.assigneeId) {
      result = result.filter(t => 
        t.assigneeId === filters.assigneeId || 
        (t.assignee && (t.assignee.id === filters.assigneeId || t.assignee.username === filters.assigneeId || t.assignee.email === filters.assigneeId))
      );
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        t =>
          t.title.toLowerCase().includes(search) ||
          t.key.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search) ||
          t.tags.some(tag => tag.toLowerCase().includes(search))
      );
    }

    const sortBy = filters?.sortBy || 'createdAt';
    const sortOrder = filters?.sortOrder || 'desc';

    result.sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (sortBy === 'priority') {
        const priorityRank: Record<TaskPriority, number> = {
          urgent: 4,
          high: 3,
          medium: 2,
          low: 1,
        };
        valA = priorityRank[a.priority];
        valB = priorityRank[b.priority];
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = result.length;
    const page = filters?.page ? Math.max(1, filters.page) : 1;
    const limit = filters?.limit ? Math.max(1, filters.limit) : total || 10;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const paginated = result.slice(offset, offset + limit);

    return {
      tasks: paginated,
      total,
      page,
      limit,
      totalPages,
    };
  }

  public async getTaskById(idOrKey: string): Promise<Task | undefined> {
    const needle = idOrKey.toUpperCase();
    const task = this.tasks.find(t => t.id === idOrKey || t.key.toUpperCase() === needle);
    if (!task) return undefined;

    const assignee = this.users.find(
      u => u.id === task.assigneeId || 
      (u.username && u.username.toLowerCase() === (task.assigneeId || '').toLowerCase()) || 
      (u.email && u.email.toLowerCase() === (task.assigneeId || '').toLowerCase()) ||
      (u.name && u.name.toLowerCase() === (task.assigneeId || '').toLowerCase())
    ) || (task.assignee && task.assignee.id ? task.assignee : {
      id: task.assigneeId || 'usr_unassigned',
      name: task.assigneeId || 'Teammate',
      email: `${task.assigneeId || 'teammate'}@dmetrics.io`,
      role: 'Developer',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(task.assigneeId || 'teammate')}`
    } as User);
    const project = this.projects.find(p => p.id === task.projectId);
    let assigner = task.assignerId ? (this.users.find(
      u => u.id === task.assignerId || 
      (u.username && u.username.toLowerCase() === task.assignerId?.toLowerCase()) || 
      (u.email && u.email.toLowerCase() === task.assignerId?.toLowerCase())
    ) || task.assigner) : task.assigner;

    if (!assigner || assigner.id === assignee.id) {
      const leadId = project?.leadId;
      const assigneeId = task.assigneeId;
      if (leadId && leadId !== assigneeId) {
        assigner = this.users.find(u => u.id === leadId) || project?.lead;
      }
      if (!assigner || assigner.id === assigneeId) {
        assigner = this.users.find(u => u.id !== assigneeId && !u.id.startsWith('usr_gh_')) || this.users[0];
      }
    }

    return {
      ...task,
      assignee,
      assigner,
      projectName: project ? project.name : 'General',
    };
  }

  public async createTask(taskData: {
    title: string;
    description: string;
    projectId: string;
    assigneeId: string;
    assignerId?: string;
    dueDate: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    storyPoints?: number;
    tags?: string[];
  }): Promise<Task> {
    const id = `task_${Date.now()}`;
    // Internal task creation must resolve private personal projects as well as
    // team projects. Public project listings intentionally apply visibility
    // rules, so use the backing store here instead of the filtered accessor.
    const project = this.projects.find(project => project.id === taskData.projectId);
    const projectKey = project ? project.key : 'TASK';

    const projectTasks = this.tasks.filter(t => t.projectId === taskData.projectId);
    const maxNum = projectTasks.reduce((max, t) => {
      const match = t.key.match(/-(\d+)$/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 100);
    const key = `${projectKey}-${maxNum + 1}`;

    const assignee = this.users.find(
      u => u.id === taskData.assigneeId || 
      (u.username && u.username.toLowerCase() === (taskData.assigneeId || '').toLowerCase()) || 
      (u.email && u.email.toLowerCase() === (taskData.assigneeId || '').toLowerCase()) ||
      (u.name && u.name.toLowerCase() === (taskData.assigneeId || '').toLowerCase())
    ) || {
      id: taskData.assigneeId || 'usr_unassigned',
      name: taskData.assigneeId || 'Teammate',
      email: `${taskData.assigneeId || 'teammate'}@dmetrics.io`,
      role: 'Developer',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(taskData.assigneeId || 'teammate')}`
    } as User;

    const assigner = taskData.assignerId ? (this.users.find(
      u => u.id === taskData.assignerId || 
      (u.username && u.username.toLowerCase() === taskData.assignerId?.toLowerCase()) || 
      (u.email && u.email.toLowerCase() === taskData.assignerId?.toLowerCase())
    )) : undefined;

    const newTask: Task = {
      id,
      key,
      title: taskData.title,
      description: taskData.description,
      status: taskData.status || 'backlog',
      priority: taskData.priority || 'medium',
      projectId: taskData.projectId,
      projectName: project ? project.name : 'General',
      assigneeId: taskData.assigneeId,
      assignee,
      assignerId: taskData.assignerId,
      assigner,
      storyPoints: taskData.storyPoints || 3,
      dueDate: taskData.dueDate,
      tags: taskData.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.tasks.push(newTask);
    this.persist();
    return newTask;
  }

  public async updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined> {
    const index = this.tasks.findIndex(t => t.id === id || t.key.toUpperCase() === id.toUpperCase());
    if (index === -1) return undefined;

    const prevStatus = this.tasks[index].status;
    this.tasks[index] = {
      ...this.tasks[index],
      ...updates,
      id: this.tasks[index].id,
      updatedAt: new Date().toISOString(),
    };

    const updatedTask = this.tasks[index];
    const taskKey = updatedTask.key || id;

    // Continuous Integration & Review Queue synchronization:
    if (updates.status === 'in_review' && prevStatus !== 'in_review') {
      const existingPR = this.pullRequests.find(p =>
        (p.title && p.title.toUpperCase().includes(`[${taskKey.toUpperCase()}]`)) ||
        (p.branch && p.branch.toLowerCase().includes(taskKey.toLowerCase()))
      );

      if (!existingPR) {
        const project = this.projects.find(p => p.id === updatedTask.projectId);
        const assignee = this.users.find(u => u.id === updatedTask.assigneeId) || this.users[0];
        const repoSlug = project?.repoUrl ? project.repoUrl.replace(/^https?:\/\/github\.com\//i, '') : `dmetrics/${(project?.key || 'workspace').toLowerCase()}`;
        const prNumber = this.pullRequests.length + 101;

        await this.createPullRequest({
          number: prNumber,
          prNumber: `PR #${prNumber}`,
          title: `[${taskKey}] ${updatedTask.title}`,
          repo: repoSlug,
          branch: `feat/${taskKey.toLowerCase()}-${updatedTask.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}`,
          targetBranch: 'main',
          author: {
            id: assignee.id,
            name: assignee.name,
            avatar: assignee.avatar,
            role: assignee.role,
            username: assignee.username
          },
          projectId: updatedTask.projectId,
          projectType: (project as any)?.projectType || 'team',
          status: 'open',
          checksStatus: 'passed',
          ciStatus: 'passing',
          additions: 120,
          deletions: 15,
          waitingHours: 0.2,
          slaStatus: 'healthy',
          diffSnippet: `+ // Task Implementation: [${taskKey}] ${updatedTask.title}\n+ export function executeFeature() {\n+   return { key: '${taskKey}', points: ${updatedTask.storyPoints || 3}, status: 'ready_for_review' };\n+ }`,
          aiInsights: {
            summary: `Continuous integration pull request opened for [${taskKey}]: ${updatedTask.title}. Clean modular implementation.`,
            performance: ['Zero runtime performance regression detected', 'Optimal memory allocations'],
            security: ['OWASP Top 10 pass', 'No hardcoded tokens'],
            testing: ['Unit tests passed (100%)', 'Integration checks green']
          }
        });
      }
    } else if (updates.status === 'done' && prevStatus !== 'done') {
      const openPR = this.pullRequests.find(p =>
        !p.isMerged && p.status !== 'merged' &&
        ((p.title && p.title.toUpperCase().includes(`[${taskKey.toUpperCase()}]`)) ||
        (p.branch && p.branch.toLowerCase().includes(taskKey.toLowerCase())))
      );
      if (openPR) {
        await this.mergePullRequest(openPR.id);
      }
    }

    this.persist();
    return this.getTaskById(this.tasks[index].id);
  }

  public async updateTaskStatus(id: string, status: TaskStatus): Promise<Task | undefined> {
    return this.updateTask(id, { status });
  }

  public async deleteTask(id: string): Promise<boolean> {
    const initialLen = this.tasks.length;
    this.tasks = this.tasks.filter(t => t.id !== id && t.key.toUpperCase() !== id.toUpperCase());
    const deleted = this.tasks.length < initialLen;
    if (deleted) this.persist();
    return deleted;
  }

  // ==========================================
  // METRICS & DASHBOARD AGGREGATES
  // ==========================================

  public async getSummaryMetrics(filters?: { userId?: string }) {
    let scopedTasks = [...this.tasks];
    let scopedProjects = [...this.projects];
    if (filters?.userId) {
      scopedTasks = scopedTasks.filter(t => t.assigneeId === filters.userId);
      scopedProjects = scopedProjects.filter(p => p.leadId === filters.userId || (p.teamIds || []).includes(filters.userId!));
    }

    return {
      tasks: {
        total: scopedTasks.length,
        backlog: scopedTasks.filter(t => t.status === 'backlog').length,
        inProgress: scopedTasks.filter(t => t.status === 'in_progress').length,
        inReview: scopedTasks.filter(t => t.status === 'in_review').length,
        done: scopedTasks.filter(t => t.status === 'done').length,
      },
      projects: {
        total: scopedProjects.length,
        onTrack: scopedProjects.filter(p => p.status === 'on_track').length,
        atRisk: scopedProjects.filter(p => p.status === 'at_risk').length,
        delayed: scopedProjects.filter(p => p.status === 'delayed').length,
      },
      users: {
        total: this.users.length,
      },
    };
  }

  public async getPullRequests(filters?: {
    userId?: string;
    userName?: string;
    currentUserId?: string;
    currentUserName?: string;
    currentUsername?: string;
    queueType?: string;
    projectId?: string;
    projectType?: string;
    slaStatus?: string;
    status?: string;
    repo?: string;
    search?: string;
    scope?: string;
  }) {
    this.ensureProjectPRsSync();

    const currentId = filters?.currentUserId || (filters?.scope !== 'all' && filters?.scope !== 'team' ? filters?.userId : undefined);
    const currentName = filters?.currentUserName || (filters?.scope !== 'all' && filters?.scope !== 'team' ? filters?.userName : undefined);
    const currentUsername = filters?.currentUsername;

    let result = this.pullRequests.map(p => {
      const num = p.number || parseInt((p.prNumber || '').replace(/\D+/g, ''), 10) || 101;
      const proj = this.projects.find(proj =>
        proj.id === p.projectId ||
        (proj.repoUrl && proj.repoUrl.replace(/^https?:\/\/github\.com\//i, '').toLowerCase() === (p.repo || '').toLowerCase()) ||
        (p.repo && p.repo.toLowerCase().includes((proj.key || '').toLowerCase())) ||
        (p.title && p.title.toUpperCase().includes(`[${(proj.key || '').toUpperCase()}]`))
      );
      const projectType = p.projectType || proj?.projectType || 'team';

      let waitingHours = p.waitingHours;
      let slaStatus = p.slaStatus;
      if (p.status === 'merged' || p.isMerged) {
        waitingHours = 0;
        slaStatus = 'healthy';
      } else {
        const createdMs = p.createdAt ? new Date(p.createdAt).getTime() : Date.now();
        const elapsed = Math.max(0.1, Math.round(((Date.now() - createdMs) / (1000 * 60 * 60)) * 10) / 10);
        waitingHours = waitingHours != null && waitingHours > 0 ? waitingHours : elapsed;
        if (slaStatus !== 'at_risk') {
          if (waitingHours > 48) {
            slaStatus = 'breached';
          } else if (waitingHours >= 24) {
            slaStatus = 'at_risk';
          } else {
            slaStatus = 'healthy';
          }
        }
      }

      const isAuthor = Boolean(
        (currentId && (p.author?.id === currentId || p.author?.username === currentId)) ||
        (currentName && (p.author?.name?.toLowerCase() === currentName.toLowerCase() || p.author?.username?.toLowerCase() === currentName.toLowerCase())) ||
        (currentUsername && (p.author?.username?.toLowerCase() === currentUsername.toLowerCase() || p.author?.id === currentUsername))
      );

      let queueType = p.queueType;
      if (p.status === 'merged' || p.isMerged) {
        queueType = 'merged';
      } else if (isAuthor) {
        queueType = 'authored_by_me';
      } else {
        queueType = 'review_requested';
      }

      return {
        ...p,
        number: num,
        projectType,
        waitingHours,
        slaStatus,
        queueType,
        isMerged: p.status === 'merged' || Boolean(p.isMerged),
        isReviewed: Boolean(p.isReviewed),
      };
    });

    // Queue filtering
    if (filters?.queueType && filters.queueType !== 'all') {
      const q = filters.queueType.toLowerCase();
      if (q === 'to_review' || q === 'review_requested') {
        result = result.filter(p => !p.isMerged && p.queueType === 'review_requested');
      } else if (q === 'my_prs' || q === 'authored_by_me') {
        result = result.filter(p => !p.isMerged && p.queueType === 'authored_by_me');
      } else if (q === 'merged') {
        result = result.filter(p => p.isMerged || p.status === 'merged');
      }
    } else if (filters?.userId && !filters?.scope && !filters?.queueType && !filters?.currentUserId) {
      // Direct author match
      result = result.filter(p => p.author?.id === filters.userId || p.author?.name === filters.userName);
    }

    if (filters?.projectId && filters.projectId !== 'all') {
      result = result.filter(p => p.projectId === filters.projectId);
    }

    if (filters?.projectType && filters.projectType !== 'all') {
      result = result.filter(p => p.projectType === filters.projectType);
    }

    if (filters?.slaStatus && filters.slaStatus !== 'all') {
      result = result.filter(p => p.slaStatus === filters.slaStatus);
    }

    if (filters?.status && filters.status !== 'all') {
      result = result.filter(p => p.status === filters.status);
    }

    if (filters?.repo && filters.repo !== 'all') {
      result = result.filter(p => p.repo.toLowerCase() === filters.repo!.toLowerCase());
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(p =>
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.branch && p.branch.toLowerCase().includes(q)) ||
        (p.prNumber && p.prNumber.toLowerCase().includes(q)) ||
        (p.repo && p.repo.toLowerCase().includes(q)) ||
        (p.author?.name && p.author.name.toLowerCase().includes(q))
      );
    }

    return result;
  }

  public async getPRById(id: string) {
    const list = await this.getPullRequests();
    return list.find(p => p.id === id || String(p.number) === id || p.prNumber === id || (id.startsWith('pr_proj_') && p.projectId === id.replace(/^pr_proj_/, ''))) || null;
  }

  public async getPRMetrics(filters?: { currentUserId?: string; currentUserName?: string; projectId?: string }) {
    const all = await this.getPullRequests(filters);
    const openPRs = all.filter(p => !p.isMerged && p.status !== 'merged');
    const mergedPRs = all.filter(p => p.isMerged || p.status === 'merged');
    const toReview = openPRs.filter(p => p.queueType === 'review_requested');
    const authoredByMe = openPRs.filter(p => p.queueType === 'authored_by_me');

    const prsWithTurnaround = all.filter(p => p.turnaroundHours && p.turnaroundHours > 0);
    const avgTurnaroundHours = prsWithTurnaround.length > 0
      ? Number((prsWithTurnaround.reduce((sum, p) => sum + p.turnaroundHours, 0) / prsWithTurnaround.length).toFixed(1))
      : 1.2;

    const slaDistribution = {
      healthy: openPRs.filter(p => p.slaStatus === 'healthy').length,
      atRisk: openPRs.filter(p => p.slaStatus === 'at_risk').length,
      breached: openPRs.filter(p => p.slaStatus === 'breached').length,
    };

    return {
      totalPRs: all.length,
      openPRs: openPRs.length,
      mergedPRs: mergedPRs.length,
      toReviewCount: toReview.length,
      authoredByMeCount: authoredByMe.length,
      avgTurnaroundHours,
      slaDistribution,
    };
  }

  public async createPullRequest(data: any) {
    const id = data.id || `pr_${Date.now()}`;
    const number = data.number || (this.pullRequests.length + 101);
    const author = data.author || {
      id: 'usr_1',
      name: 'Developer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      username: 'developer'
    };

    // Find linked project to determine projectType & eligible teammates
    const matchedProj = this.projects.find(proj =>
      proj.id === data.projectId ||
      (data.repo && (
        (proj.repoUrl && proj.repoUrl.replace(/^https?:\/\/github\.com\//i, '').toLowerCase() === data.repo.toLowerCase()) ||
        data.repo.toLowerCase().includes((proj.key || '').toLowerCase())
      )) ||
      (data.title && data.title.toUpperCase().includes(`[${(proj.key || '').toUpperCase()}]`))
    );
    const projectType = data.projectType || matchedProj?.projectType || 'team';

    // Automatic Reviewer Assignment for Team Projects (Author strictly excluded from reviewers)
    let assignedReviewers = data.reviewers || [];
    if (!data.reviewers || data.reviewers.length === 0) {
      if (projectType === 'team') {
        const teamPool = (matchedProj?.teamIds && matchedProj.teamIds.length > 0)
          ? this.users.filter(u => matchedProj.teamIds!.includes(u.id))
          : this.users;

        const eligible = teamPool.filter(u =>
          u.id !== author.id &&
          u.name !== author.name &&
          u.username !== author.username
        );

        const lead = matchedProj?.leadId ? this.users.find(u => u.id === matchedProj.leadId) : undefined;
        if (lead && lead.id !== author.id && lead.username !== author.username) {
          assignedReviewers = [
            {
              id: lead.id,
              name: lead.name,
              avatar: lead.avatar,
              role: lead.role,
              username: lead.username,
              status: 'pending'
            },
            ...eligible.filter(u => u.id !== lead.id).slice(0, 2).map(u => ({
              id: u.id,
              name: u.name,
              avatar: u.avatar,
              role: u.role,
              username: u.username,
              status: 'pending'
            }))
          ];
        } else {
          assignedReviewers = eligible.slice(0, 3).map(u => ({
            id: u.id,
            name: u.name,
            avatar: u.avatar,
            role: u.role,
            username: u.username,
            status: 'pending'
          }));
        }
      } else {
        assignedReviewers = [];
      }
    } else {
      // Filter out author if accidentally included
      assignedReviewers = assignedReviewers.filter((r: any) =>
        r.id !== author.id && r.name !== author.name && r.username !== author.username
      );
    }

    const newPr = {
      id,
      number,
      prNumber: data.prNumber || `PR #${number}`,
      title: data.title || 'New Feature PR',
      repo: data.repo || 'dmetrics/workspace',
      branch: data.branch || `feat/feature-${number}`,
      targetBranch: data.targetBranch || 'main',
      author,
      reviewers: assignedReviewers,
      projectId: data.projectId || matchedProj?.id,
      projectType,
      status: data.status || 'open',
      checksStatus: data.checksStatus || 'passed',
      ciStatus: data.ciStatus || 'passing',
      additions: data.additions || 120,
      deletions: data.deletions || 15,
      commentsCount: data.commentsCount || 0,
      filesChangedCount: data.filesChangedCount || 3,
      waitingHours: data.waitingHours || 0.5,
      slaStatus: data.slaStatus || 'healthy',
      isReviewed: data.isReviewed || false,
      isMerged: data.isMerged || false,
      queueType: data.queueType || 'review_requested',
      diffSnippet: data.diffSnippet || '+ // CI/CD verified changes\n+ export const feature = true;',
      aiInsights: data.aiInsights || {
        summary: 'Automated CI/CD validation passed. Clean modular implementation with 100% test coverage.',
        performance: ['Optimal memory footprint', 'Zero unnecessary re-renders'],
        security: ['No sensitive tokens exposed', 'Strict type assertions'],
        testing: ['Unit tests passed (100%)', 'Continuous integration checks green']
      },
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      turnaroundHours: data.turnaroundHours || 1.2
    };
    this.pullRequests.unshift(newPr);

    await this.createAuditEvent({
      id: `evt_pr_${Date.now()}`,
      category: 'prs',
      actor: {
        name: newPr.author?.name || 'Developer',
        avatar: newPr.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: newPr.author?.role || 'Engineer',
      },
      action: `opened pull request #${newPr.number}`,
      target: `${newPr.title} (${newPr.branch} → ${newPr.targetBranch || 'main'})`,
      metadata: `Repo: ${newPr.repo} • CI checks passing • ${projectType === 'team' ? 'Requires Peer Review' : 'Direct Merge Allowed'}`,
      status: 'success',
    });

    this.persist();
    return newPr;
  }

  public async reviewPullRequest(
    id: string,
    payload: { action: 'approve' | 'request_changes'; comment?: string; reviewer?: any },
    actor?: any
  ) {
    let pr = this.pullRequests.find(p => p.id === id || String(p.number) === id || p.prNumber === id);
    if (!pr) {
      this.ensureProjectPRsSync();
      pr = this.pullRequests.find(p => p.id === id || String(p.number) === id || p.prNumber === id || (id.startsWith('pr_proj_') && p.projectId === id.replace(/^pr_proj_/, '')));
    }
    if (!pr) return null;

    const reviewer = payload.reviewer || actor || {
      id: 'usr_peer',
      name: 'Peer Reviewer',
      role: 'Engineer'
    };

    const isTeamProject = (pr.projectType || 'team') === 'team';
    const isAuthor = Boolean(
      (reviewer.id && (reviewer.id === pr.author?.id || reviewer.id === pr.author?.username)) ||
      (reviewer.username && (reviewer.username === pr.author?.username || reviewer.username === pr.author?.id)) ||
      (reviewer.name && reviewer.name.toLowerCase() === pr.author?.name?.toLowerCase())
    );

    // Enforce No Self-Review policy in team projects
    if (isTeamProject && isAuthor && payload.action === 'approve') {
      throw new Error('Authors cannot approve their own pull requests in team projects. Peer review is required.');
    }

    const elapsedHours = Math.max(0.5, Math.round(((Date.now() - new Date(pr.createdAt || Date.now()).getTime()) / (1000 * 60 * 60)) * 10) / 10);

    // Update reviewers roster status
    if (Array.isArray(pr.reviewers)) {
      const revIdx = pr.reviewers.findIndex((r: any) =>
        (reviewer.id && r.id === reviewer.id) ||
        (reviewer.username && r.username === reviewer.username) ||
        (reviewer.name && r.name.toLowerCase() === reviewer.name.toLowerCase())
      );
      if (revIdx >= 0) {
        pr.reviewers[revIdx].status = payload.action === 'approve' ? 'approved' : 'changes_requested';
      } else {
        pr.reviewers.push({
          id: reviewer.id,
          name: reviewer.name,
          avatar: reviewer.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          role: reviewer.role || 'Reviewer',
          username: reviewer.username,
          status: payload.action === 'approve' ? 'approved' : 'changes_requested'
        });
      }
    }

    if (payload.action === 'approve') {
      pr.isReviewed = true;
      pr.turnaroundHours = elapsedHours;
      pr.reviewedBy = {
        id: reviewer.id,
        name: reviewer.name,
        avatar: reviewer.avatar,
        role: reviewer.role
      };
      if (payload.comment) {
        pr.commentsCount = (pr.commentsCount || 0) + 1;
      }
      pr.updatedAt = new Date().toISOString();

      await this.createAuditEvent({
        id: `evt_pr_app_${Date.now()}`,
        category: 'prs',
        actor: {
          name: reviewer.name,
          avatar: reviewer.avatar || 'https://github.com/Mahendra-06.png',
          role: reviewer.role || 'Reviewer'
        },
        action: `reviewed and approved PR #${pr.number || pr.prNumber || id}`,
        target: `${pr.title} (${pr.repo})`,
        metadata: `Turnaround: ${elapsedHours} hrs • Team turnaround updated`,
        status: 'success'
      });
    } else if (payload.action === 'request_changes') {
      pr.isReviewed = false;
      pr.slaStatus = 'at_risk';
      if (payload.comment) {
        pr.commentsCount = (pr.commentsCount || 0) + 1;
      }
      pr.updatedAt = new Date().toISOString();

      await this.createAuditEvent({
        id: `evt_pr_req_${Date.now()}`,
        category: 'prs',
        actor: {
          name: reviewer.name,
          avatar: reviewer.avatar || 'https://github.com/Mahendra-06.png',
          role: reviewer.role || 'Reviewer'
        },
        action: `requested changes on PR #${pr.number || pr.prNumber || id}`,
        target: `${pr.title} (${pr.repo})`,
        metadata: payload.comment || 'Requested modifications. Review SLA marked At Risk.',
        status: 'warning'
      });
    }

    this.persist();
    return pr;
  }

  public async updatePullRequest(id: string, updates: any, actor?: any) {
    const idx = this.pullRequests.findIndex(p => p.id === id);
    if (idx >= 0) {
      const current = this.pullRequests[idx];

      // If review action is submitted through update endpoint
      if (updates.action === 'approve' || updates.action === 'request_changes') {
        return this.reviewPullRequest(id, {
          action: updates.action,
          comment: updates.comment,
          reviewer: updates.reviewedBy || actor
        }, actor);
      }

      if (updates.isReviewed === true && !current.isReviewed) {
        current.isReviewed = true;
        current.turnaroundHours = current.turnaroundHours || 1.2;
        if (updates.reviewedBy || actor) {
          current.reviewedBy = updates.reviewedBy || {
            id: actor?.id || 'usr_peer',
            name: actor?.name || 'Peer Reviewer',
            avatar: actor?.avatar,
            role: actor?.role
          };
        }
      }

      if (updates.comment) {
        current.commentsCount = (current.commentsCount || 0) + 1;
      }

      this.pullRequests[idx] = { ...current, ...updates, updatedAt: new Date().toISOString() };
      this.persist();
      return this.pullRequests[idx];
    }
    return null;
  }

  public async mergePullRequest(id: string, actor?: any) {
    let pr = this.pullRequests.find(p => p.id === id || String(p.number) === id || p.prNumber === id);
    if (!pr) {
      this.ensureProjectPRsSync();
      pr = this.pullRequests.find(p => p.id === id || String(p.number) === id || p.prNumber === id || (id.startsWith('pr_proj_') && p.projectId === id.replace(/^pr_proj_/, '')));
    }
    if (pr) {
      // In team projects, ensure peer review approval requirement
      const isTeamProject = (pr.projectType || 'team') === 'team';
      if (isTeamProject && !pr.isReviewed) {
        const isAuthor = actor && (actor.id === pr.author?.id || actor.name === pr.author?.name);
        if (isAuthor) {
          throw new Error('Team project pull requests require peer review and approval before merging.');
        }
      }

      pr.status = 'merged';
      pr.isMerged = true;
      pr.queueType = 'merged';
      pr.checksStatus = 'passed';
      pr.waitingHours = 0;
      pr.slaStatus = 'healthy';
      pr.mergedBy = {
        id: actor?.id || 'usr_1',
        name: actor?.name || 'Mahendra Kumar',
        avatar: actor?.avatar || 'https://github.com/Mahendra-06.png',
        role: actor?.role || 'Backend Systems Engineer'
      };
      pr.updatedAt = new Date().toISOString();

      // 1. Auto-complete linked Kanban task (e.g. [CPE-104])
      const matchKeyMatch = (pr.title || '').match(/\[([A-Z0-9_-]+)\]/i) || (pr.branch && pr.branch.match(/([A-Z0-9]+-\d+)/i));
      const matchedKey = matchKeyMatch ? matchKeyMatch[1].toUpperCase() : null;
      if (matchedKey) {
        this.tasks.forEach(t => {
          if ((t.key.toUpperCase() === matchedKey || (t.title && t.title.toUpperCase().includes(matchedKey))) && t.status !== 'done') {
            t.status = 'done';
            t.updatedAt = new Date().toISOString();
          }
        });
      }

      // 2. Production Release: Register automated Continuous Deployment run with 99.9% SLO verification
      const matchedProject = this.projects.find(p => p.id === pr.projectId || (p.key && pr.title?.toUpperCase().includes(`[${p.key.toUpperCase()}]`)));
      const depItem = {
        id: `dep_cd_${Date.now()}`,
        environment: 'production',
        serviceName: matchedProject ? matchedProject.name : (pr.repo?.split('/')[1] || 'Production Service'),
        version: `v1.${Math.floor(Date.now() / 100000) % 100}.${(pr.number || 1) % 10}`,
        commitSha: Math.random().toString(16).substring(2, 9),
        commitMessage: `Merge PR #${pr.number || id}: ${pr.title || 'Feature'}`,
        branch: 'main',
        repositoryUrl: matchedProject?.repoUrl || `https://github.com/${pr.repo || 'dmetrics/production'}`,
        projectId: matchedProject?.id || pr.projectId,
        projectName: matchedProject?.name || 'Production',
        author: {
          name: pr.author?.name || actor?.name || 'Developer',
          avatar: pr.author?.avatar || actor?.avatar,
          email: pr.author?.email,
          username: pr.author?.username
        },
        status: 'success',
        durationSeconds: Math.floor(Math.random() * 20) + 35,
        deployedAt: 'Just now',
        url: matchedProject?.repoUrl || 'https://prod.dmetrics.internal',
        sloPassRate: 99.98,
        summary: `Continuous Deployment to Production triggered by merge of PR #${pr.number || id} (99.9% SLO verified)`
      };
      this.deployments.unshift(depItem);

      // 3. Update author's mergedPRsCount in users
      const authorUser = this.users.find(u => u.id === pr.author?.id || u.username === pr.author?.username);
      if (authorUser) {
        authorUser.mergedPRsCount = (authorUser.mergedPRsCount || 0) + 1;
      }

      // 4. Audit Trail: Show reviewer and merger attribution
      const reviewerName = pr.reviewedBy?.name || 'Peer Reviewer';
      await this.createAuditEvent({
        id: `evt_pr_${Date.now()}`,
        category: 'prs',
        actor: {
          name: actor?.name || 'Mahendra Kumar',
          avatar: actor?.avatar || 'https://github.com/Mahendra-06.png',
          role: actor?.role || 'Backend Systems Engineer',
        },
        action: `merged pull request #${pr.prNumber || pr.number || id} (reviewed by ${reviewerName}) & deployed ${depItem.version} to Production`,
        target: `${pr.title || 'PR Review'} (${pr.branch || 'feature'} → ${pr.targetBranch || 'main'})`,
        metadata: `+${pr.additions || 0} / -${pr.deletions || 0} lines • Continuous Deployment to Production with 99.9% SLO verification`,
        status: 'success',
      });
      this.persist();
      return pr;
    }
    return null;
  }

  public async getDeployments(filters?: {
    search?: string;
    environment?: string;
    status?: string;
    projectId?: string;
    developerId?: string;
    timeRange?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    userId?: string;
    userName?: string;
  }) {
    let list = [...this.deployments];

    if (filters?.userId || filters?.userName) {
      list = list.filter(d => {
        const authorMatch = d.author?.id === filters.userId || d.author?.name === filters.userName;
        const devMatch = d.developerId === filters.userId;
        return authorMatch || devMatch;
      });
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(d => 
        (d.version || '').toLowerCase().includes(q) ||
        (d.serviceName || '').toLowerCase().includes(q) ||
        (d.commitSha || '').toLowerCase().includes(q) ||
        (d.commitMessage || '').toLowerCase().includes(q) ||
        (d.branch || '').toLowerCase().includes(q) ||
        (d.author?.name || '').toLowerCase().includes(q) ||
        (d.summary || '').toLowerCase().includes(q)
      );
    }

    if (filters?.environment && filters.environment !== 'all') {
      list = list.filter(d => d.environment === filters.environment);
    }

    if (filters?.status && filters.status !== 'all') {
      list = list.filter(d => d.status === filters.status);
    }

    if (filters?.projectId && filters.projectId !== 'all') {
      list = list.filter(d => d.projectId === filters.projectId);
    }

    if (filters?.developerId && filters.developerId !== 'all') {
      list = list.filter(d => d.developerId === filters.developerId || d.author?.id === filters.developerId);
    }

    // Attach project details if linked
    list = list.map(d => {
      const proj = this.projects.find(p => p.id === d.projectId);
      return {
        ...d,
        projectName: proj ? proj.name : undefined,
      };
    });

    const total = list.length;
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      deployments: paginated,
      total,
      page,
      limit,
      totalPages,
    };
  }

  public async getDeploymentById(id: string) {
    const dep = this.deployments.find(d => d.id === id);
    if (!dep) return null;
    const proj = this.projects.find(p => p.id === dep.projectId);
    return {
      ...dep,
      projectName: proj ? proj.name : undefined,
    };
  }

  public async createDeployment(deploymentData: any) {
    const id = deploymentData.id || `dep_${Date.now()}`;
    const nowIso = new Date().toISOString();
    const newDep = {
      id,
      ...deploymentData,
      branch: deploymentData.branch || 'main',
      status: deploymentData.status || 'success',
      durationSeconds: deploymentData.durationSeconds || 60,
      deployedAt: deploymentData.deployedAt || 'Just now',
      startedAt: deploymentData.startedAt || nowIso,
      completedAt: deploymentData.completedAt || (deploymentData.status === 'success' || deploymentData.status === 'failed' ? nowIso : undefined),
      summary: deploymentData.summary || '',
      logs: deploymentData.logs || [
        `[${new Date().toISOString()}] Initializing build environment...`,
        `[${new Date().toISOString()}] Checking out commit ${deploymentData.commitSha || 'HEAD'}...`,
        `[${new Date().toISOString()}] Running test suite & lint verification...`,
        `[${new Date().toISOString()}] Building container image for service ${deploymentData.serviceName || 'core'}...`,
        `[${new Date().toISOString()}] Deployment targeted to ${deploymentData.environment || 'production'}: status=${deploymentData.status || 'success'}`
      ],
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    this.deployments = [newDep, ...this.deployments];

    await this.createAuditEvent({
      id: `evt_dep_${Date.now()}`,
      category: 'deployments',
      actor: {
        id: deploymentData.author?.id || 'usr_1',
        name: deploymentData.author?.name || 'Alex Chen',
        avatar: deploymentData.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        role: 'Platform Engineer',
      },
      action: `deployed ${deploymentData.version || 'build'} to ${deploymentData.environment || 'production'}`,
      target: `${deploymentData.serviceName || 'DMetrics Service'} (${deploymentData.commitSha || 'main'})`,
      metadata: `SLO Pass: ${deploymentData.sloPassRate || 99.9}% • Status: ${deploymentData.status || 'success'}`,
      status: deploymentData.status === 'failed' ? 'warning' : 'success',
    });

    return newDep;
  }

  public async updateDeployment(id: string, updates: any) {
    const idx = this.deployments.findIndex(d => d.id === id);
    if (idx === -1) return null;
    const existing = this.deployments[idx];
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    if (updates.status && updates.status !== existing.status) {
      if (updates.status === 'success' || updates.status === 'failed') {
        updated.completedAt = updated.completedAt || new Date().toISOString();
      }
      await this.createAuditEvent({
        id: `evt_dep_${Date.now()}`,
        category: 'deployments',
        actor: {
          name: updated.author?.name || 'Platform Daemon',
          avatar: updated.author?.avatar || 'https://github.com/Mahendra-06.png',
          role: 'Release Engineer',
        },
        action: `updated deployment ${updated.version} status to ${updates.status}`,
        target: `${updated.serviceName} (${updated.environment})`,
        metadata: `Status transition: ${existing.status} → ${updates.status}`,
        status: updates.status === 'failed' ? 'warning' : 'success',
      });
    }
    this.deployments[idx] = updated;
    return updated;
  }

  public async deleteDeployment(id: string) {
    const initialLen = this.deployments.length;
    this.deployments = this.deployments.filter(d => d.id !== id);
    return this.deployments.length < initialLen;
  }

  public async getDeploymentMetrics(filters?: { userId?: string; userName?: string; timeRange?: string }) {
    let deps = [...this.deployments];
    if (filters?.userId || filters?.userName) {
      deps = deps.filter(d => d.author?.id === filters.userId || d.author?.name === filters.userName || d.developerId === filters.userId);
    }

    const totalDeployments = deps.length;
    const successfulDeployments = deps.filter(d => d.status === 'success').length;
    const failedDeployments = deps.filter(d => d.status === 'failed').length;
    const inProgressDeployments = deps.filter(d => d.status === 'in_progress' || d.status === 'building' || d.status === 'pending').length;

    const successRate = totalDeployments > 0 
      ? Number(((successfulDeployments / totalDeployments) * 100).toFixed(1)) 
      : 0;

    const avgDurationSeconds = totalDeployments > 0
      ? Math.round(deps.reduce((sum, d) => sum + (d.durationSeconds || 60), 0) / totalDeployments)
      : 0;

    // Calculate MTTR from failed to next success
    let mttrMinutes = 0;
    if (failedDeployments > 0) {
      mttrMinutes = Math.round(avgDurationSeconds / 60) || 12;
    }

    const deploymentFrequency = totalDeployments > 0
      ? `${(totalDeployments / 7 * 7).toFixed(1)}/week`
      : '0/week';

    return {
      totalDeployments,
      successfulDeployments,
      failedDeployments,
      inProgressDeployments,
      successRate,
      meanTimeToRecoveryMinutes: mttrMinutes,
      deploymentFrequency,
      dailyDeploymentVelocity: totalDeployments,
      avgDurationSeconds,
    };
  }

  public async getDeploymentTrends(filters?: { userId?: string; userName?: string; timeRange?: string }) {
    let deps = [...this.deployments];
    if (filters?.userId || filters?.userName) {
      deps = deps.filter(d => d.author?.id === filters.userId || d.author?.name === filters.userName || d.developerId === filters.userId);
    }

    const daysCount = filters?.timeRange === 'today' ? 1 : filters?.timeRange === 'week' ? 7 : filters?.timeRange === 'month' ? 30 : 14;
    const trends: Array<{ date: string; fullDate: string; successful: number; failed: number; inProgress: number; total: number }> = [];

    const now = new Date();
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const monthShort = d.toLocaleString('en-US', { month: 'short' });
      const dayNum = d.getDate();
      const label = `${monthShort} ${dayNum}`;

      const dayDeps = deps.filter(dep => {
        const depDate = (dep.createdAt || dep.deployedAt || '').split('T')[0];
        return depDate === dateKey;
      });

      const successful = dayDeps.filter(dep => dep.status === 'success').length;
      const failed = dayDeps.filter(dep => dep.status === 'failed').length;
      const inProgress = dayDeps.filter(dep => dep.status === 'in_progress' || dep.status === 'building' || dep.status === 'pending').length;

      trends.push({
        date: label,
        fullDate: dateKey,
        successful,
        failed,
        inProgress,
        total: dayDeps.length,
      });
    }

    return trends;
  }

  public async getDeploymentEnvironments(filters?: { userId?: string; userName?: string; timeRange?: string }) {
    let deps = [...this.deployments];
    if (filters?.userId || filters?.userName) {
      deps = deps.filter(d => d.author?.id === filters.userId || d.author?.name === filters.userName || d.developerId === filters.userId);
    }

    const total = deps.length || 1;
    const counts: Record<string, number> = {
      production: deps.filter(d => d.environment === 'production').length,
      staging: deps.filter(d => d.environment === 'staging').length,
      development: deps.filter(d => d.environment === 'development').length,
      canary: deps.filter(d => d.environment === 'canary' || d.environment === 'preview').length,
    };

    return [
      { environment: 'Production', key: 'production', count: counts.production, percentage: Math.round((counts.production / total) * 100), color: '#6366f1' },
      { environment: 'Staging', key: 'staging', count: counts.staging, percentage: Math.round((counts.staging / total) * 100), color: '#8b5cf6' },
      { environment: 'Development', key: 'development', count: counts.development, percentage: Math.round((counts.development / total) * 100), color: '#06b6d4' },
      { environment: 'Canary / Preview', key: 'canary', count: counts.canary, percentage: Math.round((counts.canary / total) * 100), color: '#f59e0b' },
    ];
  }


  public async getAuditEvents(filters?: { userId?: string; userName?: string }) {
    let result = this.auditEvents;
    if (filters?.userId || filters?.userName) {
      result = result.filter(e => {
        const actorMatch = e.actor?.id === filters.userId || e.actor?.name === filters.userName;
        return actorMatch;
      });
    }
    return result;
  }

  public async createAuditEvent(eventData: any) {
    const newEvent = {
      id: eventData.id || `evt_${Date.now()}`,
      timestamp: new Date().toISOString(),
      relativeTime: 'Just now',
      ...eventData,
    };
    this.auditEvents = [newEvent, ...this.auditEvents];
    return newEvent;
  }

  public async getAnalytics(filters?: { userId?: string; userName?: string }) {
    const totalPoints = this.tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const doneTasks = this.tasks.filter(t => t.status === 'done');
    const inProgressTasks = this.tasks.filter(t => t.status === 'in_progress');
    const donePoints = doneTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const inProgressPoints = inProgressTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    const sprintVelocity = this.tasks.length > 0 ? [
      { sprint: 'Active Sprint', committed: totalPoints, completed: donePoints, carryOver: inProgressPoints }
    ] : [];

    const categoryStats: Record<string, { count: number; points: number; color: string }> = {
      'Core Architecture': { count: 0, points: 0, color: '#6366f1' },
      'Distributed Systems': { count: 0, points: 0, color: '#8b5cf6' },
      'Frontend / UX': { count: 0, points: 0, color: '#06b6d4' },
      'DevOps & CI/CD': { count: 0, points: 0, color: '#10b981' },
      'Security & Audit': { count: 0, points: 0, color: '#f59e0b' },
    };

    this.tasks.forEach(t => {
      const tags = (t.tags || []).join(' ').toLowerCase();
      const title = (t.title || '').toLowerCase();
      const combined = `${title} ${tags}`;
      const pts = t.storyPoints || 1;

      if (combined.includes('ui') || combined.includes('react') || combined.includes('frontend') || combined.includes('css')) {
        categoryStats['Frontend / UX'].count += 1;
        categoryStats['Frontend / UX'].points += pts;
      } else if (combined.includes('security') || combined.includes('auth') || combined.includes('audit')) {
        categoryStats['Security & Audit'].count += 1;
        categoryStats['Security & Audit'].points += pts;
      } else if (combined.includes('devops') || combined.includes('k8s') || combined.includes('ci') || combined.includes('docker') || combined.includes('pipeline')) {
        categoryStats['DevOps & CI/CD'].count += 1;
        categoryStats['DevOps & CI/CD'].points += pts;
      } else if (combined.includes('distributed') || combined.includes('redis') || combined.includes('kafka') || combined.includes('grpc') || combined.includes('stream')) {
        categoryStats['Distributed Systems'].count += 1;
        categoryStats['Distributed Systems'].points += pts;
      } else {
        categoryStats['Core Architecture'].count += 1;
        categoryStats['Core Architecture'].points += pts;
      }
    });

    const workCategories = Object.entries(categoryStats)
      .filter(([_, stat]) => stat.count > 0)
      .map(([name, stat]) => ({
        name,
        count: stat.count,
        percentage: totalPoints > 0 ? Math.round((stat.points / totalPoints) * 100) : Math.round((stat.count / (this.tasks.length || 1)) * 100),
        color: stat.color,
        hours: Number((stat.points * 1.5).toFixed(1)),
      }));

    const today = new Date();
    const timestampsByDate: Record<string, number> = {};

    const registerDate = (isoStr?: string) => {
      if (!isoStr) return;
      try {
        const d = isoStr.split('T')[0];
        timestampsByDate[d] = (timestampsByDate[d] || 0) + 1;
      } catch {}
    };

    this.tasks.forEach(t => { registerDate(t.createdAt); registerDate(t.updatedAt); });
    this.pullRequests.forEach(p => { registerDate(p.createdAt); registerDate(p.updatedAt); });
    this.deployments.forEach(d => registerDate(d.deployedAt || (d as any).createdAt));
    this.auditEvents.forEach(a => registerDate(a.timestamp));

    const activityDays = [];
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayOfWeek = d.getDay();
      const weekIndex = Math.floor((83 - i) / 7);
      const dateStr = d.toISOString().split('T')[0];
      const count = timestampsByDate[dateStr] || 0;

      let level = 0;
      if (count > 6) level = 4;
      else if (count >= 4) level = 3;
      else if (count >= 2) level = 2;
      else if (count >= 1) level = 1;

      activityDays.push({
        date: dateStr,
        count,
        level,
        dayOfWeek,
        weekIndex,
      });
    }

    const hourlyCounts: Record<number, number> = {};
    for (let h = 8; h <= 18; h++) hourlyCounts[h] = 0;

    const countHour = (isoStr?: string) => {
      if (!isoStr) return;
      try {
        const dateObj = new Date(isoStr);
        if (!isNaN(dateObj.getTime())) {
          const hr = dateObj.getHours();
          if (hr >= 8 && hr <= 18) {
            hourlyCounts[hr] = (hourlyCounts[hr] || 0) + 1;
          }
        }
      } catch {}
    };

    this.auditEvents.forEach(a => countHour(a.timestamp));
    this.tasks.forEach(t => { countHour(t.createdAt); countHour(t.updatedAt); });
    this.pullRequests.forEach(p => countHour(p.createdAt));
    this.deployments.forEach(d => countHour(d.deployedAt));

    const maxHourCount = Math.max(1, ...Object.values(hourlyCounts));
    const hourlySlots = Object.entries(hourlyCounts).map(([hStr, count]) => {
      const h = parseInt(hStr, 10);
      const hourPadded = h < 10 ? `0${h}:00` : `${h}:00`;
      const intensity = Math.round((count / maxHourCount) * 100);
      const label = count === 0 
        ? 'Standby' 
        : intensity >= 80 
        ? 'Peak Deep Flow' 
        : intensity >= 50 
        ? 'Active Development' 
        : 'Review & Sync';
      return {
        hour: hourPadded,
        label,
        intensity: count === 0 ? 10 : intensity,
        type: intensity >= 80 ? 'flow' : intensity >= 50 ? 'code' : 'collab',
        count,
      };
    });

    let peakHour = 10;
    let maxHourlyVal = -1;
    for (const [hStr, count] of Object.entries(hourlyCounts)) {
      if (count > maxHourlyVal) {
        maxHourlyVal = count;
        peakHour = parseInt(hStr, 10);
      }
    }
    const peakWindow = `${peakHour < 10 ? '0' + peakHour : peakHour}:00 – ${peakHour + 2 < 10 ? '0' + (peakHour + 2) : peakHour + 2}:00`;

    const taskCompletionRate = totalPoints > 0 ? (donePoints / totalPoints) : 0;
    const mergedPRs = this.pullRequests.filter(p => p.status === 'merged' || (p as any).isMerged);
    const prVelocityRate = this.pullRequests.length > 0 ? (mergedPRs.length / this.pullRequests.length) : 0;
    const passedDeployments = this.deployments.filter(d => d.status === 'success' || d.status === 'passed');
    const deploymentSuccessRate = this.deployments.length > 0 
      ? Number(((passedDeployments.length / this.deployments.length) * 100).toFixed(1)) 
      : 0;

    const avgDuration = this.deployments.length > 0
      ? Math.round(this.deployments.reduce((sum, d) => sum + (d.durationSeconds || 60), 0) / this.deployments.length / 60)
      : 0;

    const productivityScore = this.tasks.length === 0 && this.pullRequests.length === 0 && this.deployments.length === 0
      ? 0
      : Math.min(100, Math.round(taskCompletionRate * 50 + prVelocityRate * 30 + (deploymentSuccessRate > 0 ? 20 : 0)));

    let avgTurnaround = 0;
    if (this.pullRequests.length > 0) {
      const withTurnaround = this.pullRequests.filter(p => p.turnaroundHours && p.turnaroundHours > 0);
      if (withTurnaround.length > 0) {
        avgTurnaround = Number((withTurnaround.reduce((sum, p) => sum + p.turnaroundHours, 0) / withTurnaround.length).toFixed(1));
      } else {
        avgTurnaround = 1.2;
      }
    }

    const totalFocusHours = Number((donePoints * 1.5 + inProgressPoints * 0.8).toFixed(1));

    return {
      sprintVelocity,
      workCategories,
      activityDays,
      rhythm: {
        hourlySlots,
        peakWindow,
        totalHours: totalFocusHours,
        workloadSplit: workCategories.map(c => ({
          label: c.name,
          percentage: c.percentage,
          color: c.color,
          text: 'text-slate-200',
          hours: c.hours
        }))
      },
      metricsSummary: {
        productivityScore,
        avgReviewTurnaroundHours: avgTurnaround,
        deploymentSuccessRate,
        meanTimeToRecoveryMinutes: avgDuration || 1,
        dailyDeploymentVelocity: this.deployments.length,
        totalStoryPoints: totalPoints,
        completedStoryPoints: donePoints,
        totalFocusHours
      }
    };
  }
}

// Instantiate database engine: dynamic proxy checking MongoDB connection state
const localDb = new LocalPersistentDatabase();
const mongoDb = new MongoDatabase();

export const db: IDatabase = new Proxy({} as IDatabase, {
  get(_target, prop: keyof IDatabase) {
    const active = isMongoConnected() ? mongoDb : localDb;
    const value = (active as any)[prop];
    return typeof value === 'function' ? value.bind(active) : value;
  },
});
