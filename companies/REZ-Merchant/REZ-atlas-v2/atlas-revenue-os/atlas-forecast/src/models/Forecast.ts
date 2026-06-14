/**
 * REZ Atlas v2 - Forecast Service MongoDB Models
 * AI Revenue Forecasting
 */

import mongoose, { Schema, Document } from 'mongoose';

// ================================================
// ForecastSnapshot Schema
// ================================================
export interface IForecastPeriod {
  period: string;
  label: string;
  predicted: number;
  target: number;
  committed: number;
  bestCase: number;
  probability: number;
}

export interface IForecastSnapshot extends Document {
  type: 'monthly' | 'quarterly';
  periods: IForecastPeriod[];
  totals: {
    predicted: number;
    target: number;
    committed: number;
    bestCase: number;
  };
  asOf: Date;
  createdAt: Date;
}

const ForecastPeriodSchema = new Schema<IForecastPeriod>({
  period: { type: String, required: true },
  label: { type: String, required: true },
  predicted: { type: Number, required: true },
  target: { type: Number, required: true },
  committed: { type: Number, required: true },
  bestCase: { type: Number, required: true },
  probability: { type: Number, required: true }
}, { _id: false });

const ForecastSnapshotSchema = new Schema<IForecastSnapshot>({
  type: { type: String, enum: ['monthly', 'quarterly'], required: true },
  periods: [ForecastPeriodSchema],
  totals: {
    predicted: { type: Number, default: 0 },
    target: { type: Number, default: 0 },
    committed: { type: Number, default: 0 },
    bestCase: { type: Number, default: 0 }
  },
  asOf: { type: Date, required: true }
}, { timestamps: { createdAt: 'createdAt', updatedAt: false } });

ForecastSnapshotSchema.index({ type: 1, asOf: -1 });

export const ForecastSnapshot = mongoose.model<IForecastSnapshot>('ForecastSnapshot', ForecastSnapshotSchema);

// ================================================
// ForecastTarget Schema
// ================================================
export interface IForecastTarget extends Document {
  period: string;
  type: 'monthly' | 'quarterly' | 'yearly';
  value: number;
  description: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ForecastTargetSchema = new Schema<IForecastTarget>({
  period: { type: String, required: true, index: true },
  type: { type: String, enum: ['monthly', 'quarterly', 'yearly'], required: true },
  value: { type: Number, required: true },
  description: { type: String, default: '' },
  active: { type: Boolean, default: true }
}, { timestamps: true });

ForecastTargetSchema.index({ type: 1, active: 1 });

export const ForecastTarget = mongoose.model<IForecastTarget>('ForecastTarget', ForecastTargetSchema);

// ================================================
// ForecastOpportunity Schema
// ================================================
export interface IForecastOpportunity extends Document {
  stage: string;
  value: number;
  probability: number;
  expectedCloseDate: Date;
  pipelineSnapshot: {
    committed: number;
    pipeline: number;
    bestCase: number;
  };
  createdAt: Date;
}

const ForecastOpportunitySchema = new Schema<IForecastOpportunity>({
  stage: { type: String, required: true, index: true },
  value: { type: Number, required: true },
  probability: { type: Number, default: 0 },
  expectedCloseDate: { type: Date, required: true },
  pipelineSnapshot: {
    committed: { type: Number, default: 0 },
    pipeline: { type: Number, default: 0 },
    bestCase: { type: Number, default: 0 }
  }
}, { timestamps: true });

ForecastOpportunitySchema.index({ expectedCloseDate: 1, stage: 1 });

export const ForecastOpportunity = mongoose.model<IForecastOpportunity>('ForecastOpportunity', ForecastOpportunitySchema);