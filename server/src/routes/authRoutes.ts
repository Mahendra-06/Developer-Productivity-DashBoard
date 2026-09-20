import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { requireAuth, requireAdminOrLead } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema, verifyEmailOtpSchema, resendEmailOtpSchema } from '../validators/schemas.js';
import { ResponseHelper } from '../utils/ApiResponse.js';

const router = Router();

router.post(
  '/register',
  validate({ body: registerSchema }),
  AuthController.register
);

router.post(
  '/login',
  validate({ body: loginSchema }),
  AuthController.login
);

router.post(
  '/verify-email-otp',
  validate({ body: verifyEmailOtpSchema }),
  AuthController.verifyEmailOtp
);

router.post(
  '/resend-email-otp',
  validate({ body: resendEmailOtpSchema }),
  AuthController.resendEmailOtp
);

router.get(
  '/me',
  requireAuth,
  AuthController.getMe
);

// Protected authorization verification endpoint
router.get(
  '/verify-lead',
  requireAuth,
  requireAdminOrLead,
  (req, res) => {
    ResponseHelper.success(res, { authorized: true, user: (req as any).user }, 'Authorized with elevated engineering privileges');
  }
);

export default router;
