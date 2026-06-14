import mongoose, { Schema, Document, Model } from 'mongoose';
import type {
  Task as ITask,
  TaskStatus,
  TaskPriority,
  SubTask,
  Attachment,
  Comment
} from '../types/index.js';

export interface TaskDocument extends Omit<ITask, '_id'>, Document {}

const SubTaskSchema = new Schema<SubTask>({
  _id: { type: String, required: true },
  title: { type: String, required: true },
  completed: { type: Boolean, default: false }
}, { _id: false });

const AttachmentSchema = new Schema<Attachment>({
  _id: { type: String, required: true },
  name: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedBy: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const CommentSchema = new Schema<Comment>({
  _id: { type: String, required: true },
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { _id: false });

const TaskSchema = new Schema<TaskDocument>(
  {
    taskId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    projectId: {
      type: String,
      required: true,
      index: true
    },
    milestoneId: {
      type: String,
      index: true
    },
    sprintId: {
      type: String,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    assigneeId: {
      type: String,
      required: true,
      index: true
    },
    assigneeName: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'review', 'done', 'blocked'] as TaskStatus[],
      default: 'todo',
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'] as TaskPriority[],
      default: 'medium',
      index: true
    },
    estimatedHours: {
      type: Number,
      default: 0,
      min: 0
    },
    actualHours: {
      type: Number,
      default: 0,
      min: 0
    },
    dueDate: {
      type: Date,
      required: true,
      index: true
    },
    dependencies: [{
      type: String,
      index: true
    }],
    subtasks: [SubTaskSchema],
    attachments: [AttachmentSchema],
    comments: [CommentSchema],
    completionProof: {
      type: String
    },
    storyPoints: {
      type: Number,
      min: 0
    },
    tags: [{
      type: String,
      trim: true
    }],
    completionDate: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for common queries
TaskSchema.index({ title: 'text', description: 'text' });
TaskSchema.index({ assigneeId: 1, status: 1 });
TaskSchema.index({ projectId: 1, status: 1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ projectId: 1, assigneeId: 1, status: 1 });

// Virtual for is overdue
TaskSchema.virtual('isOverdue').get(function() {
  return this.dueDate < new Date() && this.status !== 'done';
});

// Virtual for progress percentage
TaskSchema.virtual('progressPercentage').get(function() {
  if (this.status === 'done') return 100;
  if (this.subtasks.length === 0) return 0;
  const completed = this.subtasks.filter((st: SubTask) => st.completed).length;
  return Math.round((completed / this.subtasks.length) * 100);
});

export const Task: Model<TaskDocument> = mongoose.model<TaskDocument>('Task', TaskSchema);
