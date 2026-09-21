import { Request, Response, NextFunction } from 'express';
import { db } from '../data/db.js';
import { ResponseHelper } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { TaskStatus, TaskPriority } from '../types/index.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { SocketService } from '../services/socketService.js';

export function isPrivilegedRole(role?: string): boolean {
  if (!role) return false;
  const normalized = role.toLowerCase().trim();
  return /\b(admin|manager|lead)\b/i.test(normalized);
}

export function isPersonalTask(key?: string): boolean {
  return Boolean(key && key.toUpperCase().startsWith('PERSONAL-'));
}

export async function checkTaskAccess(task: any, user?: { id: string; email?: string; role?: string; username?: string }) {
  if (!user) return;
  const isPrivileged = isPrivilegedRole(user.role);
  const authUserId = user.id;
  const authEmail = user.email?.toLowerCase();
  const authUsername = (user as any).username?.toLowerCase();

  const isAssignee = task.assigneeId === authUserId ||
    (task.assignee && (
      task.assignee.id === authUserId ||
      (authEmail && task.assignee.email?.toLowerCase() === authEmail) ||
      (authUsername && task.assignee.username?.toLowerCase() === authUsername)
    ));

  const isCreator = (task.createdById && task.createdById === authUserId) ||
    (task.assignerId && task.assignerId === authUserId) ||
    (task.assigner && (
      task.assigner.id === authUserId ||
      (authEmail && task.assigner.email?.toLowerCase() === authEmail) ||
      (authUsername && task.assigner.username?.toLowerCase() === authUsername)
    ));

  const isOwner = isAssignee || isCreator;
  const isPersonal = isPersonalTask(task.key);

  // Personal tasks are strictly private to their owner, even across privileged roles
  if (isPersonal && !isOwner) {
    throw ApiError.notFound(`Task with ID or key '${task.id || task.key}' not found`);
  }

  if (isPrivileged || isOwner) {
    return;
  }

  // Check if member is part of the task's team project
  if (task.projectId) {
    const project = await db.getProjectById(task.projectId);
    if (project && project.projectType !== 'individual' && !project.key.toUpperCase().startsWith('PERSONAL-')) {
      const isMember = (
        project.leadId === authUserId ||
        (project.teamIds && project.teamIds.includes(authUserId)) ||
        (!project.teamIds || project.teamIds.length === 0)
      );
      if (isMember) {
        return;
      }
    }
  }

  throw ApiError.notFound(`Task with ID or key '${task.id || task.key}' not found`);
}

