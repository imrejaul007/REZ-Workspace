import mongoose, { Schema } from 'mongoose';

// Canonical source: @rez/shared-types/enums/coinType - keep in sync
// coinType enum values must match CoinType from shared-types.
//
// Shared collection: cointransactions is also written by rez-backend.
// merchant service reads/writes via coins.ts. Merchant ref is stored at
// metadata.storeId (not top-level merchantId) for rez-backend compatibility.
const s = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    merchantId: { type: Schema.Types.ObjectId, ref: 'Merchant' },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store' },
    coinType: {
      type: String,
      enum: ['rez', 'prive', 'branded', 'promo', 'cashback', 'referral'],
      default: 'rez',
    },
    source: {
      type: String,
      enum: ['merchant_award', 'purchase', 'refund', 'promotion', 'referral', 'manual'],
      default: 'merchant_award',
    },
    type: { type: String, enum: ['award', 'redeem', 'expire', 'adjust', 'refund', 'bonus'], required: true },
    amount: { type: Number, required: true },
    coins: { type: Number },
    description: { type: String, default: 'Merchant coin award' },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
    status: { type: String, enum: ['pending', 'completed', 'failed', 'expired', 'cancelled'], default: 'pending' },
    expiresAt: { type: Date },
    reason: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true },
);

// Sync legacy `coins` field → `amount` so backend validators always see `amount`.
s.pre('save', function (next) {
  if (this.isModified('coins') && this.coins != null && this.amount == null) {
    this.amount = this.coins;
  }
  next();
});
s.index({ 'metadata.storeId': 1, createdAt: -1 }, { sparse: true });
s.index({ user: 1, createdAt: -1 });
s.index({ merchantId: 1, createdAt: -1 });
s.index({ merchantId: 1, status: 1 });
s.index({ orderId: 1 }, { sparse: true });
s.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const CoinTransaction = mongoose.models.CoinTransaction || mongoose.model('CoinTransaction', s, 'cointransactions');
