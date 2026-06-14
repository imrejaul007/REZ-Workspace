import mongoose, { Document, Schema } from 'mongoose';

export interface ICreativePrediction extends Document {
  creativeId: string;
  modelVersion: string;
  predictions: {
    predictedCTR: number;
    predictedCVR: number;
    predictedImpressions: number;
    predictedClicks: number;
    predictedConversions: number;
    predictedSpend: number;
    predictedCPA: number;
    predictedROAS: number;
  };
  confidence: {
    ctrConfidence: number;
    cvrConfidence: number;
    overallConfidence: number;
  };
  factors: Array<{
    name: string;
    impact: number;
    description: string;
  }>;
  benchmarks: {
    industryCTR: number;
    industryCVR: number;
    similarAdCTR: number;
  };
  recommendations: string[];
  modelType: 'ml' | 'rule_based' | 'ensemble';
  features: Record<string, number>;
  trainingDataRange: {
    startDate: Date;
    endDate: Date;
  };
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CreativePredictionSchema = new Schema<ICreativePrediction>(
  {
    creativeId: { type: String, required: true, index: true },
    modelVersion: { type: String, required: true },
    predictions: {
      predictedCTR: { type: Number, required: true },
      predictedCVR: { type: Number, required: true },
      predictedImpressions: { type: Number, default: 0 },
      predictedClicks: { type: Number, default: 0 },
      predictedConversions: { type: Number, default: 0 },
      predictedSpend: { type: Number, default: 0 },
      predictedCPA: { type: Number, default: 0 },
      predictedROAS: { type: Number, default: 0 }
    },
    confidence: {
      ctrConfidence: { type: Number, min: 0, max: 1 },
      cvrConfidence: { type: Number, min: 0, max: 1 },
      overallConfidence: { type: Number, min: 0, max: 1 }
    },
    factors: [{
      name: { type: String, required: true },
      impact: { type: Number, required: true },
      description: { type: String }
    }],
    benchmarks: {
      industryCTR: { type: Number },
      industryCVR: { type: Number },
      similarAdCTR: { type: Number }
    },
    recommendations: [{ type: String }],
    modelType: {
      type: String,
      enum: ['ml', 'rule_based', 'ensemble'],
      default: 'ml'
    },
    features: { type: Schema.Types.Mixed },
    trainingDataRange: {
      startDate: { type: Date },
      endDate: { type: Date }
    },
    expiresAt: { type: Date }
  },
  {
    timestamps: true,
    collection: 'creative_predictions'
  }
);

// Indexes
CreativePredictionSchema.index({ creativeId: 1, modelVersion: 1 });
CreativePredictionSchema.index({ createdAt: -1 });
CreativePredictionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const CreativePrediction = mongoose.model<ICreativePrediction>('CreativePrediction', CreativePredictionSchema);