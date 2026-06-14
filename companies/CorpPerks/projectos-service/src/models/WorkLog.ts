import mongoose, { Schema, Document, Model } from 'mongoose';
import type { WorkLog as IWorkLog } from '../types/index.js';

export interface WorkLogDocument extends Omit<IWorkLog, '_id'>, Document {}

const TaskWorkedOnSchema = new Schema({
  taskId: { type: String, required: true },
  taskTitle: { type: String, required: true },
  status: { type: String, required: true }
}, { _id: false });

const WorkLogSchema = new Schema<WorkLogDocument>(
  {
    employeeId: {
      type: String,
      required: true,
      index: true
    },
    employeeName: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    completed: {
      type: String,
      required: true
    },
    blockers: {
      type: String,
      default: ''
    },
    tomorrowPlan: {
      type: String,
      default: ''
    },
    tasksWorkedOn: [TaskWorkedOnSchema],
    submittedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound indexes for common queries
WorkLogSchema.index({ employeeId: 1, date: 1 });
WorkLogSchema.index({ employeeId: 1, submittedAt: -1 });

// Ensure one log per employee per day
WorkLogSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export const WorkLog: Model<WorkLogDocument> = mongoose.model<WorkLogDocument>('WorkLog', WorkLogSchema);
