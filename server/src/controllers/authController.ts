import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../data/db.js';
import { env } from '../config/env.js';
import { ResponseHelper } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export class AuthController {
  static register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, email, role, username, password, avatar, bio, location, timezone, githubUsername, githubToken } = req.body;

      // Check existing email
      if (await db.getUserByEmail(email)) {
        throw ApiError.conflict(`User with email '${email}' already exists`, [
          { field: 'email', message: 'Email address is already registered' },
        ]);
      }

      // Check existing username
      if (await db.getUserByUsername(username)) {
        throw ApiError.conflict(`User with username '${username}' already exists`, [
          { field: 'username', message: 'Username is already taken' },
        ]);
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Clean GitHub username if full URL was pasted
      const cleanGithub = githubUsername
        ? githubUsername.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\/$/, '')
        : '';

      const newUser = await db.createUser({
        name,
        email,
        role,
        username,
        avatar: avatar || (cleanGithub ? `https://github.com/${cleanGithub}.png` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`),
        bio: bio || '',
        location: location || '',
        timezone: timezone || 'UTC',
        githubUsername: cleanGithub,
        githubToken: githubToken || '',
        githubUrl: cleanGithub ? `https://github.com/${cleanGithub}` : '',
        invitedBy: req.body.invitedBy || '',
        passwordHash,
      });

      // Generate JWT
      const token = jwt.sign(
        { id: newUser.id, email: newUser.email, role: newUser.role },
        env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const { passwordHash: _, ...sanitizedUser } = newUser;

      ResponseHelper.created(
        res,
        { user: sanitizedUser, token },
        'User registered successfully',
        `/api/users/${newUser.id}`
      );
    } catch (error) {
      next(error);
    }
  };

  static login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { login, password } = req.body; // login can be email or username

      // Lookup by email or username (supporting @innovate.dev and @dmetrics.dev aliases)
      let user = (await db.getUserByEmail(login)) || (await db.getUserByUsername(login));
      if (!user && login.includes('@')) {
        const altEmail = login.includes('@dmetrics.dev')
          ? login.replace('@dmetrics.dev', '@innovate.dev')
          : login.replace('@innovate.dev', '@dmetrics.dev');
        user = await db.getUserByEmail(altEmail);
      }

      if (!user) {
        throw new ApiError(401, 'Invalid credentials. Please check your email/username and password.', [], true, '', 'UnauthorizedError');
      }

      // Verify password if user has passwordHash, or allow dev password 'password123' for seeded demo accounts
      let isMatch = false;
      if (user.passwordHash) {
        isMatch = await bcrypt.compare(password, user.passwordHash);
      } else {
        // Fallback for pre-seeded users (Alex Chen, etc.)
        isMatch = password === 'password123' || password === 'admin' || password === 'dmetrics';
      }

      if (!isMatch) {
        throw new ApiError(401, 'Invalid credentials. Please check your email/username and password.', [], true, '', 'UnauthorizedError');
      }

      // Sign JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      const { passwordHash: _, ...sanitizedUser } = user;

      ResponseHelper.success(
        res,
        { user: sanitizedUser, token },
        'Authentication successful'
      );
    } catch (error) {
      next(error);
    }
  };

  static getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized', [], true, '', 'UnauthorizedError');
      }
      ResponseHelper.success(res, req.user, 'Current user profile');
    } catch (error) {
      next(error);
    }
  };
}
