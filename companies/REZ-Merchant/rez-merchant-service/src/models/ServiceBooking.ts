import mongoose from 'mongoose';

// Cross-service read proxy: strict:false is intentional.
// This collection is owned and written by rez-backend. The merchant service
// reads it for analytics/reporting only. Adding field definitions here would
// cause silent field-stripping on any save attempt; use the rez-backend model
// for writes.
const schema = new mongoose.Schema({}, { strict: true, strictQuery: true, timestamps: true, collection: 'servicebookings' });
schema.index({ merchantId: 1, status: 1 });
schema.index({ store: 1, bookingDate: 1 });

export const ServiceBooking = mongoose.models.ServiceBooking || mongoose.model('ServiceBooking', schema);
