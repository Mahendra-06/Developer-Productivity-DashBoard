import { Router } from 'express';
import { PRController } from '../controllers/prController.js';
import { validate } from '../middleware/validate.js';
import { optionalAuth } from '../middleware/authMiddleware.js';
import { idParamSchema, updatePRSchema, reviewPRSchema, prQuerySchema } from '../validators/schemas.js';

const router = Router();

router.get('/', optionalAuth, validate({ query: prQuerySchema }), PRController.getAllPRs);
router.get('/metrics', optionalAuth, PRController.getPRMetrics);
router.get('/:id', optionalAuth, validate({ params: idParamSchema }), PRController.getPRById);
router.post('/', optionalAuth, PRController.createPR);
router.post('/:id/review', optionalAuth, validate({ params: idParamSchema, body: reviewPRSchema }), PRController.reviewPR);
router.patch('/:id', optionalAuth, validate({ params: idParamSchema, body: updatePRSchema }), PRController.updatePR);
router.post('/:id/merge', optionalAuth, validate({ params: idParamSchema }), PRController.mergePR);

export default router;
