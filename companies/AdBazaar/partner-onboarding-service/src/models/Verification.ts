import mongoose, { Schema, Document } from 'mongoose';

export type VerificationType = 'email' | 'phone' | 'gstin' | 'pan' | 'bank' | 'address' | 'document' | 'kyc';
export type VerificationStatus = 'pending' | 'in_progress' | 'verified' | 'failed' | 'expired';

export interface IVerification extends Document {
  verificationId: string;
  partnerId: string;
  type: VerificationType;
  status: VerificationStatus;
  data: {
    value: string;
    verifiedValue?: string;
    referenceNumber?: string;
  };
  verificationMethod: 'automated' | 'manual' | 'third_party' | 'otp';
  attempts: {
    count: number;
    lastAttempt: Date;
    maxAttempts: number;
  };
  result: {
    success: boolean;
    message?: string;
    details?: Record<string, unknown>;
    verifiedAt?: Date;
    verifiedBy?: string;
  };
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VerificationSchema = new Schema<IVerification>(
  {
    verificationId: { type: String, required: true, unique: true, index: true },
    partnerId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['email', 'phone', 'gstin', 'pan', 'bank', 'address', 'document', 'kyc'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'verified', 'failed', 'expired'],
      default: 'pending',
      index: true,
    },
    data: {
      value: { type: String, required: true },
      verifiedValue: { type: String },
      referenceNumber: { type: String },
    },
    verificationMethod: {
      type: String,
      enum: ['automated', 'manual', 'third_party', 'otp'],
      default: 'automated',
    },
    attempts: {
      count: { type: Number, default: 0 },
      lastAttempt: { type: Date },
      maxAttempts: { type: Number, default: 3 },
    },
    result: {
      success: { type: Boolean, default: false },
      message: { type: String },
      details: { type: Map, of: mongoose.Schema.Types.Mixed },
      verifiedAt: { type: Date },
      verifiedBy: { type: String },
    },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes
VerificationSchema.index({ partnerId: 1, type: 1 });
VerificationSchema.index({ status: 1, type: 1 });

export const Verification = mongoose.model<IVerification>('Verification', VerificationSchema);