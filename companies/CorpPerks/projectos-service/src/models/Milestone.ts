import mongoose, { Schema, Document, Model } from 'mongoose';
import type { Milestone as IMilestone } from '../types/index.js';

export interface MilestoneDocument extends Omit<IMilestone, '_id'>, Document {
  daysRemaining: number;
  isOverdue: boolean;
}

const MilestoneSchema = new Schema<MilestoneDocument>(
  {
    milestoneId: {
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
    description: {
      type: String,
      default: ''
    },
    dueDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'delayed'],
      default: 'pending'
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    deliverables: [{
      type: String
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
MilestoneSchema.index({ projectId: 1, dueDate: 1 });

// Virtual for days remaining
MilestoneSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const due = new Date(this.dueDate);
  const diff = due.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Virtual for is overdue
MilestoneSchema.virtual('isOverdue').get(function() {
  const daysRemaining = (this as MilestoneDocument).daysRemaining;
  return daysRemaining < 0 && this.status !== 'completed';
});

export const Milestone: Model<MilestoneDocument> = mongoose.model<MilestoneDocument>('Milestone', MilestoneSchema);
