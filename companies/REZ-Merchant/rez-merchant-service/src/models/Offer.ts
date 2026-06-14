import mongoose from 'mongoose';

// RC-1 FIX: READ-ONLY PROXY — writes must go through rez-backend API.
// Do NOT instantiate this model for write operations. Use the HTTP client in routes/offers.ts.
// This model provides type safety for read operations only.

// Cross-service read proxy: strict:false is intentional.
// The Offer schema definition and field enforcement live in rez-backend.
// The merchant service uses offerValidator.ts for runtime validation on writes,
// and reads this collection for dashboards/analytics. strict:false allows the
// full rez-backend document shape to be read without field stripping.
const schema = new mongoose.Schema({}, { strict: true, strictQuery: true, timestamps: true, collection: 'offers' });
schema.index({ 'store.id': 1, createdAt: -1 });
schema.index({ 'validity.isActive': 1 });
schema.index({ createdBy: 1 });

export const Offer = mongoose.models.Offer || mongoose.model('Offer', schema);
