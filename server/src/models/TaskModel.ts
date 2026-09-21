import mongoose, { Schema, Document } from 'mongoose';
import { Task, TaskStatus, TaskPriority } from '../types/index.js';

export interface TaskDocument extends Omit<Task, 'id' | 'assignee'>, Document {
  id: string;
}

const TaskSchema = new Schema<TaskDocument>(
  {
    id: {
      type: String,
      required: [true, 'Task ID is required'],
      unique: true,
      index: true,
    },
    key: {
      type: String,
      required: [true, 'Task key is required'],
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [3, 'Task title must be at least 3 characters'],
      maxlength: [200, 'Task title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['backlog', 'in_progress', 'in_review', 'done'],
        message: '{VALUE} is not a valid task status',
      },
      default: 'backlog',
      index: true,
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'urgent'],
        message: '{VALUE} is not a valid task priority',
      },
      default: 'medium',
      index: true,
    },
    projectId: {
      type: String,
      required: [true, 'Project ID reference is required'],
      ref: 'Project',
      index: true,
    },
    projectName: {
      type: String,
      default: 'General',
    },
    assigneeId: {
      type: String,
      required: [true, 'Assignee ID reference is required'],
      ref: 'User',
      index: true,
    },
    assignerId: {
      type: String,
      ref: 'User',
      index: true,
    },
    createdById: {
      type: String,
      ref: 'User',
      index: true,
    },
    storyPoints: {
      type: Number,
      default: 3,
      min: [1, 'Story points must be at least 1'],
      max: [21, 'Story points cannot exceed 21'],
    },
    dueDate: {
      type: String,
      required: [true, 'Due date is required'],
    },
    tags: {
      type: [String],
      default: [],
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

export const TaskModel =
  mongoose.models.Task || mongoose.model<TaskDocument>('Task', TaskSchema);
