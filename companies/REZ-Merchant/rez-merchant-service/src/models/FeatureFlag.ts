import mongoose, { Schema, Document } from 'mongoose';

export interface IFeatureFlag extends Document {
  key: string;
  enabled: boolean;
  description: string;
  rolloutPercentage: number;
  environments: ('development' | 'staging' | 'production')[];
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IFeatureFlag>(
  {
    key: { type: String, required: true, unique: true },
    enabled: { type: Boolean, default: false },
    description: { type: String, required: true },
    rolloutPercentage: { type: Number, default: 100, min: 0, max: 100 },
    environments: [{ type: String, enum: ['development', 'staging', 'production'] }],
  },
  { timestamps: true },
);

schema.index({ key: 1, enabled: 1 });
schema.index({ enabled: 1 });

export default mongoose.model<IFeatureFlag>('FeatureFlag', schema);
