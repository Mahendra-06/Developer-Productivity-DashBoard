import { z } from 'zod';

// Common status and priority enums
export const TaskStatusEnum = z.enum(['backlog', 'in_progress', 'in_review', 'done'], {
  errorMap: () => ({ message: "Status must be one of: 'backlog', 'in_progress', 'in_review', 'done'" }),
});

export const TaskPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent'], {
  errorMap: () => ({ message: "Priority must be one of: 'low', 'medium', 'high', 'urgent'" }),
});

export const ProjectStatusEnum = z.enum(['on_track', 'at_risk', 'delayed'], {
  errorMap: () => ({ message: "Project status must be one of: 'on_track', 'at_risk', 'delayed'" }),
});

// ID Param
export const idParamSchema = z.object({
  id: z.string().trim().min(1, 'Resource ID is required'),
});

// User Schemas
export const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().trim().email('Must be a valid email address'),
  role: z.string().trim().min(2, 'Role must be at least 2 characters').max(100, 'Role cannot exceed 100 characters'),
  username: z.string().trim().min(2, 'Username must be at least 2 characters').max(50, 'Username cannot exceed 50 characters')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username can only contain alphanumeric characters, underscores, dashes, and periods'),
  avatar: z.string().url('Avatar must be a valid URL').optional().or(z.literal('')),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
  location: z.string().max(100).optional(),
  timezone: z.string().max(100).optional(),
  githubUsername: z.string().max(100).optional(),
  githubUrl: z.string().url('GitHub URL must be a valid URL').optional().or(z.literal('')),
  weeklyGoalHours: z.coerce.number().min(0).max(100).optional(),
  currentGoalHours: z.coerce.number().min(0).optional(),
  focusStatus: z.string().max(200).optional(),
  skills: z.array(z.string().trim()).optional(),
  productivityScore: z.coerce.number().min(0).max(100).optional(),
  activeStreak: z.coerce.number().min(0).optional(),
  completedTasksCount: z.coerce.number().min(0).optional(),
  invitedBy: z.string().optional(),
  integrations: z.array(z.any()).optional(),
});

export const updateUserSchema = createUserSchema.partial().refine(
  data => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

export const createTeamInvitationSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
  email: z.string().trim().email('Must be a valid email address'),
  role: z.string().trim().min(2).max(100).optional().default('Senior Full-Stack Engineer'),
  username: z.string().trim().min(2).max(50).optional(),
  githubUsername: z.string().trim().max(100).optional(),
  projectId: z.string().trim().optional(),
  password: z.string().min(6).optional(),
  initialTaskTitle: z.string().trim().optional(),
  storyPoints: z.coerce.number().optional(),
});

export const teamInvitationQuerySchema = z.object({
  status: z.enum(['pending', 'accepted', 'expired', 'revoked', 'all']).optional(),
  projectId: z.string().trim().optional(),
});

export const updatePRSchema = z.object({
  isReviewed: z.boolean().optional(),
  status: z.enum(['open', 'merged', 'closed']).optional(),
  slaStatus: z.enum(['healthy', 'at_risk', 'breached']).or(z.string()).optional(),
  commentsCount: z.coerce.number().optional(),
  comment: z.string().optional(),
  reviewerId: z.string().optional(),
  reviewerStatus: z.enum(['approved', 'changes_requested', 'pending']).optional(),
  action: z.enum(['approve', 'request_changes', 'comment']).optional(),
  reviewedBy: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    avatar: z.string().optional(),
    role: z.string().optional(),
  }).optional(),
  actor: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    avatar: z.string().optional(),
    role: z.string().optional(),
  }).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for PR update'
});

export const reviewPRSchema = z.object({
  action: z.enum(['approve', 'request_changes']),
  comment: z.string().optional(),
  reviewer: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    avatar: z.string().optional(),
    role: z.string().optional(),
  }).optional(),
});

export const prQuerySchema = z.object({
  queueType: z.enum(['review_requested', 'to_review', 'authored_by_me', 'my_prs', 'merged', 'all']).optional(),
  projectId: z.string().trim().optional(),
  projectType: z.enum(['team', 'individual', 'all']).optional(),
  slaStatus: z.enum(['healthy', 'at_risk', 'breached', 'all']).optional(),
  status: z.enum(['open', 'merged', 'closed', 'all']).optional(),
  repo: z.string().trim().optional(),
  search: z.string().trim().optional(),
  scope: z.string().trim().optional(),
});

export const DeploymentEnvironmentEnum = z.enum(['production', 'staging', 'development', 'preview', 'canary']);
export const DeploymentStatusEnum = z.enum(['pending', 'in_progress', 'building', 'success', 'failed', 'cancelled']);

export const createDeploymentSchema = z.object({
  environment: DeploymentEnvironmentEnum.default('production'),
  serviceName: z.string().trim().min(1, 'Service name is required'),
  version: z.string().trim().min(1, 'Version is required'),
  commitSha: z.string().trim().min(1, 'Commit SHA is required'),
  commitMessage: z.string().trim().min(1, 'Commit message is required'),
  branch: z.string().trim().optional().default('main'),
  repositoryUrl: z.string().trim().optional(),
  projectId: z.string().trim().optional(),
  pullRequestId: z.string().trim().optional(),
  developerId: z.string().trim().optional(),
  author: z.object({
    id: z.string().optional(),
    name: z.string().trim().min(1, 'Author name is required'),
    avatar: z.string().optional().default('https://github.com/Mahendra-06.png'),
    email: z.string().email().optional(),
    username: z.string().optional(),
  }).optional(),
  status: DeploymentStatusEnum.default('success'),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
  durationSeconds: z.coerce.number().min(0).default(60),
  summary: z.string().optional(),
  logs: z.array(z.string()).optional(),
  url: z.string().optional().default(''),
  sloPassRate: z.coerce.number().min(0).max(100).default(99.9),
});

