import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { db } from '../data/db.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../types/index.js';

export interface AuthRequest extends Request {
  user?: Omit<User, 'passwordHash'>;
}

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Authentication Middleware:
 * Requires a valid Bearer JWT token in the Authorization header.
 * Attaches the sanitized authenticated user to req.user.
 * Returns 401 Unauthorized if missing, malformed, expired, or user not found.
 */
export const requireAuth = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Authentication required: Access token is missing or malformed'));
  }

  const token = authHeader.split(' ')[1]?.trim();
  if (!token) {
    return next(ApiError.unauthorized('Authentication required: Bearer token is empty'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const user = await db.getUserById(decoded.id);
    if (!user) {
      return next(ApiError.unauthorized('Unauthorized: Authenticated user account no longer exists'));
    }

    const { passwordHash: _, ...sanitizedUser } = user;
    req.user = sanitizedUser;
    next();
  } catch (err: any) {
    return next(ApiError.unauthorized('Unauthorized: Token has expired or signature is invalid'));
  }
};

/**
 * Role-Based Authorization Middleware (RBAC):
 * Verifies that the authenticated user possesses one of the required roles.
 * Returns 403 Forbidden if the user's role does not match or include one of the allowed roles.
 */
export const requireRoles = (...allowedRoles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required to verify permissions'));
    }

    const userRole = (req.user.role || '').toLowerCase();
    const hasPermission = allowedRoles.some(allowed => 
      userRole.includes(allowed.toLowerCase()) || allowed.toLowerCase() === 'all'
    );

    if (!hasPermission) {
      return next(ApiError.forbidden(
        `Forbidden: Role '${req.user.role}' lacks sufficient privileges. Required roles: ${allowedRoles.join(', ')}`
      ));
    }

    next();
  };
};

/**
 * Pre-configured authorization rule for administrative/lead engineering operations.
 */
export const requireAdminOrLead = requireRoles('Staff', 'Lead', 'Admin', 'Architect', 'Principal');

/**
 * Optional Authentication:
 * Extracts and sets req.user if a valid token is provided, but allows the request to continue as guest if absent.
 */
export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1]?.trim();
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const user = await db.getUserById(decoded.id);
    if (user) {
      const { passwordHash: _, ...sanitizedUser } = user;
      req.user = sanitizedUser;
    }
  } catch (e) {
    // Continue as guest
  }
  next();
};
