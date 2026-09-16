import { Request, Response, NextFunction } from 'express';
import { db } from '../data/db.js';
import { ResponseHelper } from '../utils/ApiResponse.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export class AuditController {
  static getAllAuditEvents = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { scope } = req.query as { scope?: string };
      // When authenticated, filter by req.user unless scope is all
      const userId = scope === 'all' ? undefined : req.user?.id;
      const userName = scope === 'all' ? undefined : req.user?.name;
      const events = await db.getAuditEvents({ userId, userName });
      ResponseHelper.success(res, events, 'Audit events retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  static createAuditEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const event = await db.createAuditEvent(req.body);
      ResponseHelper.created(res, event, 'Audit event recorded');
    } catch (error) {
      next(error);
    }
  };
}
