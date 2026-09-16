import { Request, Response } from 'express';
import { ResponseHelper } from '../utils/ApiResponse.js';
import { env } from '../config/env.js';

export class HealthController {
  static getHealth = (_req: Request, res: Response): void => {
    const memoryUsage = process.memoryUsage();
    const data = {
      status: 'healthy',
      service: 'dmetrics-backend',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: env.NODE_ENV,
      nodeVersion: process.version,
      memory: {
        rssMB: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      },
    };
    ResponseHelper.success(res, data, 'API is operational and healthy');
  };
}
