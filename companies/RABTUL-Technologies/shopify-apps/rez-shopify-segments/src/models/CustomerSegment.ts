/**
 * ReZ Segments - Customer Segment Membership
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomerSegment extends Document {
  customerId: string;
  shop: string;
  segmentId: string;
  addedAt: Date;
}

const CustomerSegmentSchema = new Schema({
  customerId: { type: String, required: true, index: true },
  shop: { type: String, required: true, lowercase: true, index: true },
  segmentId: { type: String, required: true, index: true },
  addedAt: { type: Date, default: Date.now },
}, {
  timestamps: false,
  collection: 'customer_segments',
});

CustomerSegmentSchema.index({ shop: 1, customerId: 1, segmentId: 1 }, { unique: true });
CustomerSegmentSchema.index({ segmentId: 1 });

export const CustomerSegment = mongoose.model<ICustomerSegment>('CustomerSegment', CustomerSegmentSchema);
