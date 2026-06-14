import mongoose, { Document, Schema } from 'mongoose';

export interface IFeatureFlag extends Document {
  flagId: string;
  name: string;
  key: string;
  description: string;
  companyId: string;
  status: 'active' | 'inactive' | 'archived';
  enabledForAll: boolean;
  defaultValue: boolean;
  rolloutPercentage: number;
  targetSegments: string[];
  targetUsers: string[];
  excludeUsers: string[];
  metadata?: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeatureFlagSchema = new Schema<IFeatureFlag>(
  {
    flagId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: '' },
    companyId: { type: String, required: true, index: true },
    status: { type: String, enum: ['active', 'inactive', 'archived'], default: 'active' },
    enabledForAll: { type: Boolean, default: false },
    defaultValue: { type: Boolean, default: false },
    rolloutPercentage: { type: Number, default: 0, min: 0, max: 100 },
    targetSegments: [{ type: String }],
    targetUsers: [{ type: String }],
    excludeUsers: [{ type: String }],
    metadata: { type: Schema.Types.Mixed },
    createdBy: { type: String, required: true }
  },
  { timestamps: true }
);

FeatureFlagSchema.index({ companyId: 1, status: 1 });
FeatureFlagSchema.index({ key: 1, companyId: 1 });

export const FeatureFlag = mongoose.model<IFeatureFlag>('FeatureFlag', FeatureFlagSchema);