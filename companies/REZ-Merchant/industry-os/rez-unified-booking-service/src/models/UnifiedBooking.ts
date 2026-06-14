import mongoose, { Schema, Document, Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {
  BookingStatus,
  PaymentStatus,
  UnifiedBooking as IUnifiedBooking,
} from '../types';

// ============================================
// Unified Booking Schema
// ============================================

export interface UnifiedBookingDocument extends Omit<IUnifiedBooking, 'bookingId'>, Document {
  bookingId: string;
}

const unifiedBookingSchema = new Schema<UnifiedBookingDocument>(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
      default: () => `BK-${uuidv4()}`,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    merchantId: {
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
      index: true,
    },
    verticalBookingId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      lowercase: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
      default: 'pending',
      index: true,
    },
    startDateTime: {
      type: Date,
      required: true,
      index: true,
    },
    endDateTime: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 1,
    },
    partySize: {
      type: Number,
      min: 1,
      max: 1000,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    amountPaid: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      uppercase: true,
      minlength: 3,
      maxlength: 3,
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ['pending', 'paid', 'refunded', 'partial'],
      default: 'pending',
    },
    bookingData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    notes: {
      type: String,
      maxlength: 1000,
    },
    cancellationReason: {
      type: String,
      maxlength: 500,
    },
    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: '__v',
    collection: 'unified_bookings',
  }
);

// ============================================
// Indexes
// ============================================

// Compound indexes for common queries
unifiedBookingSchema.index({ userId: 1, vertical: 1 });
unifiedBookingSchema.index({ merchantId: 1, status: 1 });
unifiedBookingSchema.index({ userId: 1, status: 1 });
unifiedBookingSchema.index({ merchantId: 1, vertical: 1 });
unifiedBookingSchema.index({ status: 1, createdAt: -1 });

// Date range indexes for calendar queries
unifiedBookingSchema.index({ startDateTime: 1, endDateTime: 1 });
unifiedBookingSchema.index({ userId: 1, startDateTime: 1, endDateTime: 1 });
unifiedBookingSchema.index({ merchantId: 1, startDateTime: 1, endDateTime: 1 });

// Unique constraint on vertical booking ID
unifiedBookingSchema.index({ vertical: 1, verticalBookingId: 1 }, { unique: true });

// TTL index for automatic cleanup of old completed/cancelled bookings (optional, 90 days)
// Note: We don't actually want to delete bookings, but this could be used for session cleanup
// unifiedBookingSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// ============================================
// Virtuals
// ============================================

unifiedBookingSchema.virtual('isPast').get(function () {
  return this.endDateTime < new Date();
});

unifiedBookingSchema.virtual('isActive').get(function () {
  const now = new Date();
  return (
    this.status === 'confirmed' ||
    this.status === 'in_progress' ||
    (this.status === 'pending' && this.startDateTime > now)
  );
});

unifiedBookingSchema.virtual('isCancellable').get(function () {
  return ['pending', 'confirmed'].includes(this.status);
});

// ============================================
// Instance Methods
// ============================================

unifiedBookingSchema.methods.cancel = async function (
  reason?: string
): Promise<UnifiedBookingDocument> {
  this.status = 'cancelled';
  this.cancellationReason = reason;
  this.cancelledAt = new Date();
  return this.save();
};

unifiedBookingSchema.methods.markNoShow = async function (): Promise<UnifiedBookingDocument> {
  this.status = 'no_show';
  return this.save();
};

unifiedBookingSchema.methods.markInProgress = async function (): Promise<UnifiedBookingDocument> {
  this.status = 'in_progress';
  return this.save();
};

unifiedBookingSchema.methods.complete = async function (): Promise<UnifiedBookingDocument> {
  this.status = 'completed';
  return this.save();
};

// ============================================
// Static Methods
// ============================================

unifiedBookingSchema.statics.findByBookingId = function (
  bookingId: string
): Promise<UnifiedBookingDocument | null> {
  return this.findOne({ bookingId });
};

unifiedBookingSchema.statics.findByUserAndVertical = function (
  userId: string,
  vertical: string,
  options?: { status?: BookingStatus; fromDate?: Date; toDate?: Date }
): Promise<UnifiedBookingDocument[]> {
  const query: Record<string, unknown> = { userId, vertical };

  if (options?.status) {
    query.status = options.status;
  }
  if (options?.fromDate || options?.toDate) {
    query.startDateTime = {};
    if (options.fromDate) {
      (query.startDateTime as Record<string, Date>)['$gte'] = options.fromDate;
    }
    if (options.toDate) {
      (query.startDateTime as Record<string, Date>)['$lte'] = options.toDate;
    }
  }

  return this.find(query).sort({ startDateTime: -1 });
};

unifiedBookingSchema.statics.findByMerchantAndDateRange = function (
  merchantId: string,
  fromDate: Date,
  toDate: Date,
  options?: { status?: BookingStatus }
): Promise<UnifiedBookingDocument[]> {
  const query: Record<string, unknown> = {
    merchantId,
    startDateTime: { $gte: fromDate, $lte: toDate },
  };

  if (options?.status) {
    query.status = options.status;
  }

  return this.find(query).sort({ startDateTime: 1 });
};

// ============================================
// Pre/Post Hooks
// ============================================

unifiedBookingSchema.pre('save', function (next) {
  // Ensure endDateTime is calculated from startDateTime + duration
  if (this.isModified('startDateTime') || this.isModified('duration')) {
    const start = new Date(this.startDateTime);
    this.endDateTime = new Date(start.getTime() + this.duration * 60 * 1000);
  }

  // Ensure amountPaid doesn't exceed totalAmount
  if (this.amountPaid > this.totalAmount) {
    this.amountPaid = this.totalAmount;
  }

  // Update payment status based on amounts
  if (this.amountPaid >= this.totalAmount && this.totalAmount > 0) {
    this.paymentStatus = 'paid';
  } else if (this.amountPaid > 0) {
    this.paymentStatus = 'partial';
  }

  next();
});

// ============================================
// Model Export
// ============================================

export interface UnifiedBookingModel extends Model<UnifiedBookingDocument> {
  findByBookingId(bookingId: string): Promise<UnifiedBookingDocument | null>;
  findByUserAndVertical(
    userId: string,
    vertical: string,
    options?: { status?: BookingStatus; fromDate?: Date; toDate?: Date }
  ): Promise<UnifiedBookingDocument[]>;
  findByMerchantAndDateRange(
    merchantId: string,
    fromDate: Date,
    toDate: Date,
    options?: { status?: BookingStatus }
  ): Promise<UnifiedBookingDocument[]>;
}

export const UnifiedBooking = mongoose.model<
  UnifiedBookingDocument,
  UnifiedBookingModel
>('UnifiedBooking', unifiedBookingSchema);

export default UnifiedBooking;