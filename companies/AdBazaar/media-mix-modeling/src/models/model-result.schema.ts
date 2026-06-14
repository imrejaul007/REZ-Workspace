import mongoose, { Document, Schema } from 'mongoose';

export interface IModelMetrics {
  rSquared: number;
  adjustedRSquared: number;
  rmse: number;
  mae: number;
  mape: number;
}

export interface IModelResult {
  modelId: mongoose.Types.ObjectId;
  trainedAt: Date;
  roas: Record<string, number>;
  contribution: Record<string, number>;
  saturation: Record<string, number>;
  adstock: Record<string, number>;
  marginalRoas: Record<string, number>;
  modelMetrics: IModelMetrics;
  featureImportance: Record<string, number>;
  crossValidation?: {
    folds: number;
    scores: number[];
    meanScore: number;
    stdDev: number;
  };
}

export interface IModelResultDocument extends IModelResult, Document {}

const ModelResultSchema = new Schema<IModelResultDocument>(
  {
    modelId: { type: Schema.Types.ObjectId, ref: 'MMMModel', required: true },
    trainedAt: { type: Date, required: true, default: Date.now },
    roas: { type: Map, of: Number, required: true },
    contribution: { type: Map, of: Number, required: true },
    saturation: { type: Map, of: Number, required: true },
    adstock: { type: Map, of: Number, required: true },
    marginalRoas: { type: Map, of: Number, required: true },
    modelMetrics: {
      rSquared: { type: Number, required: true },
      adjustedRSquared: { type: Number, required: true },
      rmse: { type: Number, required: true },
      mae: { type: Number, required: true },
      mape: { type: Number, required: true }
    },
    featureImportance: { type: Map, of: Number, required: true },
    crossValidation: {
      folds: Number,
      scores: [Number],
      meanScore: Number,
      stdDev: Number
    }
  },
  { timestamps: true }
);

ModelResultSchema.index({ modelId: 1 });
ModelResultSchema.index({ trainedAt: -1 });

export const ModelResult = mongoose.model<IModelResultDocument>('ModelResult', ModelResultSchema);