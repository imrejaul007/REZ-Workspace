import mongoose, { Document, Schema } from 'mongoose';

// ===========================================
// SCHEDULED RIDE INTERFACE
// ===========================================
export interface IScheduledRide extends Document {
  // User
  userId: mongoose.Types.ObjectId;

  // Locations
  pickup: {
    lat: number;
    lng: number;
    address: string;
  };
  drop: {
    lat: number;
    lng: number;
    address: string;
  };

  // Vehicle
  vehicleType: 'auto' | 'cab' | 'suv' | 'bike';

  // Schedule
  scheduledAt: Date;
  scheduledTimezone: string;

  // Status
  status: ScheduledRideStatus;

  // Advance booking settings
  isAdvanceBooking: boolean;
  advanceNoticeMinutes: number; // How early to dispatch driver

  // Preferences
  paymentMethod: 'wallet' | 'upi' | 'card' | 'cash';
  notes?: string;

  // Scheduled ride config
  recurrence?: RecurrencePattern;

  // Created ride reference (once dispatched)
  rideId?: mongoose.Types.ObjectId;

  // Dispatch tracking
  dispatchedAt?: Date;
  driverAssigned?: mongoose.Types.ObjectId;

  // Cancellation
  cancelledAt?: Date;
  cancelReason?: string;

  // Notifications sent
  notifiedAt?: Date;
  reminderSent: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ===========================================
// RECURRENCE PATTERN
// ===========================================
export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'weekdays' | 'custom';
  daysOfWeek?: number[]; // 0 = Sunday, 6 = Saturday
  endDate?: Date;
  maxOccurrences?: number;
  occurrencesCount: number;
}

// ===========================================
// SCHEDULED RIDE STATUS
// ===========================================
export enum ScheduledRideStatus {
  PENDING = 'pending',           // Waiting to be dispatched
  DISPATCHED = 'dispatched',     // Driver assigned
  IN_PROGRESS = 'in_progress',   // Ride started
  COMPLETED = 'completed',       // Ride completed
  CANCELLED = 'cancelled',      // Cancelled by user
  EXPIRED = 'expired',         // Past scheduled time, no driver
  NO_DRIVER = 'no_driver',     // Couldn't find driver
}

// ===========================================
// SCHEDULED RIDE SCHEMA
// ===========================================
const RecurrencePatternSchema = new Schema({
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'weekdays', 'custom'],
    required: true,
  },
  daysOfWeek: [Number],
  endDate: Date,
  maxOccurrences: Number,
  occurrencesCount: { type: Number, default: 0 },
}, { _id: false });

const ScheduledRideSchema = new Schema<IScheduledRide>({
  // User
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // Locations
  pickup: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, required: true },
  },
  drop: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, required: true },
  },

  // Vehicle
  vehicleType: {
    type: String,
    enum: ['auto', 'cab', 'suv', 'bike'],
    required: true,
  },

  // Schedule
  scheduledAt: { type: Date, required: true, index: true },
  scheduledTimezone: { type: String, default: 'Asia/Kolkata' },

  // Status
  status: {
    type: String,
    enum: Object.values(ScheduledRideStatus),
    default: ScheduledRideStatus.PENDING,
    index: true,
  },

  // Advance booking
  isAdvanceBooking: { type: Boolean, default: true },
  advanceNoticeMinutes: { type: Number, default: 30 },

  // Payment
  paymentMethod: {
    type: String,
    enum: ['wallet', 'upi', 'card', 'cash'],
    default: 'wallet',
  },
  notes: String,

  // Recurrence
  recurrence: RecurrencePatternSchema,

  // Created ride
  rideId: { type: Schema.Types.ObjectId, ref: 'Ride' },

  // Dispatch tracking
  dispatchedAt: Date,
  driverAssigned: { type: Schema.Types.ObjectId, ref: 'Driver' },

  // Cancellation
  cancelledAt: Date,
  cancelReason: String,

  // Notifications
  notifiedAt: Date,
  reminderSent: { type: Boolean, default: false },
}, {
  timestamps: true,
});

// ===========================================
// INDEXES
// ===========================================
ScheduledRideSchema.index({ userId: 1, status: 1 });
ScheduledRideSchema.index({ scheduledAt: 1, status: 1 });
ScheduledRideSchema.index({ status: 1, dispatchedAt: 1 });

// ===========================================
// METHODS
// ===========================================
ScheduledRideSchema.methods.canDispatch = function(): boolean {
  const now = new Date();
  const dispatchTime = new Date(this.scheduledAt);
  dispatchTime.setMinutes(dispatchTime.getMinutes() - this.advanceNoticeMinutes);

  return this.status === ScheduledRideStatus.PENDING && now >= dispatchTime;
};

ScheduledRideSchema.methods.cancel = function(reason: string): void {
  this.status = ScheduledRideStatus.CANCELLED;
  this.cancelledAt = new Date();
  this.cancelReason = reason;
};

ScheduledRideSchema.methods.dispatch = function(driverId: mongoose.Types.ObjectId): void {
  this.status = ScheduledRideStatus.DISPATCHED;
  this.dispatchedAt = new Date();
  this.driverAssigned = driverId;
};

ScheduledRideSchema.methods.markNoDriver = function(): void {
  this.status = ScheduledRideStatus.NO_DRIVER;
};

ScheduledRideSchema.methods.markExpired = function(): void {
  this.status = ScheduledRideStatus.EXPIRED;
};

// ===========================================
// STATICS
// ===========================================
ScheduledRideSchema.statics.findPendingDispatch = async function() {
  const now = new Date();
  const lookAhead = new Date(now.getTime() + 35 * 60 * 1000); // 35 min ahead

  return this.find({
    status: ScheduledRideStatus.PENDING,
    scheduledAt: {
      $gte: now,
      $lte: lookAhead,
    },
  });
};

ScheduledRideSchema.statics.findByUser = async function(userId: string) {
  return this.find({ userId: new mongoose.Types.ObjectId(userId) })
    .sort({ scheduledAt: -1 });
};

export const ScheduledRide = mongoose.model<IScheduledRide>('ScheduledRide', ScheduledRideSchema);

// Type alias for TypeScript
export type ScheduledRide = IScheduledRide;
