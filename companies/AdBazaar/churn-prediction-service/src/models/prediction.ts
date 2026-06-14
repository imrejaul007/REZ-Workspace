import mongoose, { Schema, Document } from 'mongoose';

export interface IPrediction extends Document {
  customerId: string;
  modelVersion: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  inputFeatures: {
    name: string;
    value: number;
    normalized: number;
  }[];
  factors: {
    name: string;
    contribution: number;
    explanation: string;
  }[];
  predictions: {
    timeframe: '30d' | '60d' | '90d';
    probability: number;
    confidence: number;
  }[];
  actualOutcome?: 'churned' | 'retained';
  outcomeDate?: Date;
  modelAccuracy?: number;
  calculatedAt: Date;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const PredictionSchema = new Schema<IPrediction>(
  {
    customerId: {
      type: String,
      required: true,
      index: true,
    },
    modelVersion: {
      type: String,
      required: true,
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
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    inputFeatures: [{
      name: { type: String, required: true },
      value: { type: Number, required: true },
      normalized: { type: Number, required: true },
    }],
    factors: [{
      name: { type: String, required: true },
      contribution: { type: Number, required: true },
      explanation: { type: String },
    }],
    predictions: [{
      timeframe: { type: String, enum: ['30d', '60d', '90d'], required: true },
      probability: { type: Number, required: true },
      confidence: { type: Number, required: true },
    }],
    actualOutcome: { type: String, enum: ['churned', 'retained'] },
    outcomeDate: { type: Date },
    modelAccuracy: { type: Number },
    calculatedAt: { type: Date, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'churn_predictions',
  }
);

PredictionSchema.index({ customerId: 1, calculatedAt: -1 });
PredictionSchema.index({ riskLevel: 1, calculatedAt: -1 });
PredictionSchema.index({ actualOutcome: 1 });
PredictionSchema.index({ calculatedAt: -1 });

export const PredictionModel = mongoose.model<IPrediction>('ChurnPrediction', PredictionSchema);