import mongoose, { Document, Schema } from 'mongoose';

export interface IConversionImport extends Document {
  fileId: string;
  fileName: string;
  fileType: 'csv' | 'xlsx' | 'json';
  fileSize: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed' | 'partial';
  totalRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
  campaignId?: string;
  importType: 'manual' | 'api' | 'automated';
  source?: string;
  importedBy?: string;
  startedAt?: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ConversionImportSchema = new Schema<IConversionImport>(
  {
    fileId: { type: String, required: true, unique: true, index: true },
    fileName: { type: String, required: true },
    fileType: {
      type: String,
      enum: ['csv', 'xlsx', 'json'],
      required: true
    },
    fileSize: { type: Number, required: true },
    status: {
      type: String,
      enum: ['uploading', 'processing', 'completed', 'failed', 'partial'],
      default: 'uploading'
    },
    totalRecords: { type: Number, default: 0 },
    processedRecords: { type: Number, default: 0 },
    successfulRecords: { type: Number, default: 0 },
    failedRecords: { type: Number, default: 0 },
    errors: [{
      row: Number,
      error: String,
      data: Schema.Types.Mixed
    }],
    campaignId: { type: String, index: true },
    importType: {
      type: String,
      enum: ['manual', 'api', 'automated'],
      default: 'manual'
    },
    source: { type: String },
    importedBy: { type: String },
    startedAt: { type: Date },
    completedAt: { type: Date },
    metadata: { type: Schema.Types.Mixed }
  },
  {
    timestamps: true
  }
);

ConversionImportSchema.index({ status: 1, createdAt: -1 });
ConversionImportSchema.index({ campaignId: 1, createdAt: -1 });

export const ConversionImport = mongoose.model<IConversionImport>(
  'ConversionImport',
  ConversionImportSchema
);