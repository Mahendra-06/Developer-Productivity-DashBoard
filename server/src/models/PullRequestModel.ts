import mongoose, { Schema, Document } from 'mongoose';

export interface IPullRequestDocument extends Document {
  id: string;
  prNumber: string;
  title: string;
  repo: string;
  branch: string;
  targetBranch: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    username: string;
    email?: string;
    role?: string;
  };
  reviewers: Array<{
    id: string;
    name: string;
    avatar: string;
    role?: string;
    username?: string;
    status: 'approved' | 'changes_requested' | 'pending';
  }>;
  status: 'open' | 'merged' | 'closed';
  checksStatus: 'passed' | 'running' | 'failed';
  additions: number;
  deletions: number;
  commentsCount: number;
  number?: number;
  projectId?: string;
  projectType?: 'team' | 'individual';
  isReviewed?: boolean;
  isMerged?: boolean;
  reviewedBy?: {
    id: string;
    name: string;
    avatar: string;
    role?: string;
  };
  mergedBy?: {
    id: string;
    name: string;
    avatar: string;
    role?: string;
  };
  waitingHours?: number;
  slaStatus?: 'healthy' | 'at_risk' | 'breached';
  queueType?: string;
  diffSnippet?: string;
  aiInsights?: any;
  ciStatus?: string;
  createdAt: string;
  updatedAt: string;
  turnaroundHours: number;
}

const PullRequestSchema = new Schema<IPullRequestDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    prNumber: { type: String, required: true },
    number: { type: Number },
    title: { type: String, required: true, trim: true },
    repo: { type: String, required: true },
    branch: { type: String, required: true },
    targetBranch: { type: String, default: 'main' },
    projectId: { type: String, index: true },
    projectType: { type: String, enum: ['team', 'individual'], default: 'team' },
    author: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      avatar: { type: String, required: true },
      username: { type: String, required: true },
      role: { type: String },
      email: { type: String },
    },
    reviewers: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        avatar: { type: String, required: true },
        username: { type: String },
        role: { type: String },
        status: { type: String, enum: ['approved', 'changes_requested', 'pending'], default: 'pending' },
      }
    ],
    status: { type: String, enum: ['open', 'merged', 'closed'], default: 'open' },
    checksStatus: { type: String, enum: ['passed', 'running', 'failed'], default: 'passed' },
    ciStatus: { type: String, enum: ['passing', 'running', 'failed'], default: 'passing' },
    isReviewed: { type: Boolean, default: false },
    isMerged: { type: Boolean, default: false },
    reviewedBy: {
      id: { type: String },
      name: { type: String },
      avatar: { type: String },
      role: { type: String },
    },
    mergedBy: {
      id: { type: String },
      name: { type: String },
      avatar: { type: String },
      role: { type: String },
    },
    waitingHours: { type: Number, default: 0.5 },
    slaStatus: { type: String, enum: ['healthy', 'at_risk', 'breached'], default: 'healthy' },
    queueType: { type: String, default: 'review_requested' },
    diffSnippet: { type: String },
    aiInsights: { type: Schema.Types.Mixed },
    additions: { type: Number, default: 0 },
    deletions: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    turnaroundHours: { type: Number, default: 1.2 },
  },
  {
    timestamps: true,
    strict: false,
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

export const PullRequestModel = mongoose.model<IPullRequestDocument>('PullRequest', PullRequestSchema);
