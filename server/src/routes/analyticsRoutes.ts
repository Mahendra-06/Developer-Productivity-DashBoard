import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', optionalAuth, AnalyticsController.getAnalytics);

export default router;
