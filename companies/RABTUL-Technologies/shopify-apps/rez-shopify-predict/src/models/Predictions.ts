/**
 * ReZ Predict - Prediction Models
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomerPrediction extends Document {
  customerId: string;
  shop: string;
  tenantId: string;
  brandId: string;
  predictions: {
    ltv: number;
    churnRisk: 'low' | 'medium' | 'high';
    churnScore: number;
    revisitProbability: number;
    nextPurchaseDate?: Date;
    predictedLifetimeOrders: number;
    predictedLifetimeValue: number;
  };
  features: Record<string, number>;
  modelVersion: string;
  predictedAt: Date;
}

const CustomerPredictionSchema = new Schema({
  customerId: { type: String, required: true, index: true },
  shop: { type: String, required: true, lowercase: true, index: true },
  tenantId: { type: String, required: true, index: true },
  brandId: { type: String, required: true, index: true },
  predictions: {
    ltv: Number,
    churnRisk: { type: String, enum: ['low', 'medium', 'high'] },
    churnScore: Number,
    revisitProbability: Number,
    nextPurchaseDate: Date,
    predictedLifetimeOrders: Number,
    predictedLifetimeValue: Number,
  },
  features: { type: Map, of: Number },
  modelVersion: String,
  predictedAt: Date,
}, {
  timestamps: true,
  collection: 'customer_predictions',
});

CustomerPredictionSchema.index({ shop: 1, churnRisk: 1 });
CustomerPredictionSchema.index({ tenantId: 1, churnRisk: 1 });
CustomerPredictionSchema.index({ predictedAt: 1 });

export const CustomerPrediction = mongoose.model<ICustomerPrediction>('CustomerPrediction', CustomerPredictionSchema);

export interface ICohortAnalysis extends Document {
  shop: string;
  tenantId: string;
  brandId: string;
  cohortMonth: string;
  customers: number;
  retention: Record<string, number>;
  revenueRetention: Record<string, number>;
  churnRate: number;
  analyzedAt: Date;
}

const CohortAnalysisSchema = new Schema({
  shop: { type: String, required: true, index: true },
  tenantId: { type: String, required: true, index: true },
  brandId: { type: String, required: true, index: true },
  cohortMonth: { type: String, required: true },
  customers: Number,
  retention: { type: Map, of: Number },
  revenueRetention: { type: Map, of: Number },
  churnRate: Number,
  analyzedAt: Date,
}, {
  timestamps: true,
  collection: 'cohort_analyses',
});

CohortAnalysisSchema.index({ shop: 1, cohortMonth: 1 }, { unique: true });

export const CohortAnalysis = mongoose.model<ICohortAnalysis>('CohortAnalysis', CohortAnalysisSchema);
