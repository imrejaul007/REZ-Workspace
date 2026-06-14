import mongoose, { Schema } from 'mongoose';

// Shared collection: supporttickets is owned by rez-backend. Merchant service
// reads tickets for merchant stores and adds messages via support.ts.
const schema = new Schema(
  {
    merchant: { type: Schema.Types.Mixed },
    ticketNumber: { type: String },
    subject: { type: String },
    status: { type: String },
    category: { type: String },
    messages: { type: [Schema.Types.Mixed], default: [] },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true, collection: 'supporttickets' },
);
schema.index({ merchant: 1, status: 1 });
schema.index({ ticketNumber: 1 });

export const SupportTicket = mongoose.models.SupportTicket || mongoose.model('SupportTicket', schema);
