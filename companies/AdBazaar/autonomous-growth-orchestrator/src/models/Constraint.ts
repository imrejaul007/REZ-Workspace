import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

export const ConstraintTypeSchema = z.enum([
  'budget',
  'bid',
  'audience',
  'placement',
  'frequency',
  'content',
  'geographic',
  'temporal',
  'custom'
]);

export interface IConstraint extends Document {
  campaignId: mongoose.Types.ObjectId;
  type: z.infer<typeof ConstraintTypeSchema>;
  key: string;
  value: any;
  hardLimit: boolean;
  description?: string;
  warningThreshold?: number;
  criticalThreshold?: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ConstraintSchema = new Schema<IConstraint>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: 'AutonomousCampaign', required: true, index: true },
    type: {
      type: String,
      enum: ConstraintTypeSchema.options,
      required: true
    },
    key: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
    hardLimit: { type: Boolean, default: false },
    description: { type: String },
    warningThreshold: { type: Number },
    criticalThreshold: { type: Number },
    active: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);

// Indexes
ConstraintSchema.index({ campaignId: 1, active: 1 });
ConstraintSchema.index({ campaignId: 1, type: 1 });

export const Constraint = mongoose.model<IConstraint>('Constraint', ConstraintSchema);

export default Constraint;