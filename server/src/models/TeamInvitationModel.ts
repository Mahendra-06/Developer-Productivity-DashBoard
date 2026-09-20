import mongoose, { Schema, Document } from 'mongoose';
import { TeamInvitation } from '../types/index.js';

export interface TeamInvitationDocument extends Omit<TeamInvitation, 'id'>, Document {
  id: string;
}

const TeamInvitationSchema = new Schema<TeamInvitationDocument>(
  {
    id: {
      type: String,
      required: [true, 'Invitation ID is required'],
      unique: true,
      index: true,
    },
    inviterId: {
      type: String,
      required: [true, 'Inviter ID is required'],
      index: true,
    },
    inviteeEmail: {
      type: String,
      required: [true, 'Invitee email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    inviteeName: {
      type: String,
      default: '',
      trim: true,
    },
    inviteeUsername: {
      type: String,
      default: '',
      trim: true,
    },
    role: {
      type: String,
      default: 'Senior Full-Stack Engineer',
      trim: true,
    },
    githubUsername: {
      type: String,
      default: '',
      trim: true,
    },
    projectId: {
      type: String,
      default: '',
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired', 'revoked'],
      default: 'pending',
      index: true,
    },
    tokenHash: {
      type: String,
      default: '',
    },
    expiresAt: {
      type: String,
      required: [true, 'Expiration timestamp is required'],
    },
    acceptedAt: {
      type: String,
      default: null,
    },
    createdAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
    updatedAt: {
      type: String,
      default: () => new Date().toISOString(),
    },
  },
  {
    versionKey: false,
    toJSON: {
      transform: (_doc, ret) => {
        delete (ret as any)._id;
        delete (ret as any).tokenHash;
        return ret;
      },
    },
  }
);

export const TeamInvitationModel =
  mongoose.models.TeamInvitation ||
  mongoose.model<TeamInvitationDocument>('TeamInvitation', TeamInvitationSchema);
