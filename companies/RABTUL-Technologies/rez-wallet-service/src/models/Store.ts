import mongoose from 'mongoose';
// Proxy model — read-only stub for .populate() resolution in rez-wallet-service.
// Authoritative schema lives in rezbackend/src/models/Store.ts.
// Do NOT add field definitions here — use strict:false so populate can hydrate any shape.
const StoreSchema = new mongoose.Schema({}, { strict: false, collection: 'stores' });
export default mongoose.models.Store || mongoose.model('Store', StoreSchema);
