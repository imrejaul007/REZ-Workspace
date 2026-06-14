import mongoose, { Document, Schema } from 'mongoose';

export interface IReport extends Document {
  name: string;
  description?: string;
  reportType: 'overview' | 'detailed' | 'summary' | 'custom';
  sources: string[];
  metrics: string[];
  filters: Record<string, any>;
  dateRange: {
    start: Date;
    end: Date;
  };
  schedule?: {
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    enabled: boolean;
    nextRun?: Date;
  };
  format: 'json' | 'csv' | 'pdf' | 'excel';
  organizationId: string;
  createdBy: string;
  status: 'draft' | 'generating' | 'completed' | 'failed';
  lastGenerated?: Date;
  data?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    name: { type: String, required: true, index: true },
    description: { type: String },
    reportType: {
      type: String,
      enum: ['overview', 'detailed', 'summary', 'custom'],
      default: 'overview'
    },
    sources: [{ type: String, index: true }],
    metrics: [{ type: String }],
    filters: { type: Schema.Types.Mixed, default: {} },
    dateRange: {
      start: { type: Date, required: true },
      end: { type: Date, required: true }
    },
    schedule: {
      frequency: {
        type: String,
        enum: ['hourly', 'daily', 'weekly', 'monthly']
      },
      enabled: { type: Boolean, default: false },
      nextRun: { type: Date }
    },
    format: {
      type: String,
      enum: ['json', 'csv', 'pdf', 'excel'],
      default: 'json'
    },
    organizationId: { type: String, required: true, index: true },
    createdBy: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'generating', 'completed', 'failed'],
      default: 'draft'
    },
    lastGenerated: { type: Date },
    data: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

ReportSchema.index({ organizationId: 1, createdAt: -1 });
ReportSchema.index({ status: 1, schedule: 1 });

export const Report = mongoose.model<IReport>('Report', ReportSchema);