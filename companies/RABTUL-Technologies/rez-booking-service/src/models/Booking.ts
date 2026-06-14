import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

// Booking type enum
export enum BookingType {
  HOTEL = 'hotel',
  FLIGHT = 'flight',
  TRAIN = 'train',
  BUS = 'bus',
  CAB = 'cab',
  EXPERIENCE = 'experience',
  PACKAGE = 'package',
}

// Booking status enum
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  FAILED = 'failed',
}

// Guest details interface
export interface IGuestDetails {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
}

// Pricing interface
export interface IPricing {
  baseAmount: number;
  taxes: number;
  fees: number;
  discount: number;
  total: number;
  currency: string;
  breakdown?: {
    cgst?: number;
    sgst?: number;
    tds?: number;
  };
}

// Booking document interface
export interface IBooking extends Document {
  bookingId: string;
  userId: string;
  companyId?: string;
  type: BookingType;
  status: BookingStatus;
  source: 'hotel' | 'stayown' | 'travel' | 'app' | 'admin';

  // Booking details
  externalBookingId?: string; // ID from the source service (PMS, airline, etc.)
  confirmationNumber?: string;

  // Property/Service details
  propertyId?: string;
  propertyName?: string;
  roomTypeId?: string;
  roomName?: string;

  // Travel details
  flightId?: string;
  trainId?: string;
  busId?: string;
  cabId?: string;

  // Dates
  checkIn?: Date;
  checkOut?: Date;
  departureDate?: Date;
  returnDate?: Date;

  // Guest details
  guests: IGuestDetails[];
  guestCount: number;

  // Contact
  contactEmail: string;
  contactPhone: string;

  // Pricing
  pricing: IPricing;

  // Payment
  paymentId?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: string;

  // Refund
  refundId?: string;
  refundAmount?: number;
  refundStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  cancellationReason?: string;
  cancelledAt?: Date;

  // Metadata
  metadata?: Record<string, unknown>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Booking schema
const BookingSchema = new Schema<IBooking>(
  {
    bookingId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    companyId: { type: String, index: true },
    type: { type: String, enum: Object.values(BookingType), required: true, index: true },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      required: true,
      default: BookingStatus.PENDING,
      index: true,
    },
    source: { type: String, enum: ['hotel', 'stayown', 'travel', 'app', 'admin'], required: true },
    externalBookingId: { type: String, index: true },
    confirmationNumber: { type: String, index: true },

    // Property/Service details
    propertyId: { type: String, index: true },
    propertyName: String,
    roomTypeId: String,
    roomName: String,

    // Travel details
    flightId: String,
    trainId: String,
    busId: String,
    cabId: String,

    // Dates
    checkIn: Date,
    checkOut: Date,
    departureDate: Date,
    returnDate: Date,

    // Guest details
    guests: [
      {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: String,
        phone: String,
        dateOfBirth: String,
      },
    ],
    guestCount: { type: Number, required: true, default: 1 },

    // Contact
    contactEmail: { type: String, required: true },
    contactPhone: { type: String, required: true },

    // Pricing
    pricing: {
      baseAmount: { type: Number, required: true },
      taxes: { type: Number, default: 0 },
      fees: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      total: { type: Number, required: true },
      currency: { type: String, default: 'INR' },
      breakdown: {
        cgst: Number,
        sgst: Number,
        tds: Number,
      },
    },

    // Payment
    paymentId: String,
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
    },
    paymentMethod: String,

    // Refund
    refundId: String,
    refundAmount: Number,
    refundStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
    },
    cancellationReason: String,
    cancelledAt: Date,

    // Metadata
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    collection: 'bookings',
  }
);

// Indexes for common queries
BookingSchema.index({ userId: 1, createdAt: -1 });
BookingSchema.index({ type: 1, status: 1 });
BookingSchema.index({ propertyId: 1, checkIn: 1, checkOut: 1 });
BookingSchema.index({ createdAt: -1 });

// Pre-save hook to generate booking ID if not set
// Uses crypto.randomUUID() for cryptographically secure ID generation
BookingSchema.pre('save', function (next) {
  if (!this.bookingId) {
    const prefix = this.type.toUpperCase().substring(0, 2);
    this.bookingId = `${prefix}${Date.now()}-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
  }
  next();
});

export const Booking = mongoose.model<IBooking>('Booking', BookingSchema);
