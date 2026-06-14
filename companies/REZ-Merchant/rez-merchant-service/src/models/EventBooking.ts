import mongoose from 'mongoose';

// Cross-service read proxy: strict:false is intentional.
// This collection is owned and written by rez-backend. The merchant service
// reads it for event attendance/reporting only. Use rez-backend for writes.
const schema = new mongoose.Schema({}, { strict: true, strictQuery: true, timestamps: true, collection: 'eventbookings' });
schema.index({ eventId: 1, status: 1 });

export const EventBooking = mongoose.models.EventBooking || mongoose.model('EventBooking', schema);
