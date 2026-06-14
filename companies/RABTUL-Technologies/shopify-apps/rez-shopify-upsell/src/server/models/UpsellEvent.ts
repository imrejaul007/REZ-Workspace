/**
 * Upsell Event Model
 */

import mongoose, { Schema, Document } from 'mongoose';
import { UpsellAnalytics } from '../../shared/types';

export interface IUpsellEvent extends Document {
  eventId: string;
  shop: string;
  tenantId: string;
  brandId: string;
  checkoutId?: string;
  customerId?: string;
  sessionId: string;
  offerId: string;
  productId: string;
  variantId: string;
  event: 'offer_shown' | 'offer_clicked' | 'offer_accepted' | 'offer_declined';
  revenue: number;
  timestamp: Date;
}

const UpsellEventSchema = new Schema({
  eventId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  shop: {
    type: String,
    required: true,
    lowercase: true,
    index: true,
  },
  tenantId: {
    type: String,
    required: true,
    index: true,
  },
  brandId: {
    type: String,
    required: true,
    index: true,
  },
  checkoutId: String,
  customerId: String,
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  offerId: {
    type: String,
    required: true,
    index: true,
  },
  productId: {
    type: String,
    required: true,
    index: true,
  },
  variantId: String,
  event: {
    type: String,
    enum: ['offer_shown', 'offer_clicked', 'offer_accepted', 'offer_declined'],
    required: true,
    index: true,
  },
  revenue: {
    type: Number,
    default: 0,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: false,
  collection: 'upsell_events',
});

// Compound indexes for analytics
UpsellEventSchema.index({ shop: 1, event: 1, timestamp: -1 });
UpsellEventSchema.index({ tenantId: 1, shop: 1, event: 1, timestamp: -1 });
UpsellEventSchema.index({ sessionId: 1, event: 1 });

// TTL index - auto-delete after 90 days
UpsellEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const UpsellEvent = mongoose.model<IUpsellEvent>('UpsellEvent', UpsellEventSchema);
