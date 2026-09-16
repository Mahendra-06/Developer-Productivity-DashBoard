import { Request, Response, NextFunction } from 'express';
import { db } from '../data/db.js';
import { ResponseHelper } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export class UserController {
  static getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { search, role, scope } = req.query as { search?: string; role?: string; scope?: string };
      const currentUserId = req.user?.id;
      const users = await db.getUsers({ search, role, currentUserId, scope });
      ResponseHelper.success(res, users, 'Users retrieved successfully', 200, {
        total: users.length,
      });
    } catch (error) {
      next(error);
    }
  };

  static getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await db.getUserById(id);
      if (!user) {
        throw ApiError.notFound(`User with ID '${id}' not found`);
      }
      ResponseHelper.success(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  static getCurrentUserProfile = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (await db.getUserById('usr_1')) || (await db.getUsers())[0];
      if (!user) {
        ResponseHelper.success(res, {
          id: 'usr_dev_active',
          name: 'Developer Profile',
          username: 'developer',
          email: 'developer@dmetrics.dev',
          role: 'Project Maintainer',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          productivityScore: 0,
          activeStreak: 0,
          weeklyGoalHours: 40,
          currentGoalHours: 0,
          completedTasksCount: 0,
          openPRsCount: 0,
          mergedPRsCount: 0,
          focusStatus: 'Active Development 🚀',
          skills: [],
          contributions: [],
          integrations: [],
        }, 'Default active developer profile');
        return;
      }
      ResponseHelper.success(res, user, 'Current user profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  static createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, username } = req.body;

      // Check duplicate email
      if (await db.getUserByEmail(email)) {
        throw ApiError.conflict(`User with email '${email}' already exists`, [
          { field: 'email', message: 'Email address is already in use' },
        ]);
      }

      // Check duplicate username
      if (await db.getUserByUsername(username)) {
        throw ApiError.conflict(`User with username '${username}' already exists`, [
          { field: 'username', message: 'Username is already taken' },
        ]);
      }

      const newUser = await db.createUser(req.body);
      ResponseHelper.created(res, newUser, 'User created successfully', `/api/users/${newUser.id}`);
    } catch (error) {
      next(error);
    }
  };

  static updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const existingUser = await db.getUserById(id);
      if (!existingUser) {
        throw ApiError.notFound(`User with ID '${id}' not found`);
      }

      const { email, username } = req.body;
      if (email && email.toLowerCase() !== existingUser.email.toLowerCase()) {
        const conflict = await db.getUserByEmail(email);
        if (conflict && conflict.id !== id) {
          throw ApiError.conflict(`Email '${email}' is already in use by another user`, [
            { field: 'email', message: 'Email address is already in use' },
          ]);
        }
      }

      if (username && username.toLowerCase() !== existingUser.username.toLowerCase()) {
        const conflict = await db.getUserByUsername(username);
        if (conflict && conflict.id !== id) {
          throw ApiError.conflict(`Username '${username}' is already in use by another user`, [
            { field: 'username', message: 'Username is already taken' },
          ]);
        }
      }

      const updated = await db.updateUser(id, req.body);
      ResponseHelper.success(res, updated, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  };

  static deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const deleted = await db.deleteUser(id);
      if (!deleted) {
        throw ApiError.notFound(`User with ID '${id}' not found`);
      }
      ResponseHelper.noContent(res);
    } catch (error) {
      next(error);
    }
  };

  static inviteTeamMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw ApiError.unauthorized('Authentication required to invite team members');
      }
      const { name, email, role, username, githubUsername, projectId, password } = req.body;
      if (!email || !name) {
        throw ApiError.badRequest('Name and email are required to invite a team member');
      }

      const result = await db.inviteTeamMember(req.user.id, {
        name,
        email,
        role: role || 'Senior Full-Stack Engineer',
        username,
        githubUsername,
        projectId,
        password,
      });

      ResponseHelper.success(res, result, result.isExisting ? 'Existing user added to your team successfully' : 'New team member invited successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  static removeTeamMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        throw ApiError.unauthorized('Authentication required to remove team members');
      }
      const { memberId } = req.params;
      if (!memberId) {
        throw ApiError.badRequest('Member ID is required');
      }

      if (req.user.id === memberId) {
        throw ApiError.badRequest('You cannot remove yourself from your own team');
      }

      const success = await db.removeTeamMember(req.user.id, memberId);
      if (!success) {
        throw ApiError.notFound(`Member with ID '${memberId}' could not be removed or was not found`);
      }

      ResponseHelper.success(res, { success: true }, 'Team member removed successfully');
    } catch (error) {
      next(error);
    }
  };
}
