import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditActivityDocument extends Document {
  id: string;
  category: 'tasks' | 'prs' | 'deployments' | 'system' | 'compliance';
  actor: {
    name: string;
    avatar: string;
    role: string;
  };
  action: string;
  target: string;
  timestamp: string;
  relativeTime: string;
  metadata?: string;
  status?: 'success' | 'warning' | 'info';
}

const AuditActivitySchema = new Schema<IAuditActivityDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    category: { type: String, enum: ['tasks', 'prs', 'deployments', 'system', 'compliance'], required: true },
    actor: {
      name: { type: String, required: true },
      avatar: { type: String, required: true },
      role: { type: String, required: true },
    },
    action: { type: String, required: true },
    target: { type: String, required: true },
    timestamp: { type: String, required: true },
    relativeTime: { type: String, default: 'Just now' },
    metadata: { type: String },
    status: { type: String, enum: ['success', 'warning', 'info'], default: 'info' },
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

export const AuditActivityModel = mongoose.model<IAuditActivityDocument>('AuditActivity', AuditActivitySchema);
