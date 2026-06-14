import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { WaitlistStatus, WaitlistEntry as IWaitlistEntry } from '../types';

// ============================================
// Waitlist Entry Schema
// ============================================

export interface WaitlistEntryDocument
  extends Omit<IWaitlistEntry, 'entryId'>,
    Document {
  entryId: string;
}

const waitlistEntrySchema = new Schema<WaitlistEntryDocument>(
  {
    entryId: {
      type: String,
      required: true,
      unique: true,
      default: () => `WL-${uuidv4()}`,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    vertical: {
      type: String,
      required: true,
      lowercase: true,
      enum: [
        'restaurant',
        'hotel',
        'salon',
        'spa',
        'gym',
        'education',
        'events',
        'automotive',
        'medical',
        'tours',
        'rentals',
        'entertainment',
        'cleaning',
        'repair',
        'childcare',
        'petcare',
        'legal',
      ],
    },
    merchantId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true, // Format: YYYY-MM-DD
    },
    time: {
      type: String,
    },
    partySize: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    status: {
      type: String,
      required: true,
      enum: ['waiting', 'notified', 'booked', 'expired', 'cancelled'],
      default: 'waiting',
      index: true,
    },
    notifiedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    // Store notification preferences
    notificationEmail: {
      type: String,
    },
    notificationPhone: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: '__v',
    collection: 'waitlist_entries',
  }
);

// ============================================
// Indexes
// ============================================

// Compound indexes for common queries
waitlistEntrySchema.index({ merchantId: 1, status: 1, date: 1 });
waitlistEntrySchema.index({ userId: 1, status: 1 });
waitlistEntrySchema.index({ status: 1, expiresAt: 1 });

// Text index for searching (optional)
// waitlistEntrySchema.index({ userId: 'text', merchantId: 'text' });

// TTL index - entries auto-expire after expiresAt
// However, we also mark them as 'expired' manually in the service layer
// TTL index is 7 days from creation by default
waitlistEntrySchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 7 * 24 * 60 * 60, partialFilterExpression: { status: 'expired' } }
);

// ============================================
// Virtuals
// ============================================

waitlistEntrySchema.virtual('isExpired').get(function () {
  return this.expiresAt < new Date() && this.status === 'waiting';
});

waitlistEntrySchema.virtual('canBeNotified').get(function () {
  return this.status === 'waiting' && !this.isExpired;
});

// ============================================
// Instance Methods
// ============================================

waitlistEntrySchema.methods.markNotified = async function (): Promise<WaitlistEntryDocument> {
  this.status = 'notified';
  this.notifiedAt = new Date();
  // Extend expiry to 30 minutes from notification
  this.expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  return this.save();
};

waitlistEntrySchema.methods.markBooked = async function (): Promise<WaitlistEntryDocument> {
  this.status = 'booked';
  return this.save();
};

waitlistEntrySchema.methods.markExpired = async function (): Promise<WaitlistEntryDocument> {
  this.status = 'expired';
  return this.save();
};

waitlistEntrySchema.methods.cancel = async function (): Promise<WaitlistEntryDocument> {
  this.status = 'cancelled';
  return this.save();
};

// ============================================
// Static Methods
// ============================================

waitlistEntrySchema.statics.findByEntryId = function (
  entryId: string
): Promise<WaitlistEntryDocument | null> {
  return this.findOne({ entryId });
};

waitlistEntrySchema.statics.findByUserId = function (
  userId: string,
  options?: { status?: WaitlistStatus }
): Promise<WaitlistEntryDocument[]> {
  const query: Record<string, unknown> = { userId };
  if (options?.status) {
    query.status = options.status;
  }
  return this.find(query).sort({ createdAt: -1 });
};

waitlistEntrySchema.statics.findByMerchantAndDate = function (
  merchantId: string,
  date: string,
  options?: { status?: WaitlistStatus; time?: string }
): Promise<WaitlistEntryDocument[]> {
  const query: Record<string, unknown> = { merchantId, date };
  if (options?.status) {
    query.status = options.status;
  }
  if (options?.time) {
    query.time = options.time;
  }
  return this.find(query).sort({ partySize: -1, createdAt: 1 }); // Priority to larger parties, then first-come
};

waitlistEntrySchema.statics.findExpiredEntries = function (): Promise<WaitlistEntryDocument[]> {
  return this.find({
    status: 'waiting',
    expiresAt: { $lt: new Date() },
  });
};

waitlistEntrySchema.statics.findWaitingByMerchantDateTime = function (
  merchantId: string,
  date: string,
  time: string
): Promise<WaitlistEntryDocument[]> {
  return this.find({
    merchantId,
    date,
    time,
    status: 'waiting',
    expiresAt: { $gt: new Date() },
  }).sort({ partySize: -1, createdAt: 1 });
};

// ============================================
// Pre/Post Hooks
// ============================================

waitlistEntrySchema.pre('save', function (next) {
  // Default expiry is 24 hours from creation if not set
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
  next();
});

// ============================================
// Model Export
// ============================================

export interface WaitlistEntryModel extends Model<WaitlistEntryDocument> {
  findByEntryId(entryId: string): Promise<WaitlistEntryDocument | null>;
  findByUserId(
    userId: string,
    options?: { status?: WaitlistStatus }
  ): Promise<WaitlistEntryDocument[]>;
  findByMerchantAndDate(
    merchantId: string,
    date: string,
    options?: { status?: WaitlistStatus; time?: string }
  ): Promise<WaitlistEntryDocument[]>;
  findExpiredEntries(): Promise<WaitlistEntryDocument[]>;
  findWaitingByMerchantDateTime(
    merchantId: string,
    date: string,
    time: string
  ): Promise<WaitlistEntryDocument[]>;
}

export const WaitlistEntry = mongoose.model<WaitlistEntryDocument, WaitlistEntryModel>(
  'WaitlistEntry',
  waitlistEntrySchema
);

export default WaitlistEntry;