export class TaskController {
  static getAllTasks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        status,
        priority,
        projectId,
        assigneeId,
        search,
        sortBy,
        sortOrder,
        page,
        limit,
        scope,
      } = req.query as {
        status?: TaskStatus | 'all';
        priority?: TaskPriority | 'all';
        projectId?: string;
        assigneeId?: string;
        search?: string;
        sortBy?: 'priority' | 'dueDate' | 'storyPoints' | 'createdAt' | 'updatedAt' | 'title';
        sortOrder?: 'asc' | 'desc';
        page?: number;
        limit?: number;
        scope?: string;
      };

      const userId = req.query.userId as string | undefined;
      const authUser = req.user ? {
        id: req.user.id,
        email: req.user.email,
        username: (req.user as any).username,
        role: req.user.role,
      } : undefined;

      const result = await db.getTasks({
        status,
        priority,
        projectId,
        assigneeId,
        search,
        sortBy,
        sortOrder,
        page,
        limit,
        userId,
        scope,
        authUser,
      });

      ResponseHelper.success(res, result.tasks, 'Tasks retrieved successfully', 200, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  };

  static getTaskById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const task = await db.getTaskById(id);
      if (!task) {
        throw ApiError.notFound(`Task with ID or key '${id}' not found`);
      }

      await checkTaskAccess(task, req.user);

      ResponseHelper.success(res, task, 'Task retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  static createTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId, assigneeId } = req.body;

      // Validate assignee existence
      const assignee = await db.getUserById(assigneeId);
      if (!assignee) {
        throw ApiError.badRequest(`Assignee user with ID '${assigneeId}' does not exist`, [
          { field: 'assigneeId', message: 'Assigned user must be a valid user ID' },
        ]);
      }

      let project = projectId ? await db.getProjectById(projectId) : null;
      if (projectId && !project) {
        throw ApiError.badRequest(`Project with ID '${projectId}' does not exist`, [
          { field: 'projectId', message: 'Assigned project must be a valid project ID' },
        ]);
      }

      // A task can be created before the user has created a project. In that
      // case, create (or reuse) a private personal project automatically.
      if (!project) {
        const personalKey = `PERSONAL-${assignee.id.replace(/[^a-z0-9]/gi, '').slice(-8).toUpperCase()}`;
        project = await db.getProjectByKey(personalKey);
        if (!project) {
          project = await db.createProject({
            name: `${assignee.name}'s Personal Tasks`,
            key: personalKey,
            description: 'Automatically created workspace for tasks without a selected project.',
            leadId: assignee.id,
            teamIds: [assignee.id],
            projectType: 'individual',
            deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            color: '#6366f1',
          });
        }
      }

      // Always prioritize verified JWT req.user.id for creator identification
      const creatorId = req.user?.id || req.body.createdById || req.body.assignerId;
      const newTask = await db.createTask({
        ...req.body,
        projectId: project.id,
        assigneeId,
        createdById: creatorId,
        assignerId: creatorId,
      });
      SocketService.emitEvent('taskCreated', newTask);
      ResponseHelper.created(res, newTask, 'Task created successfully', `/api/tasks/${newTask.id}`);
    } catch (error) {
      next(error);
    }
  };

  static updateTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const existingTask = await db.getTaskById(id);
      if (!existingTask) {
        throw ApiError.notFound(`Task with ID '${id}' not found`);
      }

      await checkTaskAccess(existingTask, req.user);

      const { projectId, assigneeId } = req.body;

      if (projectId && projectId !== existingTask.projectId) {
        const project = await db.getProjectById(projectId);
        if (!project) {
          throw ApiError.badRequest(`Project with ID '${projectId}' does not exist`, [
            { field: 'projectId', message: 'Assigned project must be a valid project ID' },
          ]);
        }
      }

      if (assigneeId && assigneeId !== existingTask.assigneeId) {
        const assignee = await db.getUserById(assigneeId);
        if (!assignee) {
          throw ApiError.badRequest(`Assignee user with ID '${assigneeId}' does not exist`, [
            { field: 'assigneeId', message: 'Assigned user must be a valid user ID' },
          ]);
        }
      }

      const updated = await db.updateTask(id, req.body);
      SocketService.emitEvent('taskUpdated', updated);
      ResponseHelper.success(res, updated, 'Task updated successfully');
    } catch (error) {
      next(error);
    }
  };

  static updateTaskStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body as { status: TaskStatus };

      const existingTask = await db.getTaskById(id);
      if (!existingTask) {
        throw ApiError.notFound(`Task with ID '${id}' not found`);
      }

      await checkTaskAccess(existingTask, req.user);

      const updated = await db.updateTaskStatus(id, status);
      SocketService.emitEvent('taskUpdated', updated);
      ResponseHelper.success(res, updated, `Task status transitioned to '${status}' successfully`);
    } catch (error) {
      next(error);
    }
  };

  static deleteTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const existingTask = await db.getTaskById(id);
      if (!existingTask) {
        throw ApiError.notFound(`Task with ID '${id}' not found`);
      }

      await checkTaskAccess(existingTask, req.user);

      const deleted = await db.deleteTask(id);
      if (!deleted) {
        throw ApiError.notFound(`Task with ID '${id}' not found`);
      }
      SocketService.emitEvent('taskDeleted', { id });
      ResponseHelper.noContent(res);
    } catch (error) {
      next(error);
    }
  };

  static getSummaryMetrics = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { scope } = req.query as { scope?: string };
      const userId = scope === 'mine' ? req.user?.id : undefined;
      const authUser = req.user ? {
        id: req.user.id,
        email: req.user.email,
        username: (req.user as any).username,
        role: req.user.role,
      } : undefined;
      const metrics = await db.getSummaryMetrics({ userId, authUser });
      ResponseHelper.success(res, metrics, 'Summary metrics retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}
