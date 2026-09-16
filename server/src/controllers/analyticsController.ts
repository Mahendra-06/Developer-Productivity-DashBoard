import { Request, Response, NextFunction } from 'express';
import { db } from '../data/db.js';
import { ResponseHelper } from '../utils/ApiResponse.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export class AnalyticsController {
  static getAnalytics = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { scope } = req.query as { scope?: string };
      // When authenticated, filter by req.user unless scope is all
      const userId = scope === 'all' ? undefined : req.user?.id;
      const userName = scope === 'all' ? undefined : req.user?.name;
      const analytics = await db.getAnalytics({ userId, userName });
      ResponseHelper.success(res, analytics, 'Analytics data retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}

export const getAnalytics = AnalyticsController.getAnalytics;
