import mongoose, { Schema } from 'mongoose';

const schema = new Schema(
  {
    merchantId: { type: Schema.Types.Mixed, required: true },
    storeId: { type: Schema.Types.Mixed },
    title: { type: String },
    description: { type: String },
    category: { type: String },
    date: { type: Date },
    startTime: { type: String },
    endTime: { type: String },
    venue: { type: String },
    address: { type: String },
    location: { type: Schema.Types.Mixed },
    images: { type: [String] },
    coverImage: { type: String },
    price: { type: Number },
    capacity: { type: Number },
    maxTickets: { type: Number },
    ticketTypes: { type: [Schema.Types.Mixed] },
    status: { type: String, default: 'draft' },
    tags: { type: [String] },
    isActive: { type: Boolean },
    isPublic: { type: Boolean },
    registrationRequired: { type: Boolean },
    terms: { type: String },
    organizer: { type: Schema.Types.Mixed },
    contactInfo: { type: Schema.Types.Mixed },
    analytics: { type: Schema.Types.Mixed },
    publishedAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  { strict: true, strictQuery: true, timestamps: true, collection: 'events' },
);
schema.index({ merchantId: 1, status: 1 });
schema.index({ merchantId: 1, date: -1 });

export const Event = mongoose.models.Event || mongoose.model('Event', schema);
