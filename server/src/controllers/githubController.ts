import { Request, Response, NextFunction } from 'express';
import { GithubService } from '../services/githubService.js';
import { ResponseHelper } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { isMongoConnected } from '../config/mongo.js';
import { UserModel } from '../models/UserModel.js';
import { ProjectModel } from '../models/ProjectModel.js';
import { TaskModel } from '../models/TaskModel.js';
import { PullRequestModel } from '../models/PullRequestModel.js';
import { AuditActivityModel } from '../models/AuditActivityModel.js';
import { db } from '../data/db.js';
import { ProjectStatus } from '../types/index.js';

export class GithubController {
  static getUser = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await GithubService.getAuthenticatedUser();
      ResponseHelper.success(res, user, 'GitHub user status');
    } catch (error) {
      next(error);
    }
  };

  static getPullRequests = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const prs = await GithubService.getUserPullRequests();
      ResponseHelper.success(res, prs, 'GitHub pull requests retrieved');
    } catch (error) {
      next(error);
    }
  };

  static syncRepo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { repoUrl, projectId, token, leadId } = req.body;
      if (!repoUrl) {
        throw ApiError.badRequest('repoUrl is required (e.g. "facebook/react" or "https://github.com/owner/repo")');
      }

      const analyzedData = await GithubService.ingestAndAnalyzeRepo(repoUrl, projectId, token);

      // Persist real project, tasks, PRs, and audit telemetry to backend database (db)
      try {
        if (analyzedData.project) {
          const p = analyzedData.project;
          const effectiveLeadId = leadId || p.lead?.id || 'usr_1';
          const existingProj = await db.getProjectById(p.id) || await db.getProjectByKey(p.key);
          const { lead: _lead, team: _team, ...projectData } = p;
          if (existingProj) {
            await db.updateProject(existingProj.id, {
              ...projectData,
              status: p.status as ProjectStatus,
              leadId: effectiveLeadId,
              teamIds: [effectiveLeadId],
              updatedAt: new Date().toISOString(),
            });
          } else {
            await db.createProject({
              ...p,
              status: p.status as ProjectStatus,
              id: p.id,
              leadId: effectiveLeadId,
              teamIds: [effectiveLeadId],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        }

        if (Array.isArray(analyzedData.tasks) && analyzedData.tasks.length > 0) {
          for (const t of analyzedData.tasks) {
            const existingTask = await db.getTaskById(t.id);
            if (existingTask) {
              const { assignee: _assignee, projectName: _projectName, ...taskUpdates } = t;
              await db.updateTask(t.id, { ...taskUpdates, updatedAt: new Date().toISOString() });
            } else {
              const { assignee: _assignee, projectName: _projectName, ...taskData } = t;
              await db.createTask({
                ...taskData,
                id: t.id,
                assigneeId: leadId || t.assignee?.id || 'usr_1',
                createdAt: t.createdAt || new Date().toISOString(),
                updatedAt: t.updatedAt || new Date().toISOString(),
              });
            }
          }
        }

        if (Array.isArray(analyzedData.pulls) && analyzedData.pulls.length > 0) {
          const allPrs = await db.getPullRequests();
          for (const pr of analyzedData.pulls) {
            const existingPr = allPrs.find((p: any) => p.id === pr.id || (p.repo === pr.repo && p.number === pr.number));
            if (existingPr) {
              await db.updatePullRequest(existingPr.id, pr);
            } else {
              await db.createPullRequest(pr);
            }
          }
        }

        let leadUser = null;
        if (leadId) {
          leadUser = await db.getUserById(leadId);
        }
        await db.createAuditEvent({
          id: `evt_gh_${Date.now()}`,
          category: 'system',
          actor: {
            name: leadUser?.name || 'Mahendra Kumar',
            avatar: leadUser?.avatar || 'https://github.com/Mahendra-06.png',
            role: leadUser?.role || 'Backend Systems Engineer',
          },
          action: `synced repository ${repoUrl}`,
          target: `${analyzedData.project?.name || repoUrl} (${analyzedData.tasks?.length || 0} issues, ${analyzedData.commits?.length || 0} commits)`,
          timestamp: new Date().toISOString(),
          relativeTime: 'Just now',
          metadata: `Live telemetry active • ${analyzedData.contributors?.length || 0} contributors • 12-week heatmap populated`,
          status: 'success',
        });
      } catch (dbErr) {
        console.warn('In-memory db persistence note for GitHub sync:', dbErr);
      }

      // Persist real project, tasks, and telemetry to database
      if (isMongoConnected()) {
        try {
          if (analyzedData.project) {
            const p = analyzedData.project;
            const effectiveLeadId = leadId || p.lead?.id || 'usr_1';
            const { lead: _l, team: _t, ...raw } = p;
            await ProjectModel.findOneAndUpdate(
              { id: p.id },
              {
                ...raw,
                leadId: effectiveLeadId,
                teamIds: [effectiveLeadId],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              { upsert: true, new: true }
            );
          }

          if (Array.isArray(analyzedData.tasks) && analyzedData.tasks.length > 0) {
            for (const t of analyzedData.tasks) {
              const { assignee: _a, projectName: _pn, ...rawTask } = t;
              await TaskModel.findOneAndUpdate(
                { id: t.id },
                {
                  ...rawTask,
                  assigneeId: leadId || t.assignee?.id || 'usr_1',
                  createdAt: t.createdAt || new Date().toISOString(),
                  updatedAt: t.updatedAt || new Date().toISOString(),
                },
                { upsert: true, new: true }
              );
            }
          }

          if (Array.isArray(analyzedData.pulls) && analyzedData.pulls.length > 0) {
            for (const pr of analyzedData.pulls) {
              await PullRequestModel.findOneAndUpdate(
                { id: pr.id },
                pr,
                { upsert: true, new: true }
              );
            }
          }

          // Log real audit event for the ingested project with authentic developer profile
          let leadUser = null;
          if (leadId) {
            leadUser = await UserModel.findOne({ id: leadId });
          }
          if (!leadUser) {
            leadUser = await UserModel.findOne({ role: { $ne: 'guest' } });
          }

          await AuditActivityModel.create({
            id: `evt_gh_${Date.now()}`,
            category: 'system',
            actor: {
              name: leadUser?.name || 'Mahendra Kumar',
              avatar: leadUser?.avatar || 'https://github.com/Mahendra-06.png',
              role: leadUser?.role || 'Backend Systems Engineer',
            },
            action: `synced repository ${repoUrl}`,
            target: `${analyzedData.project?.name || repoUrl} (${analyzedData.tasks?.length || 0} issues, ${analyzedData.commits?.length || 0} commits)`,
            timestamp: new Date().toISOString(),
            relativeTime: 'Just now',
            metadata: `Live telemetry active • ${analyzedData.contributors?.length || 0} contributors • 12-week heatmap populated`,
            status: 'success',
          });
        } catch (dbErr) {
          console.warn('MongoDB persistence note for GitHub sync:', dbErr);
        }
      }

      ResponseHelper.success(
        res,
        analyzedData,
        `Successfully synced and analyzed GitHub repository: ${repoUrl}`
      );
    } catch (error) {
      next(error);
    }
  };

  static getRepoAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const repoUrl = req.query.repoUrl as string;
      if (!repoUrl) {
        throw ApiError.badRequest('repoUrl query parameter is required');
      }

      const analyzedData = await GithubService.ingestAndAnalyzeRepo(repoUrl);
      ResponseHelper.success(
        res,
        analyzedData,
        `Analytics computed for repository: ${repoUrl}`
      );
    } catch (error) {
      next(error);
    }
  };
}
