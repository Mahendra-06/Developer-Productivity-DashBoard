import { Request, Response, NextFunction } from 'express';
import { db } from '../data/db.js';
import { ResponseHelper } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { SocketService } from '../services/socketService.js';

export class DeploymentController {
  static getAllDeployments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        search,
        environment,
        status,
        projectId,
        developerId,
        timeRange,
        page,
        limit,
        sortBy,
        sortOrder,
        scope,
      } = req.query as any;

      const userId = scope === 'all' ? undefined : req.user?.id;
      const userName = scope === 'all' ? undefined : req.user?.name;

      const result = await db.getDeployments({
        search,
        environment,
        status,
        projectId,
        developerId,
        timeRange,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 50,
        sortBy,
        sortOrder,
        userId,
        userName,
      });

      ResponseHelper.success(
        res,
        result.deployments,
        'Deployments retrieved successfully',
        200,
        {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        }
      );
    } catch (error) {
      next(error);
    }
  };

  static getDeploymentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const deployment = await db.getDeploymentById(id);
      if (!deployment) {
        throw new ApiError(404, `Deployment with ID ${id} not found`);
      }
      ResponseHelper.success(res, deployment, 'Deployment retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  static createDeployment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payload = {
        ...req.body,
        author: req.body.author || {
          id: req.user?.id || 'usr_1',
          name: req.user?.name || 'Alex Chen',
          avatar: req.user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          email: req.user?.email,
          username: req.user?.username,
        },
        developerId: req.body.developerId || req.user?.id,
      };
      const deployment = await db.createDeployment(payload);
      SocketService.emitEvent('deploymentCreated', deployment);
      ResponseHelper.created(res, deployment, 'Deployment created and audit trail logged');
    } catch (error) {
      next(error);
    }
  };

  static updateDeployment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updated = await db.updateDeployment(id, req.body);
      if (!updated) {
        throw new ApiError(404, `Deployment with ID ${id} not found`);
      }
      SocketService.emitEvent('deploymentUpdated', updated);
      ResponseHelper.success(res, updated, 'Deployment updated successfully');
    } catch (error) {
      next(error);
    }
  };

  static deleteDeployment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted = await db.deleteDeployment(id);
      if (!deleted) {
        throw new ApiError(404, `Deployment with ID ${id} not found`);
      }
      SocketService.emitEvent('deploymentDeleted', { id });
      ResponseHelper.noContent(res);
    } catch (error) {
      next(error);
    }
  };


  static getDeploymentMetrics = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { scope, timeRange } = req.query as { scope?: string; timeRange?: string };
      const userId = scope === 'all' ? undefined : req.user?.id;
      const userName = scope === 'all' ? undefined : req.user?.name;
      const metrics = await db.getDeploymentMetrics({ userId, userName, timeRange });
      ResponseHelper.success(res, metrics, 'Deployment metrics retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  static getDeploymentTrends = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { scope, timeRange } = req.query as { scope?: string; timeRange?: string };
      const userId = scope === 'all' ? undefined : req.user?.id;
      const userName = scope === 'all' ? undefined : req.user?.name;
      const trends = await db.getDeploymentTrends({ userId, userName, timeRange });
      ResponseHelper.success(res, trends, 'Deployment trends retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  static getDeploymentEnvironments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { scope, timeRange } = req.query as { scope?: string; timeRange?: string };
      const userId = scope === 'all' ? undefined : req.user?.id;
      const userName = scope === 'all' ? undefined : req.user?.name;
      const environments = await db.getDeploymentEnvironments({ userId, userName, timeRange });
      ResponseHelper.success(res, environments, 'Deployment environments distribution retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}

