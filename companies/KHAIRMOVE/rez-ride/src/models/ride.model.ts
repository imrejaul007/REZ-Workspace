import mongoose, { Document, Schema } from 'mongoose';
import { InvalidStateTransitionError } from '../common/exceptions';

// ===========================================
// LOCATION INTERFACE
// ===========================================
export interface ILocation {
  lat: number;
  lng: number;
  address: string;
}

// ===========================================
// FARE INTERFACE
// ===========================================
export interface IFare {
  base: number;
  distance: number;
  distanceKm: number;
  time: number;
  timeMinutes: number;
  waiting: number;
  waitingMinutes: number;
  surge: number;
  surgeMultiplier: number;
  nightCharges: number;
  total: number;
}

// ===========================================
// VOUCHER APPLIED INTERFACE
// ===========================================
export interface IVoucherApplied {
  voucherId: string;
  amount: number;
  type: 'ride_credit' | 'service_credit';
}

// ===========================================
// RIDE INTERFACE
// ===========================================
export interface IRide extends Document {
  // User & Driver
  userId: mongoose.Types.ObjectId;
  driverId?: mongoose.Types.ObjectId;

  // Locations
  pickup: ILocation;
  drop: ILocation;

  // Vehicle
  vehicleType: 'auto' | 'cab' | 'suv' | 'bike' | 'bus';

  // Status - State Machine
  status: RideStatus;

  // OTP for verification
  otp?: string;

  // Fare
  fare: IFare;
  fareEstimated?: IFare;

  // Voucher
  voucherApplied?: IVoucherApplied;
  finalAmount?: number;

  // Timing
  requestedAt: Date;
  acceptedAt?: Date;
  arrivedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;

  // Distance & Duration
  distanceKm?: number;
  durationMinutes?: number;

  // Payment
  paymentMethod: 'wallet' | 'upi' | 'card' | 'cash';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentId?: string;

  // Cashback
  cashbackAmount?: number;
  cashbackCredited: boolean;

  // Rating
  userRating?: number;
  userFeedback?: string;
  driverRating?: number;

  // Ad tracking
  adImpressions?: number;
  adServed: boolean;

  // Cancellation
  cancelledBy?: 'user' | 'driver' | 'system';
  cancelReason?: string;

  // Metadata
  notes?: string;
  metadata?: Record<string, any>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ===========================================
// RIDE STATUS ENUM
// ===========================================
export enum RideStatus {
  REQUESTED = 'requested',
  ASSIGNED = 'assigned',
  ACCEPTED = 'accepted',
  ARRIVED = 'arrived',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// ===========================================
// RIDE SCHEMA
// ===========================================
const LocationSchema = new Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  address: { type: String, required: true },
}, { _id: false });

const FareSchema = new Schema({
  base: { type: Number, required: true },
  distance: { type: Number, default: 0 },
  distanceKm: { type: Number, default: 0 },
  time: { type: Number, default: 0 },
  timeMinutes: { type: Number, default: 0 },
  waiting: { type: Number, default: 0 },
  waitingMinutes: { type: Number, default: 0 },
  surge: { type: Number, default: 1 },
  nightCharges: { type: Number, default: 0 },
  total: { type: Number, required: true },
}, { _id: false });

const VoucherAppliedSchema = new Schema({
  voucherId: { type: String, required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['ride_credit', 'service_credit'], required: true },
}, { _id: false });

