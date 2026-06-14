import mongoose, { Schema, Document } from 'mongoose';
import { Verification as IVerification } from '../types';

export interface VerificationDocument extends Omit<IVerification, '_id'>, Document {}

const VerificationSchema = new Schema<VerificationDocument>(
  {
    prescriptionId: { type: String, required: true, index: true },
    verifiedBy: { type: String, required: true },
    verifiedAt: { type: Date, default: Date.now },
    notes: { type: String },
    isValid: { type: Boolean, required: true }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => { ret.id = ret._id.toString(); delete ret.__v; return ret; }
    }
  }
);

VerificationSchema.index({ prescriptionId: 1 });

export const VerificationModel = mongoose.model<VerificationDocument>('Verification', VerificationSchema);
