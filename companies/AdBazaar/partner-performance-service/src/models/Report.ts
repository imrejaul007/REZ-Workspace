import mongoose, { Schema, Document } from 'mongoose';

export type ReportType = 'performance' | 'revenue' | 'campaign' | 'roi' | 'custom';
export type ReportFormat = 'json' | 'pdf' | 'csv' | 'excel';
export type ReportStatus = 'generating' | 'ready' | 'failed' | 'delivered';

export interface IReport extends Document {
  reportId: string;
  partnerId: string;
  type: ReportType;
  name: string;
  format: ReportFormat;
  status: ReportStatus;
  period: {
    start: Date;
    end: Date;
  };
  filters: {
    campaignIds?: string[];
    categories?: string[];
    regions?: string[];
  };
  metrics: string[];
  data: Record<string, unknown>;
  fileUrl?: string;
  generatedAt?: Date;
  deliveredAt?: Date;
  scheduled?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    reportId: { type: String, required: true, unique: true, index: true },
    partnerId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['performance', 'revenue', 'campaign', 'roi', 'custom'],
      required: true,
    },
    name: { type: String, required: true },
    format: {
      type: String,
      enum: ['json', 'pdf', 'csv', 'excel'],
      default: 'json',
    },
    status: {
      type: String,
      enum: ['generating', 'ready', 'failed', 'delivered'],
      default: 'generating',
      index: true,
    },
    period: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
    filters: {
      campaignIds: [{ type: String }],
      categories: [{ type: String }],
      regions: [{ type: String }],
    },
    metrics: [{ type: String }],
    data: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
    fileUrl: { type: String },
    generatedAt: { type: Date },
    deliveredAt: { type: Date },
    scheduled: {
      enabled: { type: Boolean, default: false },
      frequency: { type: String, enum: ['daily', 'weekly', 'monthly'] },
      recipients: [{ type: String }],
    },
  },
  { timestamps: true }
);

ReportSchema.index({ partnerId: 1, status: 1 });
ReportSchema.index({ partnerId: 1, type: 1 });

export const Report = mongoose.model<IReport>('Report', ReportSchema);