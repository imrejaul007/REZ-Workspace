/**
 * Document Model
 *
 * Stores documents for suppliers, POs, and other entities.
 */

import mongoose, { Schema, Document as MongoDocument, Types } from 'mongoose';

export type DocumentType =
  | 'invoice'
  | 'challan'
  | 'receipt'
  | 'gst_certificate'
  | 'pan_card'
  | 'address_proof'
  | 'bank_statement'
  | 'agreement'
  | 'kyc'
  | 'other';

export type DocumentCategory = 'supplier' | 'purchase_order' | 'payment' | 'inventory' | 'compliance';

export interface IDocument extends MongoDocument {
  merchantId: Types.ObjectId;
  entityType: DocumentCategory;
  entityId: Types.ObjectId;
  type: DocumentType;
  name: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: Types.ObjectId;
  tags?: string[];
  metadata?: Record<string, unknown>;
  isPublic: boolean;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocument>(
  {
    merchantId: { type: Schema.Types.ObjectId, required: true, index: true },
    entityType: {
      type: String,
      required: true,
      enum: ['supplier', 'purchase_order', 'payment', 'inventory', 'compliance'],
    },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: [
        'invoice',
        'challan',
        'receipt',
        'gst_certificate',
        'pan_card',
        'address_proof',
        'bank_statement',
        'agreement',
        'kyc',
        'other',
      ],
    },
    name: { type: String, required: true, maxlength: 255 },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId },
    tags: { type: [String], default: [] },
    metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
    isPublic: { type: Boolean, default: false },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes
documentSchema.index({ merchantId: 1, entityType: 1, entityId: 1 });
documentSchema.index({ merchantId: 1, type: 1, createdAt: -1 });
documentSchema.index({ fileName: 1 });

export const Document =
  mongoose.models.Document || mongoose.model<IDocument>('Document', documentSchema);
