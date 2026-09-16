import mongoose, { Schema, Document } from 'mongoose';

export type DeploymentEnvironment = 'production' | 'staging' | 'development' | 'preview' | 'canary';
export type DeploymentStatus = 'pending' | 'in_progress' | 'building' | 'success' | 'failed' | 'cancelled';

export interface IDeploymentDocument extends Document {
  id: string;
  environment: DeploymentEnvironment;
  serviceName: string;
  version: string;
  commitSha: string;
  commitMessage: string;
  branch: string;
  repositoryUrl?: string;
  projectId?: string;
  projectName?: string;
  pullRequestId?: string;
  developerId?: string;
  author: {
    id?: string;
    name: string;
    avatar: string;
    email?: string;
    username?: string;
  };
  status: DeploymentStatus;
  startedAt?: string;
  completedAt?: string;
  durationSeconds: number;
  deployedAt: string;
  summary?: string;
  logs?: string[];
  url?: string;
  sloPassRate: number;
  createdAt: Date;
  updatedAt: Date;
}

const DeploymentSchema = new Schema<IDeploymentDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    environment: { 
      type: String, 
      enum: ['production', 'staging', 'development', 'preview', 'canary'], 
      required: true,
      index: true 
    },
    serviceName: { type: String, required: true, index: true },
    version: { type: String, required: true },
    commitSha: { type: String, required: true },
    commitMessage: { type: String, required: true },
    branch: { type: String, default: 'main' },
    repositoryUrl: { type: String, default: '' },
    projectId: { type: String, index: true },
    projectName: { type: String },
    pullRequestId: { type: String, index: true },
    developerId: { type: String, index: true },
    author: {
      id: { type: String },
      name: { type: String, required: true },
      avatar: { type: String, required: true },
      email: { type: String },
      username: { type: String },
    },
    status: { 
      type: String, 
      enum: ['pending', 'in_progress', 'building', 'success', 'failed', 'cancelled'], 
      default: 'success',
      index: true 
    },
    startedAt: { type: String },
    completedAt: { type: String },
    durationSeconds: { type: Number, default: 60 },
    deployedAt: { type: String, default: 'Just now' },
    summary: { type: String, default: '' },
    logs: { type: [String], default: [] },
    url: { type: String, default: '' },
    sloPassRate: { type: Number, default: 99.9 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete (ret as any)._id;
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

DeploymentSchema.index({ environment: 1, status: 1 });
DeploymentSchema.index({ createdAt: -1 });

export const DeploymentModel = mongoose.model<IDeploymentDocument>('Deployment', DeploymentSchema);
