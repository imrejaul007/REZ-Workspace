/**
 * QR Session Model
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IQRSession extends Document {
  sessionId: string;
  userId: string;
  gymId: string;
  qrCode: string;
  expiresAt: string;
  isUsed: boolean;
  usedAt?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QRSessionSchema = new Schema<IQRSession>({
  sessionId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  gymId: { type: String, required: true, index: true },
  qrCode: { type: String, required: true, unique: true },
  expiresAt: { type: String, required: true, index: true },
  isUsed: { type: Boolean, default: false },
  usedAt: String,
}, { timestamps: true });

QRSessionSchema.index({ qrCode: 1, isUsed: 1 });
QRSessionSchema.index({ expiresAt: 1, isUsed: 1 });

export const QRSession = mongoose.model<IQRSession>('QRSession', QRSessionSchema);
