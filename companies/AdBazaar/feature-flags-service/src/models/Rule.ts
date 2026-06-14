import mongoose, { Document, Schema } from 'mongoose';

export interface IRule extends Document {
  ruleId: string;
  flagId: string;
  name: string;
  type: 'user_id' | 'segment' | 'percentage' | 'attribute' | 'environment';
  conditions: {
    attribute?: string;
    operator?: string;
    value?: string | number | boolean;
  }[];
  value: boolean;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RuleSchema = new Schema<IRule>(
  {
    ruleId: { type: String, required: true, unique: true, index: true },
    flagId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['user_id', 'segment', 'percentage', 'attribute', 'environment'], required: true },
    conditions: [{
      attribute: { type: String },
      operator: { type: String },
      value: { type: Schema.Types.Mixed }
    }],
    value: { type: Boolean, required: true },
    priority: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

RuleSchema.index({ flagId: 1, priority: 1 });

export const Rule = mongoose.model<IRule>('Rule', RuleSchema);