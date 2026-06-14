import mongoose, { Document, Schema } from 'mongoose';

export type ReportFormat = 'json' | 'pdf' | 'csv' | 'html';

export interface ReportViolation {
  ruleId: string;
  ruleName: string;
  type: string;
  severity: string;
  description: string;
  matchedContent: string;
  fixSuggestion?: string;
}

export interface ReportSummary {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warningChecks: number;
  averageScore: number;
  topViolations: Array<{
    type: string;
    count: number;
  }>;
  platformBreakdown: Record<string, number>;
  severityBreakdown: Record<string, number>;
}

export interface IComplianceReport extends Document {
  checkIds: string[];
  summary: ReportSummary;
  violations: ReportViolation[];
  recommendations: string[];
  generatedBy: string;
  exportedAt: Date;
  format: ReportFormat;
  fileUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ReportViolationSchema = new Schema<ReportViolation>(
  {
    ruleId: { type: String, required: true },
    ruleName: { type: String, required: true },
    type: { type: String, required: true },
    severity: { type: String, required: true },
    description: { type: String, required: true },
    matchedContent: { type: String, required: true },
    fixSuggestion: { type: String },
  },
  { _id: false }
);

const ReportSummarySchema = new Schema<ReportSummary>(
  {
    totalChecks: { type: Number, required: true },
    passedChecks: { type: Number, required: true },
    failedChecks: { type: Number, required: true },
    warningChecks: { type: Number, required: true },
    averageScore: { type: Number, required: true },
    topViolations: [
      {
        type: { type: String },
        count: { type: Number },
      },
    ],
    platformBreakdown: { type: Schema.Types.Mixed },
    severityBreakdown: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const ComplianceReportSchema = new Schema<IComplianceReport>(
  {
    checkIds: {
      type: [String],
      required: true,
    },
    summary: {
      type: ReportSummarySchema,
      required: true,
    },
    violations: [ReportViolationSchema],
    recommendations: {
      type: [String],
      default: [],
    },
    generatedBy: {
      type: String,
      required: true,
    },
    exportedAt: {
      type: Date,
      default: Date.now,
    },
    format: {
      type: String,
      required: true,
      enum: ['json', 'pdf', 'csv', 'html'],
      default: 'json',
    },
    fileUrl: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ComplianceReportSchema.index({ generatedBy: 1, exportedAt: -1 });
ComplianceReportSchema.index({ format: 1 });
ComplianceReportSchema.index({ 'summary.averageScore': 1 });

export const ComplianceReport = mongoose.model<IComplianceReport>(
  'ComplianceReport',
  ComplianceReportSchema
);