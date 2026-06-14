import mongoose from 'mongoose';

const schema = new mongoose.Schema({}, { strict: true, timestamps: true, collection: 'blockedslots' });
schema.index({ merchantId: 1, storeId: 1, date: 1 });

export const BlockedSlot = mongoose.models.BlockedSlot || mongoose.model('BlockedSlot', schema);
