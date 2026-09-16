import mongoose, { Schema, Document } from 'mongoose';
import { Project, ProjectStatus } from '../types/index.js';

export interface ProjectDocument extends Omit<Project, 'id' | 'lead' | 'team'>, Document {
  id: string;
}

const ProjectSchema = new Schema<ProjectDocument>(
  {
    id: {
      type: String,
      required: [true, 'Project ID is required'],
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [2, 'Project name must be at least 2 characters'],
      maxlength: [100, 'Project name cannot exceed 100 characters'],
    },
    key: {
      type: String,
      required: [true, 'Project key is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
      match: [/^[A-Z0-9_-]+$/, 'Project key must contain only uppercase alphanumeric characters, dashes, or underscores'],
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    leadId: {
      type: String,
      required: [true, 'Project lead ID is required'],
      ref: 'User',
      index: true,
    },
    teamIds: {
      type: [String],
      default: [],
      ref: 'User',
    },
    status: {
      type: String,
      enum: {
        values: ['on_track', 'at_risk', 'delayed'],
        message: '{VALUE} is not a valid project status',
      },
      default: 'on_track',
    },
    projectType: {
      type: String,
      enum: {
        values: ['team', 'individual'],
        message: '{VALUE} is not a valid project type',
      },
      default: 'team',
      index: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    totalTasks: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedTasks: {
      type: Number,
      default: 0,
      min: 0,
    },
    repoUrl: {
      type: String,
      default: '',
    },
    deadline: {
      type: String,
      required: [true, 'Project deadline is required'],
    },
    color: {
      type: String,
      default: '#6366f1',
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

export const ProjectModel =
  mongoose.models.Project || mongoose.model<ProjectDocument>('Project', ProjectSchema);
