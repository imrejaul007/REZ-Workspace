import mongoose, { Schema, Document, Types } from 'mongoose';

// Report Filter Value
const reportFilterValueSchema = new Schema({
  filterId: { type: String, required: true },
  value: { type: Schema.Types.Mixed, required: true },
}, { _id: false });

// Report Instance Schema
export interface IReportInstance {
  tenantId: string;
  templateId: Types.ObjectId;
  params: { filterId: string; value: any }[];
  data: Record<string, any>;
  generatedAt: Date;
  generatedBy: string;
  expiresAt?: Date;
}

export interface IReportInstanceDocument extends IReportInstance, Document {
  _id: Types.ObjectId;
}

const reportInstanceSchema = new Schema<IReportInstanceDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    templateId: { type: Schema.Types.ObjectId, ref: 'ReportTemplate', required: true, index: true },
    params: { type: [reportFilterValueSchema], default: [] },
    data: { type: Schema.Types.Mixed, default: {} },
    generatedAt: { type: Date, required: true, default: Date.now },
    generatedBy: { type: String, required: true },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes
reportInstanceSchema.index({ tenantId: 1, templateId: 1 });
reportInstanceSchema.index({ tenantId: 1, generatedBy: 1 });
reportInstanceSchema.index({ generatedAt: -1 });

// TTL index to auto-delete expired reports (30 days)
reportInstanceSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const ReportInstance = mongoose.model<IReportInstanceDocument>('ReportInstance', reportInstanceSchema);
