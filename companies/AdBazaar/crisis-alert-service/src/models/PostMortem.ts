/**
 * PostMortem Model - Mongoose schema for crisis post-mortem analysis
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface ITimelineEvent {
  event: string;
  timestamp: Date;
  action?: string;
}

export interface IImpact {
  estimatedReach?: number;
  sentimentShift?: number;
  recoveryTime?: number; // in minutes
}

export interface IResponse {
  actionsTaken: string[];
  effectiveness: string;
}

export interface IPostMortem extends Document {
  postMortemId: string;
  alertId: string;
  timeline: ITimelineEvent[];
  impact: IImpact;
  response: IResponse;
  learnings: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const timelineEventSchema = new Schema<ITimelineEvent>(
  {
    event: { type: String, required: true },
    timestamp: { type: Date, required: true },
    action: String,
  },
  { _id: false }
);

const impactSchema = new Schema<IImpact>(
  {
    estimatedReach: Number,
    sentimentShift: Number,
    recoveryTime: Number,
  },
  { _id: false }
);

const responseSchema = new Schema<IResponse>(
  {
    actionsTaken: [{ type: String, required: true }],
    effectiveness: { type: String, required: true },
  },
  { _id: false }
);

const postMortemSchema = new Schema<IPostMortem>(
  {
    postMortemId: { type: String, required: true, unique: true, index: true },
    alertId: { type: String, required: true, index: true },
    timeline: [{ type: timelineEventSchema, required: true }],
    impact: { type: impactSchema, required: true },
    response: { type: responseSchema, required: true },
    learnings: [{ type: String, required: true }],
    createdBy: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Indexes
postMortemSchema.index({ alertId: 1 });
postMortemSchema.index({ createdAt: -1 });

export const PostMortem = mongoose.model<IPostMortem>('PostMortem', postMortemSchema);
export default PostMortem;
