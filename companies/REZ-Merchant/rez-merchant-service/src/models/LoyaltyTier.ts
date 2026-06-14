import mongoose from 'mongoose';
// Cross-service read proxy: strict:false is intentional.
// This collection is owned by rez-backend. The merchant service reads loyalty
// tier configuration for display/reporting only. Use rez-backend for writes.
const s = new mongoose.Schema({}, { strict: true, strictQuery: true, timestamps: true });
s.index({ merchantId: 1 });
export const LoyaltyTier = mongoose.models.LoyaltyTier || mongoose.model('LoyaltyTier', s, 'loyaltytiers');
