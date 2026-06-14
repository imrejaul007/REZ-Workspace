import mongoose, { Document, Schema } from 'mongoose';

export interface ISync extends Document {
  syncId: string;
  source: string;
  destination: string;
  companyId: string;
  type: 'full' | 'incremental' | 'realtime';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  itemsProcessed: number;
  itemsFailed: number;
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const SyncSchema = new Schema<ISync>(
  {
    syncId: { type: String, required: true, unique: true, index: true },
    source: { type: String, required: true },
    destination: { type: String, required: true },
    companyId: { type: String, required: true, index: true },
    type: { type: String, enum: ['full', 'incremental', 'realtime'], required: true },
    status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending' },
    itemsProcessed: { type: Number, default: 0 },
    itemsFailed: { type: Number, default: 0 },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    errorMessage: { type: String },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

SyncSchema.index({ companyId: 1, status: 1 });
SyncSchema.index({ startedAt: -1 });

export const Sync = mongoose.model<ISync>('Sync', SyncSchema);