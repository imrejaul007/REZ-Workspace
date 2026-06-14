/**
 * Data Aggregator - Models
 * Collects events from all services for unified analytics
 */

import mongoose, { Schema } from 'mongoose';

// ============================================
// UNIFIED EVENT STREAM
// ============================================

const EventSchema = new Schema({
  eventId: { type: String, required: true, unique: true, index: true },

  // Source
  source: {
    service: String,  // which service generated this
    instance: String,  // instance ID
  },

  // Event type
  type: {
    category: String,  // order, payment, user, engagement
    action: String,    // created, updated, completed
    object: String,    // order, payment, user
  },

  // Customer
  customerId: String,
  sessionId: String,
  userId: String,

  // Entity
  entity: {
    type: String,      // order, product, payment
    id: String,
  },

  // Data
  data: Schema.Types.Mixed,

  // Revenue (if applicable)
  revenue: {
    amount: Number,
    currency: { type: String, default: 'INR' },
  },

  // Location
  location: {
    country: String,
    state: String,
    city: String,
    pincode: String,
    lat: Number,
    lng: Number,
  },

  // Device
  device: {
    type: String,      // mobile, desktop, tablet
    os: String,
    browser: String,
  },

  // Attribution
  attribution: {
    source: String,    // utm_source
    medium: String,     // utm_medium
    campaign: String,   // utm_campaign
    channel: String,    // organic, paid, social
  },

  // Timestamps
  timestamp: { type: Date, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
});

// Indexes
EventSchema.index({ timestamp: -1 });
EventSchema.index({ 'customerId': 1, timestamp: -1 });
EventSchema.index({ 'entity.type': 1, 'entity.id': 1 });
EventSchema.index({ 'type.category': 1, timestamp: -1 });
EventSchema.index({ 'source.service': 1, timestamp: -1 });

export const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);

// ============================================
// AGGREGATIONS
// ============================================

const DailyAggregateSchema = new Schema({
  date: { type: Date, required: true, index: true },

  // Customers
  customers: {
    total: Number,
    new: Number,
    active: Number,
    returning: Number,
  },

  // Revenue
  revenue: {
    gross: Number,
    net: Number,
    avgOrderValue: Number,
    refunds: Number,
  },

  // Orders
  orders: {
    total: Number,
    completed: Number,
    pending: Number,
    cancelled: Number,
    cod: Number,
    prepaid: Number,
  },

  // Engagement
  engagement: {
    sessions: Number,
    pageViews: Number,
    avgSessionDuration: Number,
  },

  // By channel
  byChannel: {
    organic: Number,
    paid: Number,
    social: Number,
    referral: Number,
    direct: Number,
  },

  // By device
  byDevice: {
    mobile: Number,
    desktop: Number,
    tablet: Number,
  },
}, { timestamps: true });

DailyAggregateSchema.index({ date: -1 }, { unique: true });

export const DailyAggregate = mongoose.models.DailyAggregate || mongoose.model('DailyAggregate', DailyAggregateSchema);

// ============================================
// CUSTOMER TIMELINE
// ============================================

const CustomerTimelineSchema = new Schema({
  customerId: { type: String, required: true, index: true },

  events: [{
    eventId: String,
    type: String,
    timestamp: Date,
    data: Schema.Types.Mixed,
  }],

  updatedAt: Date,
});

CustomerTimelineSchema.index({ customerId: 1, 'events.timestamp': -1 });

export const CustomerTimeline = mongoose.models.CustomerTimeline || mongoose.model('CustomerTimeline', CustomerTimelineSchema);
