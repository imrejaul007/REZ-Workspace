import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * ConciergeRequest - Guest service requests for hotel concierge operations.
 * Supports room service, taxi, restaurant, spa, tour, and other guest requests.
 */
export interface IConciergeRequest extends Document {
  storeId: Types.ObjectId;
  roomId: string;
  guestName: string;
  guestPhone: string;
  type: 'room_service' | 'taxi' | 'restaurant' | 'spa' | 'tour' | 'other';
  description: string;
  preferredTime?: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: Types.ObjectId;
  notes?: string;
  rating?: number;
  feedback?: string;
  createdAt: Date;
  completedAt?: Date;
  updatedAt: Date;
}

// Type constants for validation
export const CONCIERGE_REQUEST_TYPES = ['room_service', 'taxi', 'restaurant', 'spa', 'tour', 'other'] as const;
export const CONCIERGE_REQUEST_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'] as const;

const ConciergeRequestSchema = new Schema<IConciergeRequest>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    roomId: { type: String, required: true, trim: true },
    guestName: { type: String, required: true, trim: true },
    guestPhone: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: CONCIERGE_REQUEST_TYPES,
    },
    description: { type: String, required: true, trim: true },
    preferredTime: { type: Date },
    status: {
      type: String,
      enum: CONCIERGE_REQUEST_STATUSES,
      default: 'pending',
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'MerchantUser' },
    notes: { type: String, trim: true },
    rating: { type: Number, min: 1, max: 5 },
    feedback: { type: String, trim: true },
    completedAt: { type: Date },
  },
  { timestamps: true },
);

// Indexes for efficient queries
ConciergeRequestSchema.index({ storeId: 1, status: 1 });
ConciergeRequestSchema.index({ storeId: 1, createdAt: -1 });
ConciergeRequestSchema.index({ assignedTo: 1, status: 1 });
ConciergeRequestSchema.index({ guestPhone: 1, createdAt: -1 });
ConciergeRequestSchema.index({ roomId: 1, createdAt: -1 });

export const ConciergeRequest =
  mongoose.models.ConciergeRequest ||
  mongoose.model<IConciergeRequest>('ConciergeRequest', ConciergeRequestSchema);
