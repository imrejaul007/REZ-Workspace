import mongoose, { Schema, Document, Model } from 'mongoose';
import type { TimeEntry as ITimeEntry, TimeEntryType } from '../types/index.js';

export interface TimeEntryDocument extends Omit<ITimeEntry, '_id'>, Document {}

const TimeEntrySchema = new Schema<TimeEntryDocument>(
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
    projectId: {
      type: String,
      required: true,
      index: true
    },
    projectName: {
      type: String,
      required: true
    },
    taskId: {
      type: String,
      index: true
    },
    taskTitle: {
      type: String
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    hours: {
      type: Number,
      required: true,
      min: 0,
      max: 24
    },
    description: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      enum: ['project', 'client', 'meeting', 'admin', 'overtime'] as TimeEntryType[],
      default: 'project',
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound indexes for common queries
TimeEntrySchema.index({ employeeId: 1, date: 1 });
TimeEntrySchema.index({ projectId: 1, date: 1 });
TimeEntrySchema.index({ employeeId: 1, projectId: 1, date: 1 });
TimeEntrySchema.index({ taskId: 1, date: 1 });

// Virtual for week number
TimeEntrySchema.virtual('weekNumber').get(function() {
  const date = new Date(this.date);
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
});

// Virtual for month/year key
TimeEntrySchema.virtual('monthYear').get(function() {
  const date = new Date(this.date);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
});

export const TimeEntry: Model<TimeEntryDocument> = mongoose.model<TimeEntryDocument>('TimeEntry', TimeEntrySchema);
