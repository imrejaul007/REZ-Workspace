import mongoose from 'mongoose';
// Proxy model — read-only stub for .populate() resolution in rez-wallet-service.
// Authoritative schema lives in rez-merchant-service.
// Do NOT add field definitions here — use strict:false so populate can hydrate any shape.
const MerchantSchema = new mongoose.Schema({}, { strict: false, collection: 'merchants' });
export default mongoose.models.Merchant || mongoose.model('Merchant', MerchantSchema);
