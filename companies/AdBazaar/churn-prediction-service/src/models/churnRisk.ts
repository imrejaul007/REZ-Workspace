import mongoose, { Schema, Document } from 'mongoose';

export interface IChurnRisk extends Document {
  customerId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  factors: {
    name: string;
    impact: number;
    weight: number;
    description: string;
    direction: 'negative' | 'positive';
  }[];
  warningSignals: string[];
  positiveSignals: string[];
  predictedChurnDate?: Date;
  churnProbability30d: number;
  churnProbability60d: number;
  churnProbability90d: number;
  lastCalculated: Date;
  nextScheduledCalculation: Date;
  recommendations: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ChurnRiskSchema = new Schema<IChurnRisk>(
  {
    customerId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    riskScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
      index: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    factors: [{
      name: { type: String, required: true },
      impact: { type: Number, required: true },
      weight: { type: Number, required: true },
      description: { type: String },
      direction: { type: String, enum: ['negative', 'positive'], required: true },
    }],
    warningSignals: [{ type: String }],
    positiveSignals: [{ type: String }],
    predictedChurnDate: { type: Date },
    churnProbability30d: { type: Number, min: 0, max: 1 },
    churnProbability60d: { type: Number, min: 0, max: 1 },
    churnProbability90d: { type: Number, min: 0, max: 1 },
    lastCalculated: { type: Date, required: true },
    nextScheduledCalculation: { type: Date, required: true },
    recommendations: [{ type: String }],
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    collection: 'churn_risks',
  }
);

ChurnRiskSchema.index({ customerId: 1 });
ChurnRiskSchema.index({ riskLevel: 1, riskScore: -1 });
ChurnRiskSchema.index({ riskScore: -1 });
ChurnRiskSchema.index({ churnProbability30d: -1 });

export const ChurnRiskModel = mongoose.model<IChurnRisk>('ChurnRisk', ChurnRiskSchema);