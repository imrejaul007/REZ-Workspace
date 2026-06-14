import mongoose, { Schema, Document } from 'mongoose';
import type { TargetingConfig } from '../types/index.js';

export interface ITargetingConfigDocument extends Omit<TargetingConfig, 'createdAt' | 'updatedAt'>, Document {
  createdAt: Date;
  updatedAt: Date;
}

const TargetingConfigSchema = new Schema<ITargetingConfigDocument>(
  {
    targetingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    apartmentId: {
      type: String,
      required: true,
      index: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    minAge: {
      type: Number,
      min: 0,
      max: 120,
    },
    maxAge: {
      type: Number,
      min: 0,
      max: 120,
    },
    interests: {
      type: [String],
      default: [],
    },
    incomeBrackets: {
      type: [String],
      default: [],
    },
    targetDevices: {
      type: Number,
      min: 1,
    },
    targetFamilies: {
      type: Number,
      min: 1,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index for apartment + targeting
TargetingConfigSchema.index({ apartmentId: 1, enabled: 1 });

export const TargetingConfigModel = mongoose.model<ITargetingConfigDocument>(
  'TargetingConfig',
  TargetingConfigSchema
);