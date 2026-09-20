import { Request, Response, NextFunction } from 'express';
import { db } from '../data/db.js';
import { ResponseHelper } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { ProjectStatus } from '../types/index.js';
import { AuthRequest } from '../middleware/authMiddleware.js';
import { SocketService } from '../services/socketService.js';

export class ProjectController {
  static getAllProjects = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, search, scope } = req.query as { status?: ProjectStatus | 'all'; search?: string; scope?: string };
      // When scope is 'mine', filter strictly to user's projects
      const userId = scope === 'mine' ? req.user?.id : undefined;
      const currentUserId = req.user?.id;
      const projects = await db.getProjects({ status, search, userId, currentUserId, scope });
      ResponseHelper.success(res, projects, 'Projects retrieved successfully', 200, {
        total: projects.length,
      });
    } catch (error) {
      next(error);
    }
  };

  static getProjectById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const project = await db.getProjectById(id);
      if (!project) {
        throw ApiError.notFound(`Project with ID or key '${id}' not found`);
      }
      ResponseHelper.success(res, project, 'Project retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  static getProjectDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const details = await db.getProjectDetails(id);
      if (!details) {
        throw ApiError.notFound(`Project with ID or key '${id}' not found`);
      }
      ResponseHelper.success(res, details, 'Project details retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  static createProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { key, leadId } = req.body;

      // Check duplicate project key
      if (await db.getProjectByKey(key)) {
        throw ApiError.conflict(`Project with key '${key.toUpperCase()}' already exists`, [
          { field: 'key', message: 'Project key must be unique' },
        ]);
      }

      // Verify that leadId exists
      const lead = await db.getUserById(leadId);
      if (!lead) {
        throw ApiError.badRequest(`Lead user with ID '${leadId}' does not exist`, [
          { field: 'leadId', message: 'Assigned lead must be a valid user ID' },
        ]);
      }

      const newProject = await db.createProject(req.body);
      SocketService.emitEvent('projectCreated', newProject);
      ResponseHelper.created(res, newProject, 'Project created successfully', `/api/projects/${newProject.id}`);
    } catch (error) {
      next(error);
    }
  };

  static updateProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const existingProject = await db.getProjectById(id);
      if (!existingProject) {
        throw ApiError.notFound(`Project with ID '${id}' not found`);
      }

      const { key, leadId } = req.body;
      if (key && key.toUpperCase() !== existingProject.key.toUpperCase()) {
        const conflict = await db.getProjectByKey(key);
        if (conflict && conflict.id !== existingProject.id) {
          throw ApiError.conflict(`Project key '${key.toUpperCase()}' is already in use by another project`, [
            { field: 'key', message: 'Project key must be unique' },
          ]);
        }
      }

      if (leadId) {
        const lead = await db.getUserById(leadId);
        if (!lead) {
          throw ApiError.badRequest(`Lead user with ID '${leadId}' does not exist`, [
            { field: 'leadId', message: 'Assigned lead must be a valid user ID' },
          ]);
        }
      }

      const updated = await db.updateProject(id, req.body);
      SocketService.emitEvent('projectUpdated', updated);
      ResponseHelper.success(res, updated, 'Project updated successfully');
    } catch (error) {
      next(error);
    }
  };

  static deleteProject = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted = await db.deleteProject(id);
      if (!deleted) {
        throw ApiError.notFound(`Project with ID '${id}' not found`);
      }
      SocketService.emitEvent('projectDeleted', { id });
      ResponseHelper.noContent(res);
    } catch (error) {
      next(error);
    }
  };
}
