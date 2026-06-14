import mongoose, { Schema, Document, Model } from 'mongoose';
import type {
  Project as IProject,
  ProjectStatus,
  ProjectPriority,
  AIRisk
} from '../types/index.js';

export interface ProjectDocument extends Omit<IProject, '_id'>, Document {
  daysRemaining: number;
  isOverdue: boolean;
}

const AIRiskSchema = new Schema<AIRisk>({
  type: {
    type: String,
    enum: ['blocked_tasks', 'inactive_contributor', 'dependency_issue', 'overtime_burnout', 'attendance_impact'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  description: { type: String, required: true },
  affectedTaskIds: [{ type: String }],
  suggestedAction: { type: String, required: true },
  detectedAt: { type: Date, default: Date.now }
}, { _id: false });

const ProjectSchema = new Schema<ProjectDocument>(
  {
    projectId: {
      type: String,
      required: true,
      unique: true,
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
    departmentId: {
      type: String,
      required: true,
      index: true
    },
    managerId: {
      type: String,
      required: true,
      index: true
    },
    teamMembers: [{
      type: String,
      index: true
    }],
    status: {
      type: String,
      enum: ['planning', 'active', 'paused', 'completed', 'cancelled'] as ProjectStatus[],
      default: 'planning',
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'] as ProjectPriority[],
      default: 'medium',
      index: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    budget: {
      type: Number,
      default: 0,
      min: 0
    },
    spentAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    clientId: {
      type: String,
      index: true
    },
    clientName: {
      type: String
    },
    health: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    aiRisks: [AIRiskSchema],
    tags: [{
      type: String,
      trim: true
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for common queries
ProjectSchema.index({ name: 'text', description: 'text' });
ProjectSchema.index({ startDate: 1, endDate: 1 });
ProjectSchema.index({ health: 1 });
ProjectSchema.index({ managerId: 1, status: 1 });

// Virtual for days remaining
ProjectSchema.virtual('daysRemaining').get(function(): number {
  const now = new Date();
  const end = new Date(this.endDate);
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Virtual for is overdue
ProjectSchema.virtual('isOverdue').get(function() {
  const daysRemaining = (this as ProjectDocument).daysRemaining;
  return daysRemaining < 0 && this.status !== 'completed';
});

export const Project: Model<ProjectDocument> = mongoose.model<ProjectDocument>('Project', ProjectSchema);
