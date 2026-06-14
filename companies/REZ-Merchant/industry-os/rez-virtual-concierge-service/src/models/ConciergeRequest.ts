/**
 * Concierge Request Model
 */

import mongoose, { Schema, Document } from 'mongoose';
import { ConciergeRequest, RequestType, RequestStatus } from '../types';

export interface IConciergeRequest extends Omit<ConciergeRequest, 'id'>, Document {}

const ConciergeRequestSchema = new Schema<IConciergeRequest>(
  {
    id: { type: String, required: true, unique: true, index: true },
    guestId: { type: String, required: true, index: true },
    bookingId: { type: String, index: true },
    merchantId: { type: String, required: true, index: true },
    requestType: {
      type: String,
      enum: Object.values([
        'room_service', 'housekeeping', 'transport', 'spa',
        'restaurant', 'information', 'complaint', 'checkout',
        'checkin', 'general'
      ]),
      required: true,
    },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    assignedTo: { type: String },
    dueBy: { type: Date },
    completedAt: { type: Date },
    notes: { type: String },
  },
  {
    timestamps: true,
    collection: 'concierge_requests',
  }
);

// Indexes
ConciergeRequestSchema.index({ guestId: 1, bookingId: 1 });
ConciergeRequestSchema.index({ merchantId: 1, status: 1 });
ConciergeRequestSchema.index({ merchantId: 1, requestType: 1 });

export const ConciergeRequestModel = mongoose.model<IConciergeRequest>(
  'ConciergeRequest',
  ConciergeRequestSchema
);
