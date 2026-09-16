import { Router } from 'express';
import { UserController } from '../controllers/userController.js';
import { validate } from '../middleware/validate.js';
import { optionalAuth } from '../middleware/authMiddleware.js';
import {
  createUserSchema,
  updateUserSchema,
  userQuerySchema,
  idParamSchema,
} from '../validators/schemas.js';

const router = Router();

router.get(
  '/',
  optionalAuth,
  validate({ query: userQuerySchema }),
  UserController.getAllUsers
);

router.get('/current/profile', UserController.getCurrentUserProfile);
router.post('/invite', optionalAuth, UserController.inviteTeamMember);
router.delete('/team/:memberId', optionalAuth, UserController.removeTeamMember);

router.get(
  '/:id',
  validate({ params: idParamSchema }),
  UserController.getUserById
);

router.post(
  '/',
  validate({ body: createUserSchema }),
  UserController.createUser
);

router.put(
  '/:id',
  validate({ params: idParamSchema, body: updateUserSchema }),
  UserController.updateUser
);

router.patch(
  '/:id',
  validate({ params: idParamSchema, body: updateUserSchema }),
  UserController.updateUser
);

router.delete(
  '/:id',
  validate({ params: idParamSchema }),
  UserController.deleteUser
);

export default router;
