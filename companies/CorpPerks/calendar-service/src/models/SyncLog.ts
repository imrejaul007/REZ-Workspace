import mongoose, { Schema, Document, Model } from 'mongoose';
import { ISyncLog, ISyncConflict, CalendarProvider } from '../types';

export interface SyncLogDocument extends Omit<ISyncLog, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const SyncConflictSchema = new Schema(
  {
    eventId: { type: String, required: true },
    conflictType: {
      type: String,
      enum: ['title', 'time', 'attendee', 'deleted'],
      required: true,
    },
    localVersion: { type: Schema.Types.Mixed },
    remoteVersion: { type: Schema.Types.Mixed },
    resolution: {
      type: String,
      enum: ['local', 'remote', 'merged'],
    },
    resolvedAt: { type: Date },
  },
  { _id: false }
);

const SyncLogSchema = new Schema<SyncLogDocument>(
  {
    syncLogId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    connectionId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    companyId: {
      type: String,
      required: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      enum: ['google', 'outlook', 'apple', 'corpperks'],
    },
    status: {
      type: String,
      required: true,
      enum: ['started', 'completed', 'failed'],
      default: 'started',
    },
    syncType: {
      type: String,
      required: true,
      enum: ['full', 'incremental'],
    },
    eventsAdded: {
      type: Number,
      default: 0,
    },
    eventsUpdated: {
      type: Number,
      default: 0,
    },
    eventsDeleted: {
      type: Number,
      default: 0,
    },
    conflicts: {
      type: [SyncConflictSchema],
      default: [],
    },
    errorMessage: {
      type: String,
    },
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
    duration: {
      type: Number, // milliseconds
    },
  },
  {
    timestamps: true,
    collection: 'sync_logs',
  }
);

// Compound indexes
SyncLogSchema.index({ connectionId: 1, startedAt: -1 });
SyncLogSchema.index({ userId: 1, startedAt: -1 });
SyncLogSchema.index({ status: 1, startedAt: -1 });

// Static to get recent sync logs
SyncLogSchema.statics.findRecentByConnection = async function (
  connectionId: string,
  limit: number = 10
): Promise<SyncLogDocument[]> {
  return this.find({ connectionId })
    .sort({ startedAt: -1 })
    .limit(limit);
};

// Static to get failed syncs
SyncLogSchema.statics.findFailed = async function (
  since: Date
): Promise<SyncLogDocument[]> {
  return this.find({
    status: 'failed',
    startedAt: { $gte: since },
  }).sort({ startedAt: -1 });
};

export const SyncLog: Model<SyncLogDocument> = mongoose.model<SyncLogDocument>(
  'SyncLog',
  SyncLogSchema
);
