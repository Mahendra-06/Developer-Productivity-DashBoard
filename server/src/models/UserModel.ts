import mongoose, { Schema, Document } from 'mongoose';
import { User } from '../types/index.js';

export interface UserDocument extends Omit<User, 'id'>, Document {
  id: string;
}

const UserSchema = new Schema<UserDocument>(
  {
    id: {
      type: String,
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      trim: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [40, 'Username cannot exceed 40 characters'],
      index: true,
    },
    passwordHash: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    location: {
      type: String,
      default: '',
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    githubUsername: {
      type: String,
      default: '',
    },
    githubUrl: {
      type: String,
      default: '',
    },
    githubToken: {
      type: String,
      default: '',
    },
    productivityScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    activeStreak: {
      type: Number,
      default: 1,
      min: 0,
    },
    weeklyGoalHours: {
      type: Number,
      default: 40,
      min: 0,
    },
    currentGoalHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedTasksCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    openPRsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    mergedPRsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    focusStatus: {
      type: String,
      default: 'Available',
    },
    skills: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    contributions: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    integrations: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    invitedBy: {
      type: String,
      default: '',
      index: true,
    },
    teamMemberIds: {
      type: [String],
      default: [],
      index: true,
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
        return ret;
      },
    },
  }
);

// Prevent re-compilation in development watch mode
export const UserModel =
  mongoose.models.User || mongoose.model<UserDocument>('User', UserSchema);
