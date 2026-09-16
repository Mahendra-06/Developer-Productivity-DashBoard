import { Router } from 'express';
import { AuditController } from '../controllers/auditController.js';
import { validate } from '../middleware/validate.js';
import { optionalAuth } from '../middleware/authMiddleware.js';
import { createAuditSchema } from '../validators/schemas.js';

const router = Router();

router.get('/', optionalAuth, AuditController.getAllAuditEvents);
router.post('/', validate({ body: createAuditSchema }), AuditController.createAuditEvent);

export default router;
