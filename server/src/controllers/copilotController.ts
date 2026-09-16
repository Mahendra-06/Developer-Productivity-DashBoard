import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { CopilotService } from '../services/copilotService.js';
import { ResponseHelper } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { db } from '../data/db.js';
import { env } from '../config/env.js';
import { TaskPriority, TaskStatus } from '../types/index.js';

export class CopilotController {
  static chat = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { messages, currentTab } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        throw ApiError.badRequest('messages must be a non-empty array of chat items');
      }

      const userContext = {
        userId: req.user?.id || 'usr_default',
        userName: req.user?.name || 'Developer',
        userEmail: req.user?.email || 'developer@dmetrics.dev',
        userRole: req.user?.role || 'Staff Software Engineer',
      };

      const result = await CopilotService.chat(messages, userContext, currentTab || 'dashboard');
      ResponseHelper.success(res, result, 'Copilot response generated');
    } catch (error) {
      next(error);
    }
  };

  static executeAction = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { action, data } = req.body;

      if (!action || typeof action !== 'string') {
        throw ApiError.badRequest('action type is required');
      }

      if (!data || typeof data !== 'object') {
        throw ApiError.badRequest('action data payload is required');
      }

      const userId = req.user?.id || 'usr_default';
      const userName = req.user?.name || 'Developer';

      if (action === 'create_task') {
        const { title, description, priority, projectId, dueDate, storyPoints } = data;

        if (!title || typeof title !== 'string') {
          throw ApiError.badRequest('Task title is required');
        }

        // Create task
        const newTask = await db.createTask({
          title: title.trim(),
          description: description || `Created via DMetrics Copilot: ${title}`,
          projectId: projectId || 'proj_1',
          assigneeId: userId,
          dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          priority: (priority as TaskPriority) || 'medium',
          status: 'todo' as TaskStatus,
          storyPoints: typeof storyPoints === 'number' ? storyPoints : 3,
          tags: ['AI-Created', 'Copilot'],
        });

        // Record audit activity
        await db.createAuditEvent({
          action: `Created task "${newTask.title}" (${newTask.key}) via AI Copilot confirmation`,
          category: 'task',
          userId,
          details: { taskId: newTask.id, key: newTask.key, priority: newTask.priority },
        });

        ResponseHelper.created(res, { task: newTask }, `Task ${newTask.key} created successfully`);
        return;
      }

      throw ApiError.badRequest(`Unsupported action type: ${action}`);
    } catch (error) {
      next(error);
    }
  };

  static health = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const hasKey = Boolean(env.OPENAI_API_KEY && env.OPENAI_API_KEY.startsWith('sk-'));
      ResponseHelper.success(res, {
        status: 'online',
        model: env.OPENAI_MODEL,
        hasApiKey: hasKey,
        features: ['tool-calling', 'metrics-analysis', 'code-assistance', 'action-confirmation'],
      });
    } catch (error) {
      next(error);
    }
  };
}
