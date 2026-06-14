import mongoose, { Schema, Document } from 'mongoose';
import {
  UploadStatus,
  DataFormat,
  HashAlgorithm,
  IdentifierType,
} from '../types';

export interface IDataUpload extends Document {
  uploadId: string;
  brandId: string;
  campaignId?: string;
  dataFormat: DataFormat;
  hashAlgorithm: HashAlgorithm;
  identifiers: Array<{
    type: IdentifierType;
    column?: string;
  }>;
  recordCount: number;
  processedCount: number;
  hashedCount: number;
  status: UploadStatus;
  segments: string[];
  metadata: {
    name: string;
    description?: string;
    uploadedAt: Date;
    fileSize?: number;
  };
  records: Array<{
    identifier: string;
    identifierType: IdentifierType;
    hashedValue?: string;
    segment?: string;
    metadata?: Record<string, unknown>;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const DataUploadSchema = new Schema<IDataUpload>(
  {
    uploadId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    brandId: {
      type: String,
      required: true,
      index: true,
    },
    campaignId: {
      type: String,
      index: true,
    },
    dataFormat: {
      type: String,
      enum: ['csv', 'json', 'tsv', 'xml'],
      required: true,
    },
    hashAlgorithm: {
      type: String,
      enum: ['SHA256', 'MD5', 'SHA1'],
      default: 'SHA256',
    },
    identifiers: [{
      type: {
        type: String,
        enum: ['email', 'phone', 'device_id', 'cookie', 'custom'],
        required: true,
      },
      column: String,
    }],
    recordCount: {
      type: Number,
      default: 0,
    },
    processedCount: {
      type: Number,
      default: 0,
    },
    hashedCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    segments: [{
      type: String,
      index: true,
    }],
    metadata: {
      name: { type: String, required: true },
      description: String,
      uploadedAt: { type: Date, default: Date.now },
      fileSize: Number,
    },
    records: [{
      identifier: String,
      identifierType: {
        type: String,
        enum: ['email', 'phone', 'device_id', 'cookie', 'custom'],
      },
      hashedValue: String,
      segment: String,
      metadata: Schema.Types.Mixed,
    }],
  },
  {
    timestamps: true,
    collection: 'data_uploads',
  }
);

// Indexes for efficient queries
DataUploadSchema.index({ brandId: 1, createdAt: -1 });
DataUploadSchema.index({ status: 1, createdAt: -1 });
DataUploadSchema.index({ 'segments': 1 });

export const DataUpload = mongoose.model<IDataUpload>('DataUpload', DataUploadSchema);