import mongoose, { Schema } from 'mongoose';

const s = new Schema(
  {
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant', required: true, index: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store' },
    code: { type: String },
    initialBalance: { type: Number, min: 0 },
    balance: { type: Number, min: 0 },
    status: { type: String, enum: ['active', 'redeemed', 'expired', 'cancelled'], default: 'active' },
    expiresAt: { type: Date },
    recipientEmail: { type: String },
    recipientName: { type: String },
    message: { type: String },
  },
  { strict: true, strictQuery: true, timestamps: true },
);
s.index({ merchantId: 1 });
s.index({ merchantId: 1, status: 1 });
s.index({ code: 1 }, { unique: true, sparse: true });
s.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const GiftCard = mongoose.models.GiftCard || mongoose.model('GiftCard', s, 'giftcards');
