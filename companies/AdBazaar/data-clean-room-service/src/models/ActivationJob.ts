import mongoose, { Schema, Document } from 'mongoose';
import { ActivationTarget, ActivationStatus } from '../types';

export interface IActivationJob extends Document {
  activationId: string;
  matchId: string;
  brandId: string;
  target: ActivationTarget;
  targetConfig: {
    platform?: string;
    audienceName?: string;
    customEndpoint?: string;
  };
  options: {
    includeMetadata: boolean;
    createLookalikes: boolean;
    lookalikeSize: number;
  };
  status: ActivationStatus;
  recordsActivated: number;
  targetAudienceId?: string;
  targetResponse?: Record<string, unknown>;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const ActivationJobSchema = new Schema<IActivationJob>(
  {
    activationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    matchId: {
      type: String,
      required: true,
      index: true,
    },
    brandId: {
      type: String,
      required: true,
      index: true,
    },
    target: {
      type: String,
      enum: ['dsp', 'ssp', 'dmp', 'lookalike', 'custom'],
      required: true,
    },
    targetConfig: {
      platform: String,
      audienceName: String,
      customEndpoint: String,
    },
    options: {
      includeMetadata: { type: Boolean, default: false },
      createLookalikes: { type: Boolean, default: false },
      lookalikeSize: { type: Number, default: 10 },
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    recordsActivated: {
      type: Number,
      default: 0,
    },
    targetAudienceId: String,
    targetResponse: {
      type: Map,
      of: Schema.Types.Mixed,
    },
    errorMessage: String,
    completedAt: Date,
  },
  {
    timestamps: true,
    collection: 'activation_jobs',
  }
);

// Indexes
ActivationJobSchema.index({ matchId: 1, createdAt: -1 });
ActivationJobSchema.index({ brandId: 1, createdAt: -1 });
ActivationJobSchema.index({ status: 1 });
ActivationJobSchema.index({ target: 1, createdAt: -1 });

export const ActivationJob = mongoose.model<IActivationJob>('ActivationJob', ActivationJobSchema);