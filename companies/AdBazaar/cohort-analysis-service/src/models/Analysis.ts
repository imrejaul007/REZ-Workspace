import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalysis extends Document {
  cohortId: string;
  name: string;
  description?: string;
  type: 'retention' | 'revenue' | 'engagement' | 'survival' | 'churn';
  parameters: {
    periods: number;
    metric: string;
    aggregation?: 'sum' | 'avg' | 'count' | 'median';
    periodType?: 'day' | 'week' | 'month' | 'quarter';
  };
  results: {
    cohortData: Array<{
      period: number;
      periodLabel: string;
      size: number;
      values: Array<{
        metric: string;
        value: number;
        percentage?: number;
      }>;
    }>;
    summary: {
      averageRetention?: number;
      averageValue?: number;
      medianLifetime?: number;
    };
  };
  visualization?: {
    type: 'heatmap' | 'line' | 'bar' | 'area';
    config: Record<string, any>;
  };
  organizationId: string;
  computedBy: string;
  computedAt: Date;
  duration: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AnalysisSchema = new Schema<IAnalysis>(
  {
    cohortId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    type: {
      type: String,
      enum: ['retention', 'revenue', 'engagement', 'survival', 'churn'],
      required: true
    },
    parameters: {
      periods: { type: Number, required: true },
      metric: { type: String, required: true },
      aggregation: {
        type: String,
        enum: ['sum', 'avg', 'count', 'median']
      },
      periodType: {
        type: String,
        enum: ['day', 'week', 'month', 'quarter']
      }
    },
    results: {
      cohortData: [
        {
          period: { type: Number, required: true },
          periodLabel: { type: String, required: true },
          size: { type: Number, required: true },
          values: [
            {
              metric: { type: String, required: true },
              value: { type: Number, required: true },
              percentage: { type: Number }
            }
          ]
        }
      ],
      summary: {
        averageRetention: { type: Number },
        averageValue: { type: Number },
        medianLifetime: { type: Number }
      }
    },
    visualization: {
      type: {
        type: String,
        enum: ['heatmap', 'line', 'bar', 'area']
      },
      config: { type: Schema.Types.Mixed }
    },
    organizationId: { type: String, required: true, index: true },
    computedBy: { type: String, required: true },
    computedAt: { type: Date, required: true },
    duration: { type: Number, required: true },
    error: { type: String }
  },
  { timestamps: true }
);

AnalysisSchema.index({ cohortId: 1, type: 1 });
AnalysisSchema.index({ organizationId: 1, computedAt: -1 });

export const Analysis = mongoose.model<IAnalysis>('Analysis', AnalysisSchema);