import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

export const SignatureSchema = z.object({
  contractId: z.string(),
  signerId: z.string(),
  signerName: z.string(),
  signerEmail: z.string(),
  signerRole: z.enum(['brand', 'influencer', 'witness']),
  signatureData: z.string().optional(),
  signatureType: z.enum(['typed', 'drawn', 'uploaded', 'digital']).default('typed'),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  signedAt: z.date(),
  verificationStatus: z.enum(['pending', 'verified', 'failed']).default('pending'),
  verificationData: z.object({
    method: z.string().optional(),
    timestamp: z.date().optional(),
    location: z.string().optional()
  }).optional()
});

export type ISignature = z.infer<typeof SignatureSchema>;

const signatureSchema = new Schema({
  contractId: { type: Schema.Types.ObjectId, ref: 'Contract', required: true, index: true },
  signerId: { type: String, required: true },
  signerName: { type: String, required: true },
  signerEmail: { type: String, required: true },
  signerRole: {
    type: String,
    enum: ['brand', 'influencer', 'witness'],
    required: true
  },
  signatureData: { type: String },
  signatureType: {
    type: String,
    enum: ['typed', 'drawn', 'uploaded', 'digital'],
    default: 'typed'
  },
  ipAddress: { type: String },
  userAgent: { type: String },
  signedAt: { type: Date, default: Date.now },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'failed'],
    default: 'pending'
  },
  verificationData: {
    method: String,
    timestamp: Date,
    location: String
  }
}, {
  timestamps: true
});

signatureSchema.index({ contractId: 1, signerId: 1 }, { unique: true });
signatureSchema.index({ signerEmail: 1 });

export const Signature = mongoose.model<ISignature & Document>('Signature', signatureSchema);