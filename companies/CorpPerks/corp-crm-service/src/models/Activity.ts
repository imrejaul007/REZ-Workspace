import mongoose, { Schema, Document, Model } from 'mongoose';
import { Activity } from '../types/index.js';

export interface ActivityDocument extends Omit<Activity, '_id'>, Document {}

const activitySchema = new Schema<ActivityDocument>(
  {
    activityId: {
      type: String,
      required: true,
      index: true,
    },
    tenantId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['call', 'email', 'meeting', 'note', 'task', 'stage_change', 'created', 'updated'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: { type: String },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    performedBy: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      enum: ['client', 'deal', 'proposal', 'invoice'],
      required: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for common queries
activitySchema.index({ tenantId: 1, entityType: 1, entityId: 1 });
activitySchema.index({ tenantId: 1, performedBy: 1, date: -1 });
activitySchema.index({ tenantId: 1, type: 1, date: -1 });

// TTL index to auto-delete activities older than 2 years (optional cleanup)
activitySchema.index({ date: 1 }, { expireAfterSeconds: 63072000 }); // 2 years

export const ActivityModel: Model<ActivityDocument> = mongoose.model<ActivityDocument>('Activity', activitySchema);
