import { Router } from 'express';
import { TeamController } from '../controllers/teamController.js';
import { validate } from '../middleware/validate.js';
import { optionalAuth } from '../middleware/authMiddleware.js';
import {
  createTeamInvitationSchema,
  teamInvitationQuerySchema,
  idParamSchema,
} from '../validators/schemas.js';

const router = Router();

// Invitations endpoints
router.get(
  '/invitations',
  optionalAuth,
  validate({ query: teamInvitationQuerySchema }),
  TeamController.getInvitations
);

router.post(
  '/invitations',
  optionalAuth,
  validate({ body: createTeamInvitationSchema }),
  TeamController.createInvitation
);

router.get(
  '/invitations/:id',
  optionalAuth,
  validate({ params: idParamSchema }),
  TeamController.getInvitationById
);

router.post(
  '/invitations/:id/accept',
  optionalAuth,
  validate({ params: idParamSchema }),
  TeamController.acceptInvitation
);

router.post(
  '/invitations/:id/revoke',
  optionalAuth,
  validate({ params: idParamSchema }),
  TeamController.revokeInvitation
);

router.delete(
  '/invitations/:id',
  optionalAuth,
  validate({ params: idParamSchema }),
  TeamController.revokeInvitation
);

// Member removal endpoint
router.delete(
  '/members/:memberId',
  optionalAuth,
  TeamController.removeMember
);

export default router;
