import { Router } from 'express';
import { AiController } from '../controllers/aiController.js';
import { CopilotController } from '../controllers/copilotController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Existing AI endpoints
router.post('/task-breakdown', AiController.taskBreakdown);
router.post('/pr-review', AiController.prReview);

// DMetrics Developer Copilot Endpoints
router.get('/copilot/health', CopilotController.health);
router.post('/copilot/chat', optionalAuth, CopilotController.chat);
router.post('/copilot/action/execute', optionalAuth, CopilotController.executeAction);

export default router;
