import mongoose, { Schema } from 'mongoose';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ISync = any;

const SyncSchema = new Schema(
  {
    sourceId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['full', 'incremental', 'realtime'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
      default: 'pending'
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
    recordsProcessed: { type: Number, default: 0 },
    recordsFailed: { type: Number, default: 0 },
    error: { type: String },
    details: {
      tables: [{ type: String }],
      lastSyncTimestamp: { type: Date },
      batchSize: { type: Number }
    },
    organizationId: { type: String, required: true, index: true },
    triggeredBy: { type: String, required: true }
  },
  { timestamps: true }
);

SyncSchema.index({ organizationId: 1, status: 1 });
SyncSchema.index({ sourceId: 1, status: 1 });
SyncSchema.index({ createdAt: -1 });

export const Sync = mongoose.model('Sync', SyncSchema);