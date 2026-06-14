import mongoose, { Schema, Document } from 'mongoose';

export interface IGiftCard extends Document {
  cardId: string;
  cardNumber: string;
  pin?: string;
  initialAmount: number;
  currentBalance: number;
  currency: string;
  status: 'active' | 'redeemed' | 'expired' | 'cancelled';
  issuedBy: string;
  merchantId: string;
  createdAt: Date;
  expiresAt: Date;
  redeemedAt?: Date;
  redeemedBy?: string;
  metadata?: Record<string, any>;
}

const GiftCardSchema = new Schema<IGiftCard>(
  {
    cardId: { type: String, required: true, unique: true, index: true },
    cardNumber: { type: String, required: true, unique: true, index: true },
    pin: { type: String },
    initialAmount: { type: Number, required: true },
    currentBalance: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['active', 'redeemed', 'expired', 'cancelled'],
      default: 'active',
      index: true,
    },
    issuedBy: { type: String, required: true },
    merchantId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    redeemedAt: { type: Date },
    redeemedBy: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

GiftCardSchema.index({ merchantId: 1, status: 1 });
GiftCardSchema.index({ expiresAt: 1, status: 1 });

export const GiftCard = mongoose.model<IGiftCard>('GiftCard', GiftCardSchema);