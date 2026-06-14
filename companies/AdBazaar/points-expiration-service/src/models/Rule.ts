import mongoose, { Document, Schema } from 'mongoose';

export interface IRule extends Document {
  ruleId: string;
  name: string;
  description: string;
  companyId?: string;
  tierId?: string;
  expirationMonths: number;
  gracePeriodDays: number;
  notificationDays: number[];
  autoForgive: boolean;
  maxForgiveAmount?: number;
  conditions: {
    minPoints?: number;
    maxPoints?: number;
    memberSinceBefore?: Date;
    excludeTiers?: string[];
  };
  isActive: boolean;
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

const RuleSchema = new Schema<IRule>(
  {
    ruleId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    companyId: { type: String, index: true },
    tierId: { type: String },
    expirationMonths: { type: Number, required: true },
    gracePeriodDays: { type: Number, default: 0 },
    notificationDays: [{ type: Number }],
    autoForgive: { type: Boolean, default: false },
    maxForgiveAmount: { type: Number },
    conditions: {
      minPoints: { type: Number },
      maxPoints: { type: Number },
      memberSinceBefore: { type: Date },
      excludeTiers: [{ type: String }]
    },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 }
  },
  { timestamps: true }
);

RuleSchema.index({ companyId: 1, isActive: 1 });
RuleSchema.index({ tierId: 1, isActive: 1 });
RuleSchema.index({ priority: 1 });

export const Rule = mongoose.model<IRule>('Rule', RuleSchema);