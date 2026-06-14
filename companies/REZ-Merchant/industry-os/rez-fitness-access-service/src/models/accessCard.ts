/**
 * Access Card Model
 * Digital QR cards for gym access
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IAccessCard extends Document {
  memberId: string;
  gymId: string;
  cardNumber: string;
  qrCode: string;
  qrCodeUrl: string;
  status: 'active' | 'suspended' | 'expired' | 'lost';
  validFrom: Date;
  validUntil: Date;
  issuedAt: Date;
  lastUsed?: Date;
  useCount: number;
}

const AccessCardSchema = new Schema<IAccessCard>({
  memberId: { type: String, required: true, index: true },
  gymId: { type: String, required: true, index: true },
  cardNumber: { type: String, required: true, unique: true },
  qrCode: { type: String, required: true, unique: true },
  qrCodeUrl: { type: String },
  status: { type: String, enum: ['active', 'suspended', 'expired', 'lost'], default: 'active' },
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  issuedAt: { type: Date, default: Date.now },
  lastUsed: { type: Date },
  useCount: { type: Number, default: 0 },
}, { timestamps: true });

AccessCardSchema.index({ memberId: 1, gymId: 1 });
AccessCardSchema.index({ cardNumber: 1 }, { unique: true });
AccessCardSchema.index({ qrCode: 1 }, { unique: true });

export const AccessCard = mongoose.model<IAccessCard>('AccessCard', AccessCardSchema);
