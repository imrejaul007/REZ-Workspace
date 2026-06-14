import mongoose, { Document, Schema } from 'mongoose';

export interface IComparison extends Document {
  name: string;
  description?: string;
  cohortIds: string[];
  analysisType: 'retention' | 'revenue' | 'engagement';
  metrics: string[];
  parameters: {
    periods: number;
    aggregation?: 'sum' | 'avg' | 'count' | 'median';
  };
  results: {
    cohorts: Array<{
      cohortId: string;
      cohortName: string;
      data: Array<{
        period: number;
        value: number;
        percentage?: number;
      }>;
    }>;
    comparison: {
      averageDifference: number;
      statisticalSignificance?: number;
      winner?: string;
    };
  };
  visualization?: {
    type: 'line' | 'bar' | 'area' | 'comparison';
    config: Record<string, any>;
  };
  organizationId: string;
  createdBy: string;
  computedAt: Date;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
}

const ComparisonSchema = new Schema<IComparison>(
  {
    name: { type: String, required: true, index: true },
    description: { type: String },
    cohortIds: [{ type: String, required: true }],
    analysisType: {
      type: String,
      enum: ['retention', 'revenue', 'engagement'],
      required: true
    },
    metrics: [{ type: String, required: true }],
    parameters: {
      periods: { type: Number, required: true },
      aggregation: {
        type: String,
        enum: ['sum', 'avg', 'count', 'median']
      }
    },
    results: {
      cohorts: [
        {
          cohortId: { type: String, required: true },
          cohortName: { type: String, required: true },
          data: [
            {
              period: { type: Number, required: true },
              value: { type: Number, required: true },
              percentage: { type: Number }
            }
          ]
        }
      ],
      comparison: {
        averageDifference: { type: Number, required: true },
        statisticalSignificance: { type: Number },
        winner: { type: String }
      }
    },
    visualization: {
      type: {
        type: String,
        enum: ['line', 'bar', 'area', 'comparison']
      },
      config: { type: Schema.Types.Mixed }
    },
    organizationId: { type: String, required: true, index: true },
    createdBy: { type: String, required: true },
    computedAt: { type: Date, required: true },
    duration: { type: Number, required: true }
  },
  { timestamps: true }
);

ComparisonSchema.index({ organizationId: 1, analysisType: 1 });
ComparisonSchema.index({ organizationId: 1, computedAt: -1 });

export const Comparison = mongoose.model<IComparison>('Comparison', ComparisonSchema);