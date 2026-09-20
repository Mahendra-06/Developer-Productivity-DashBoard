import { Response, NextFunction } from 'express';
import { db } from '../data/db.js';
import { ResponseHelper } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export class TeamController {
  static createInvitation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const inviterId = req.user?.id || 'usr_1';

      const { email, name, role, username, githubUsername, projectId } = req.body;
      if (!email) {
        throw ApiError.badRequest('Email is required to invite a team member');
      }

      // Check if existing user with that email or username
      const cleanEmail = email.trim().toLowerCase();
      const existingUser = await db.getUserByEmail(cleanEmail) || (username ? await db.getUserByUsername(username.trim()) : null);
      if (!existingUser) {
        throw ApiError.notFound('This user must create an account before they can be invited.');
      }

      const invitation = await db.createTeamInvitation({
        inviterId,
        inviteeEmail: cleanEmail,
        inviteeName: name || existingUser.name,
        inviteeUsername: username || existingUser.username,
        role: role || existingUser.role,
        githubUsername: githubUsername || existingUser.githubUsername,
        projectId,
        status: (req.body.status as any) || 'pending',
      });

      ResponseHelper.created(res, invitation, 'Team invitation created successfully', `/api/team/invitations/${invitation.id}`);
    } catch (error) {
      next(error);
    }
  };

  static getInvitations = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id || 'usr_1';

      const { status, projectId } = req.query as { status?: string; projectId?: string };
      const invitations = await db.getTeamInvitations({
        userId,
        status,
        projectId,
      });

      ResponseHelper.success(res, invitations, 'Team invitations retrieved successfully', 200, {
        total: invitations.length,
      });
    } catch (error) {
      next(error);
    }
  };

  static getInvitationById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const invitation = await db.getTeamInvitationById(id);
      if (!invitation) {
        throw ApiError.notFound(`Team invitation '${id}' not found`);
      }

      ResponseHelper.success(res, invitation, 'Team invitation retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  static acceptInvitation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const acceptingUserId = req.user?.id || 'usr_1';

      const { id } = req.params;
      const accepted = await db.acceptTeamInvitation(id, acceptingUserId);
      if (!accepted) {
        throw ApiError.badRequest(`Team invitation '${id}' could not be accepted (it may be expired, invalid, or already accepted)`);
      }

      ResponseHelper.success(res, accepted, 'Team invitation accepted successfully');
    } catch (error) {
      next(error);
    }
  };

  static revokeInvitation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const inviterId = req.user?.id || 'usr_1';

      const { id } = req.params;
      const success = await db.revokeTeamInvitation(inviterId, id);
      if (!success) {
        throw ApiError.notFound(`Team invitation '${id}' not found or you are not authorized to revoke it`);
      }

      ResponseHelper.success(res, { success: true }, 'Team invitation revoked successfully');
    } catch (error) {
      next(error);
    }
  };

  static removeMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const removerId = req.user?.id || 'usr_1';

      const { memberId } = req.params;
      if (!memberId) {
        throw ApiError.badRequest('Member ID is required');
      }

      if (removerId === memberId) {
        throw ApiError.badRequest('You cannot remove yourself from your own team');
      }

      const success = await db.removeTeamMember(removerId, memberId);
      if (!success) {
        throw ApiError.notFound(`Member with ID '${memberId}' could not be removed or was not found`);
      }

      ResponseHelper.success(res, { success: true }, 'Team member removed successfully');
    } catch (error) {
      next(error);
    }
  };
}
