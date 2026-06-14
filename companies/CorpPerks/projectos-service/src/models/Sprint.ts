import mongoose, { Schema, Document, Model } from 'mongoose';
import type { Sprint as ISprint } from '../types/index.js';

export interface SprintDocument extends Omit<ISprint, '_id'>, Document {}

const SprintSchema = new Schema<SprintDocument>(
  {
    sprintId: {
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
    name: {
      type: String,
      required: true,
      trim: true
    },
    goal: {
      type: String,
      default: ''
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['planning', 'active', 'completed'],
      default: 'planning',
      index: true
    },
    plannedPoints: {
      type: Number,
      default: 0,
      min: 0
    },
    completedPoints: {
      type: Number,
      default: 0,
      min: 0
    },
    velocity: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
SprintSchema.index({ projectId: 1, status: 1 });
SprintSchema.index({ startDate: 1, endDate: 1 });

// Virtual for days remaining
SprintSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const end = new Date(this.endDate);
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Virtual for total days
SprintSchema.virtual('totalDays').get(function() {
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
});

// Virtual for completion percentage
SprintSchema.virtual('completionPercentage').get(function() {
  if (this.plannedPoints === 0) return 0;
  return Math.round((this.completedPoints / this.plannedPoints) * 100);
});

export const Sprint: Model<SprintDocument> = mongoose.model<SprintDocument>('Sprint', SprintSchema);