export const updateDeploymentSchema = createDeploymentSchema.partial().refine(
  data => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

export const deploymentQuerySchema = z.object({
  search: z.string().trim().optional(),
  environment: z.union([DeploymentEnvironmentEnum, z.literal('all')]).optional(),
  status: z.union([DeploymentStatusEnum, z.literal('all')]).optional(),
  projectId: z.string().trim().optional(),
  developerId: z.string().trim().optional(),
  timeRange: z.enum(['today', 'week', 'sprint', 'month', 'all']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  sortBy: z.enum(['createdAt', 'deployedAt', 'durationSeconds', 'version', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  scope: z.string().trim().optional(),
});

export const createAuditSchema = z.object({
  action: z.string().trim().min(1, 'Action is required'),
  category: z.enum(['tasks', 'prs', 'deployments', 'system', 'compliance']).default('system'),
  target: z.string().trim().min(1, 'Target is required'),
  metadata: z.string().trim().optional(),
  status: z.enum(['success', 'warning', 'info']).default('success'),
  actor: z.object({
    name: z.string().trim().min(1),
    role: z.string().trim().min(1),
    avatar: z.string().optional(),
  }).optional(),
});

export const registerSchema = createUserSchema.extend({
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
});

export const loginSchema = z.object({
  login: z.string().trim().min(2, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const verifyEmailOtpSchema = z.object({
  email: z.string().trim().email('Must be a valid email address'),
  otp: z.string().trim().regex(/^\d{6}$/, 'OTP must be an exact 6-digit numeric code'),
});

export const resendEmailOtpSchema = z.object({
  email: z.string().trim().email('Must be a valid email address'),
});

export const userQuerySchema = z.object({
  search: z.string().trim().optional(),
  role: z.string().trim().optional(),
  scope: z.string().trim().optional(),
});

export const ProjectCategoryEnum = z.enum(['team', 'individual'], {
  errorMap: () => ({ message: "Project category must be either 'team' or 'individual'" }),
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(2, 'Project name must be at least 2 characters').max(100, 'Project name cannot exceed 100 characters'),
  key: z.string().trim().min(2, 'Project key must be at least 2 characters').max(10, 'Project key cannot exceed 10 characters')
    .toUpperCase(),
  description: z.string().trim().min(5, 'Description must be at least 5 characters').max(1000, 'Description cannot exceed 1000 characters'),
  status: ProjectStatusEnum.default('on_track'),
  projectType: ProjectCategoryEnum.optional().default('team'),
  repoUrl: z.string().trim().optional().default(''),
  leadId: z.string().trim().min(1, 'Valid project leadId is required'),
  teamIds: z.array(z.string()).optional().default([]),
  deadline: z.string().trim().min(4, 'Valid deadline is required'),
  color: z.string().trim().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Color must be a valid hex color code (e.g. #6366f1)').optional().default('#6366f1'),
});

export const updateProjectSchema = createProjectSchema.partial().refine(
  data => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

export const projectQuerySchema = z.object({
  status: z.union([ProjectStatusEnum, z.literal('all')]).optional(),
  projectType: z.union([ProjectCategoryEnum, z.literal('all')]).optional(),
  search: z.string().trim().optional(),
  scope: z.string().trim().optional(),
});

// Task Schemas
export const createTaskSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200, 'Title cannot exceed 200 characters'),
  description: z.string().trim().min(3, 'Description must be at least 3 characters').max(3000, 'Description cannot exceed 3000 characters'),
  status: TaskStatusEnum.default('backlog'),
  priority: TaskPriorityEnum.default('medium'),
  // Project-less tasks are assigned to an automatically created personal project.
  projectId: z.string().trim().min(1, 'Project ID must not be empty').optional(),
  assigneeId: z.string().trim().min(1, 'Assignee ID is required'),
  assignerId: z.string().trim().optional(),
  storyPoints: z.coerce.number().int('Story points must be an integer').min(0, 'Story points cannot be negative').max(100, 'Story points cannot exceed 100').default(3),
  dueDate: z.string().trim().min(4, 'Valid due date is required'),
  tags: z.array(z.string().trim()).optional().default([]),
});

export const updateTaskSchema = createTaskSchema.partial().refine(
  data => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

export const updateTaskStatusSchema = z.object({
  status: TaskStatusEnum,
});

export const taskQuerySchema = z.object({
  status: z.union([TaskStatusEnum, z.literal('all')]).optional(),
  priority: z.union([TaskPriorityEnum, z.literal('all')]).optional(),
  projectId: z.string().trim().optional(),
  assigneeId: z.string().trim().optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(['priority', 'dueDate', 'storyPoints', 'createdAt', 'updatedAt', 'title']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  scope: z.string().trim().optional(),
});
