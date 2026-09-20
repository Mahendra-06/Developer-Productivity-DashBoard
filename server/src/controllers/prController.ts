import { Request, Response, NextFunction } from 'express';
import { db } from '../data/db.js';
import { ResponseHelper } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { SocketService } from '../services/socketService.js';

export class PRController {
  static getAllPRs = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        scope,
        queueType,
        projectId,
        projectType,
        slaStatus,
        status,
        repo,
        search
      } = req.query as Record<string, string | undefined>;

      const currentUserId = req.user?.id;
      const currentUserName = req.user?.name;
      const currentUsername = req.user?.username;

      const prs = await db.getPullRequests({
        currentUserId,
        currentUserName,
        currentUsername,
        queueType,
        projectId,
        projectType,
        slaStatus,
        status,
        repo,
        search,
        scope,
      });
      ResponseHelper.success(res, prs, 'Pull requests retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  static getPRById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const pr = await db.getPRById(id);
      if (!pr) {
        throw ApiError.notFound(`Pull request with ID '${id}' not found`);
      }
      ResponseHelper.success(res, pr, 'Pull request details retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  static getPRMetrics = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { projectId } = req.query as { projectId?: string };
      const metrics = await db.getPRMetrics({
        currentUserId: req.user?.id,
        currentUserName: req.user?.name,
        projectId
      });
      ResponseHelper.success(res, metrics, 'PR review velocity and SLA metrics calculated');
    } catch (error) {
      next(error);
    }
  };

  static createPR = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = {
        ...req.body,
        author: req.body.author || {
          id: req.user?.id || 'usr_1',
          name: req.user?.name || 'Developer',
          avatar: req.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          role: req.user?.role || 'Software Engineer',
          username: req.user?.username || 'developer'
        }
      };
      const pr = await db.createPullRequest(payload);
      SocketService.emitEvent('prCreated', pr);
      ResponseHelper.created(res, pr, 'Pull request created successfully');
    } catch (error) {
      next(error);
    }
  };

  static reviewPR = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { action, comment, reviewer } = req.body;

      const actor = req.user ? {
        id: req.user.id,
        name: req.user.name,
        avatar: req.user.avatar,
        role: req.user.role,
        username: req.user.username
      } : reviewer;

      const reviewed = await db.reviewPullRequest(id, { action, comment, reviewer: actor }, actor);
      if (!reviewed) {
        throw ApiError.notFound(`Pull request with ID '${id}' not found`);
      }
      const message = action === 'approve'
        ? `Pull request #${reviewed.number || reviewed.prNumber || id} approved! Team turnaround metric updated.`
        : `Changes requested on PR #${reviewed.number || reviewed.prNumber || id}. Review SLA flagged at risk.`;

      SocketService.emitEvent('prUpdated', reviewed);
      ResponseHelper.success(res, reviewed, message);
    } catch (error: any) {
      if (error.message && error.message.includes('Authors cannot approve their own pull requests')) {
        return next(ApiError.badRequest(error.message));
      }
      next(error);
    }
  };

  static updatePR = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const actor = req.user ? {
        id: req.user.id,
        name: req.user.name,
        avatar: req.user.avatar,
        role: req.user.role,
      } : undefined;

      const updated = await db.updatePullRequest(id, req.body, actor);
      if (!updated) {
        throw ApiError.notFound(`Pull request with ID '${id}' not found`);
      }
      SocketService.emitEvent('prUpdated', updated);
      ResponseHelper.success(res, updated, 'Pull request updated successfully');
    } catch (error: any) {
      if (error.message && error.message.includes('Authors cannot approve their own pull requests')) {
        return next(ApiError.badRequest(error.message));
      }
      next(error);
    }
  };

  static mergePR = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const actor = req.body?.actor || (req.user ? {
        id: req.user.id,
        name: req.user.name,
        avatar: req.user.avatar,
        role: req.user.role,
      } : undefined);

      const merged = await db.mergePullRequest(id, actor);
      if (!merged) {
        throw ApiError.notFound(`Pull request with ID '${id}' not found`);
      }
      SocketService.emitEvent('prUpdated', merged);
      ResponseHelper.success(res, merged, 'Pull request merged, linked tasks completed, and production release triggered');
    } catch (error: any) {
      if (error.message && error.message.includes('require peer review and approval')) {
        return next(ApiError.badRequest(error.message));
      }
      next(error);
    }
  };
}