const RideSchema = new Schema<IRide>({
  // User & Driver
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  driverId: { type: Schema.Types.ObjectId, ref: 'Driver', index: true },

  // Locations
  pickup: { type: LocationSchema, required: true },
  drop: { type: LocationSchema, required: true },

  // Vehicle
  vehicleType: {
    type: String,
    enum: ['auto', 'cab', 'suv', 'bike', 'bus'],
    required: true
  },

  // Status
  status: {
    type: String,
    enum: Object.values(RideStatus),
    default: RideStatus.REQUESTED,
    index: true
  },

  // OTP
  otp: { type: String, select: false },

  // Fare
  fare: { type: FareSchema, required: true },
  fareEstimated: { type: FareSchema },

  // Voucher
  voucherApplied: { type: VoucherAppliedSchema },
  finalAmount: { type: Number },

  // Timing
  requestedAt: { type: Date, default: Date.now },
  acceptedAt: { type: Date },
  arrivedAt: { type: Date },
  startedAt: { type: Date },
  completedAt: { type: Date },
  cancelledAt: { type: Date },

  // Distance & Duration
  distanceKm: { type: Number },
  durationMinutes: { type: Number },

  // Payment
  paymentMethod: {
    type: String,
    enum: ['wallet', 'upi', 'card', 'cash'],
    default: 'wallet'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: { type: String },

  // Cashback
  cashbackAmount: { type: Number },
  cashbackCredited: { type: Boolean, default: false },

  // Rating
  userRating: { type: Number, min: 1, max: 5 },
  userFeedback: { type: String },
  driverRating: { type: Number, min: 1, max: 5 },

  // Ad tracking
  adImpressions: { type: Number, default: 0 },
  adServed: { type: Boolean, default: false },

  // Cancellation
  cancelledBy: { type: String, enum: ['user', 'driver', 'system'] },
  cancelReason: { type: String },

  // Metadata
  notes: { type: String },
  metadata: { type: Schema.Types.Mixed },
}, {
  timestamps: true,
});

// ===========================================
// INDEXES
// ===========================================
RideSchema.index({ userId: 1, status: 1 });
RideSchema.index({ driverId: 1, status: 1 });
RideSchema.index({ status: 1, requestedAt: -1 });
RideSchema.index({ 'pickup.lat': 1, 'pickup.lng': 1 });
RideSchema.index({ 'drop.lat': 1, 'drop.lng': 1 });
RideSchema.index({ createdAt: -1 });

// ===========================================
// STATE MACHINE VALIDATION
// ===========================================
const validTransitions: Record<RideStatus, RideStatus[]> = {
  [RideStatus.REQUESTED]: [RideStatus.ASSIGNED, RideStatus.CANCELLED],
  [RideStatus.ASSIGNED]: [RideStatus.ACCEPTED, RideStatus.CANCELLED],
  [RideStatus.ACCEPTED]: [RideStatus.ARRIVED, RideStatus.CANCELLED],
  [RideStatus.ARRIVED]: [RideStatus.IN_PROGRESS, RideStatus.CANCELLED],
  [RideStatus.IN_PROGRESS]: [RideStatus.COMPLETED, RideStatus.CANCELLED],
  [RideStatus.COMPLETED]: [],
  [RideStatus.CANCELLED]: [],
};

RideSchema.methods.canTransitionTo = function(newStatus: RideStatus): boolean {
  const currentStatus = this.status as RideStatus;
  return validTransitions[currentStatus]?.includes(newStatus) ?? false;
};

RideSchema.methods.transitionTo = function(newStatus: RideStatus): void {
  if (!this.canTransitionTo(newStatus)) {
    throw new InvalidStateTransitionError(this.status as string, newStatus);
  }

  this.status = newStatus;

  // Set timestamps
  switch (newStatus) {
    case RideStatus.ASSIGNED:
      break;
    case RideStatus.ACCEPTED:
      this.acceptedAt = new Date();
      break;
    case RideStatus.ARRIVED:
      this.arrivedAt = new Date();
      break;
    case RideStatus.IN_PROGRESS:
      this.startedAt = new Date();
      break;
    case RideStatus.COMPLETED:
      this.completedAt = new Date();
      break;
    case RideStatus.CANCELLED:
      this.cancelledAt = new Date();
      break;
  }
};

// ===========================================
// METHODS
// ===========================================
RideSchema.methods.calculateDuration = function(): number {
  if (this.startedAt && this.completedAt) {
    return Math.round((this.completedAt.getTime() - this.startedAt.getTime()) / 60000);
  }
  return 0;
};

RideSchema.methods.calculateCashback = function(): number {
  if (this.fare?.total) {
    return Math.round(this.fare.total * 0.10 * 100) / 100; // 10% cashback
  }
  return 0;
};

export const Ride = mongoose.model<IRide>('Ride', RideSchema);

// Type alias for TypeScript - use this for type annotations
export type Ride = IRide;
