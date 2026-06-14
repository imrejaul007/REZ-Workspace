import mongoose, { Document, Schema } from 'mongoose';

export interface IEvaluation extends Document {
  evaluationId: string;
  flagId: string;
  flagKey: string;
  userId: string;
  companyId: string;
  result: boolean;
  reason: string;
  matchedRuleId?: string;
  rolloutPercentage: number;
  evaluatedAt: Date;
  createdAt: Date;
}

const EvaluationSchema = new Schema<IEvaluation>(
  {
    evaluationId: { type: String, required: true, unique: true, index: true },
    flagId: { type: String, required: true, index: true },
    flagKey: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    result: { type: Boolean, required: true },
    reason: { type: String, required: true },
    matchedRuleId: { type: String },
    rolloutPercentage: { type: Number, default: 0 },
    evaluatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

EvaluationSchema.index({ flagId: 1, userId: 1 });
EvaluationSchema.index({ userId: 1, evaluatedAt: -1 });
EvaluationSchema.index({ companyId: 1, evaluatedAt: -1 });

export const Evaluation = mongoose.model<IEvaluation>('Evaluation', EvaluationSchema);