import mongoose, { Document, Schema } from 'mongoose';

export interface ICohort extends Document {
  name: string;
  description?: string;
  cohortType: 'retention' | 'revenue' | 'engagement' | 'conversion' | 'behavioral';
  definition: {
    groupBy: {
      field: string;
      granularity: 'day' | 'week' | 'month' | 'quarter' | 'year';
    };
    dateRange: {
      start: Date;
      end: Date;
    };
    filters?: Array<{
      field: string;
      operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
      value: any;
    }>;
    event?: {
      type: 'acquisition' | 'activation' | 'engagement' | 'revenue' | 'retention';
      name: string;
    };
  };
  segments: Array<{
    id: string;
    name: string;
    criteria: any;
  }>;
  metrics: string[];
  visualization: {
    type: 'heatmap' | 'line' | 'bar' | 'table';
    colorScheme?: string[];
  };
  organizationId: string;
  createdBy: string;
  status: 'draft' | 'calculating' | 'ready' | 'error';
  lastAnalyzed?: Date;
  results?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const CohortSchema = new Schema<ICohort>(
  {
    name: { type: String, required: true, index: true },
    description: { type: String },
    cohortType: {
      type: String,
      enum: ['retention', 'revenue', 'engagement', 'conversion', 'behavioral'],
      required: true
    },
    definition: {
      groupBy: {
        field: { type: String, required: true },
        granularity: {
          type: String,
          enum: ['day', 'week', 'month', 'quarter', 'year'],
          required: true
        }
      },
      dateRange: {
        start: { type: Date, required: true },
        end: { type: Date, required: true }
      },
      filters: [
        {
          field: { type: String, required: true },
          operator: {
            type: String,
            enum: ['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'in', 'contains'],
            required: true
          },
          value: { type: Schema.Types.Mixed, required: true }
        }
      ],
      event: {
        type: {
          type: String,
          enum: ['acquisition', 'activation', 'engagement', 'revenue', 'retention']
        },
        name: { type: String }
      }
    },
    segments: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        criteria: { type: Schema.Types.Mixed }
      }
    ],
    metrics: [{ type: String }],
    visualization: {
      type: {
        type: String,
        enum: ['heatmap', 'line', 'bar', 'table'],
        default: 'heatmap'
      },
      colorScheme: [{ type: String }]
    },
    organizationId: { type: String, required: true, index: true },
    createdBy: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'calculating', 'ready', 'error'],
      default: 'draft'
    },
    lastAnalyzed: { type: Date },
    results: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

CohortSchema.index({ organizationId: 1, cohortType: 1 });
CohortSchema.index({ organizationId: 1, status: 1 });

export const Cohort = mongoose.model<ICohort>('Cohort', CohortSchema);