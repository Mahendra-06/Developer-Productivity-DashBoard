import { Request, Response, NextFunction } from 'express';
import { AiService } from '../services/aiService.js';
import { ResponseHelper } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

export class AiController {
  static taskBreakdown = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { title, description } = req.body;
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        throw ApiError.badRequest('Title is required for AI task breakdown', [
          { field: 'title', message: 'Task title cannot be empty' },
        ]);
      }

      const result = await AiService.generateTaskBreakdown(title, description || '');
      ResponseHelper.success(res, result, 'Task breakdown generated successfully');
    } catch (error) {
      next(error);
    }
  };

  static prReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { prNumber, title, diffSnippet } = req.body;
      if (!title) {
        throw ApiError.badRequest('PR title is required for review analysis');
      }

      const result = await AiService.generatePRReview(
        prNumber || 1,
        title,
        diffSnippet || 'No diff provided.'
      );
      ResponseHelper.success(res, result, 'PR code review insights generated');
    } catch (error) {
      next(error);
    }
  };
}
