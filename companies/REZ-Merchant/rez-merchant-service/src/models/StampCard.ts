import mongoose from 'mongoose';
// Cross-service read proxy: strict:false is intentional.
// This collection is owned by rez-backend. The merchant service reads stamp
// card state for merchant dashboard display only. Use rez-backend for writes.
const s = new mongoose.Schema({}, { strict: true, strictQuery: true, timestamps: true });
s.index({ merchantId: 1 });
export const StampCard = mongoose.models.StampCard || mongoose.model('StampCard', s, 'stampcards');
