import mongoose, { Schema, Document } from 'mongoose';

export interface ITrendPoint {
  date: Date;
  value: number;
  predicted?: boolean;
}

export interface ISeasonalityPattern {
  dayOfWeek: Record<string, number>;
  hourOfDay: Record<string, number>;
  monthOfYear: Record<string, number>;
}

export interface ITrendAnalysis extends Document {
  metricName: string;
  retailerId: string;
  retailerName: string;
  category: string;
  trend: 'upward' | 'downward' | 'stable' | 'volatile';
  trendStrength: number;
  seasonality: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  seasonalityPattern: ISeasonalityPattern;
  forecast: {
    next7Days: ITrendPoint[];
    next30Days: ITrendPoint[];
    confidence: number;
  };
  dataPoints: ITrendPoint[];
  analysisWindow: {
    start: Date;
    end: Date;
  };
  correlationMetrics: string[];
  anomalies: { date: Date; value: number; reason: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const TrendPointSchema = new Schema<ITrendPoint>({
  date: { type: Date, required: true },
  value: { type: Number, required: true },
  predicted: { type: Boolean, default: false },
});

const SeasonalityPatternSchema = new Schema<ISeasonalityPattern>({
  dayOfWeek: { type: Schema.Types.Mixed, default: {} },
  hourOfDay: { type: Schema.Types.Mixed, default: {} },
  monthOfYear: { type: Schema.Types.Mixed, default: {} },
});

const AnomalySchema = new Schema<{ date: Date; value: number; reason: string }>({
  date: { type: Date, required: true },
  value: { type: Number, required: true },
  reason: { type: String, required: true },
});

const TrendAnalysisSchema = new Schema<ITrendAnalysis>(
  {
    metricName: { type: String, required: true, index: true },
    retailerId: { type: String, required: true, index: true },
    retailerName: { type: String, required: true },
    category: { type: String, required: true },
    trend: {
      type: String,
      enum: ['upward', 'downward', 'stable', 'volatile'],
      required: true,
    },
    trendStrength: { type: Number, required: true, min: 0, max: 100 },
    seasonality: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
      required: true,
    },
    seasonalityPattern: { type: SeasonalityPatternSchema, default: {} },
    forecast: {
      next7Days: [TrendPointSchema],
      next30Days: [TrendPointSchema],
      confidence: { type: Number, required: true },
    },
    dataPoints: [TrendPointSchema],
    analysisWindow: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    correlationMetrics: [{ type: String }],
    anomalies: [AnomalySchema],
  },
  {
    timestamps: true,
  }
);

TrendAnalysisSchema.index({ metricName: 1, retailerId: 1, updatedAt: -1 });
TrendAnalysisSchema.index({ retailerId: 1, category: 1 });

export const TrendAnalysis = mongoose.model<ITrendAnalysis>(
  'TrendAnalysis',
  TrendAnalysisSchema
);