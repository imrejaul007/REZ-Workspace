import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

export const DocumentSchema = z.object({
  contractId: z.string(),
  name: z.string(),
  type: z.enum(['contract', 'nda', 'amendment', 'addendum', 'attachment', 'other']),
  mimeType: z.string(),
  size: z.number(),
  url: z.string(),
  uploadedBy: z.string(),
  uploadedAt: z.date(),
  checksum: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

export type IDocument = z.infer<typeof DocumentSchema>;

const documentSchema = new Schema({
  contractId: { type: Schema.Types.ObjectId, ref: 'Contract', required: true, index: true },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['contract', 'nda', 'amendment', 'addendum', 'attachment', 'other'],
    required: true
  },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  url: { type: String, required: true },
  uploadedBy: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  checksum: { type: String },
  metadata: { type: Schema.Types.Mixed }
}, {
  timestamps: true
});

documentSchema.index({ contractId: 1, type: 1 });

export const ContractDocument = mongoose.model<IDocument & Document>('ContractDocument', documentSchema);