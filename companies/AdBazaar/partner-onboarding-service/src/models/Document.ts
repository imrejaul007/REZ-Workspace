import mongoose, { Schema, Document } from 'mongoose';

export type DocumentType = 'gst_certificate' | 'pan_card' | 'address_proof' | 'bank_statement' | 'agreement' | 'logo' | 'other';
export type DocumentStatus = 'pending' | 'uploaded' | 'verified' | 'rejected';

export interface IDocument extends Document {
  documentId: string;
  partnerId: string;
  type: DocumentType;
  status: DocumentStatus;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
  rejectionReason?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    documentId: { type: String, required: true, unique: true, index: true },
    partnerId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['gst_certificate', 'pan_card', 'address_proof', 'bank_statement', 'agreement', 'logo', 'other'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'uploaded', 'verified', 'rejected'],
      default: 'pending',
      index: true,
    },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date },
    verifiedBy: { type: String },
    rejectionReason: { type: String },
    metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Indexes
DocumentSchema.index({ partnerId: 1, type: 1 });
DocumentSchema.index({ partnerId: 1, status: 1 });

export const DocumentModel = mongoose.model<IDocument>('PartnerDocument', DocumentSchema);