import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  qbrId: string;
  customerId: string;
  version: string;
  format: 'pdf' | 'pptx' | 'html' | 'json';
  status: 'generating' | 'completed' | 'failed';
  sections: {
    sectionId: string;
    name: string;
    content: any;
    order: number;
  }[];
  fileUrl?: string;
  fileSize?: number;
  generatedAt?: Date;
  generatedBy?: string;
  downloadCount: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    qbrId: { type: String, required: true, index: true },
    customerId: { type: String, required: true, index: true },
    version: { type: String, required: true, default: '1.0.0' },
    format: {
      type: String,
      enum: ['pdf', 'pptx', 'html', 'json'],
      required: true,
      default: 'pdf',
    },
    status: {
      type: String,
      enum: ['generating', 'completed', 'failed'],
      required: true,
      default: 'generating',
    },
    sections: [{
      sectionId: { type: String, required: true },
      name: { type: String, required: true },
      content: { type: Schema.Types.Mixed },
      order: { type: Number, required: true },
    }],
    fileUrl: { type: String },
    fileSize: { type: Number },
    generatedAt: { type: Date },
    generatedBy: { type: String },
    downloadCount: { type: Number, default: 0 },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
    collection: 'qbr_reports',
  }
);

ReportSchema.index({ qbrId: 1, format: 1 });
ReportSchema.index({ customerId: 1, createdAt: -1 });
ReportSchema.index({ status: 1 });

export const ReportModel = mongoose.model<IReport>('QBRReport', ReportSchema);