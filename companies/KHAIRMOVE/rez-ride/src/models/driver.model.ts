import mongoose, { Document, Schema } from 'mongoose';

// ===========================================
// VEHICLE INTERFACE
// ===========================================
export interface IVehicle {
  type: 'auto' | 'cab' | 'suv' | 'bike' | 'bus';
  make: string;
  model: string;
  year: number;
  color: string;
  plate: string;
  rcNumber: string;
  insuranceNumber?: string;
  insuranceExpiry?: Date;
  permitNumber?: string;
  permitExpiry?: Date;
}

// ===========================================
// BANK DETAILS INTERFACE
// ===========================================
export interface IBankDetails {
  accountNumber: string;
  ifsc: string;
  accountHolderName: string;
  upiId?: string;
}

// ===========================================
// DOCUMENT INTERFACE
// ===========================================
export interface IDocument {
  type: 'dl' | 'rc' | 'insurance' | 'permit' | 'aadhar' | 'pan';
  number: string;
  imageUrl: string;
  verified: boolean;
  verifiedAt?: Date;
  expiry?: Date;
}

// ===========================================
// LOCATION INTERFACE
// ===========================================
export interface IDriverLocation {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  updatedAt: Date;
}

// ===========================================
// EARNINGS INTERFACE
// ===========================================
export interface IDailyEarnings {
  date: string; // YYYY-MM-DD
  ridesCompleted: number;
  rideEarnings: number;
  adRevenue: number;
  bonuses: number;
  total: number;
  rideDistanceKm: number;
  rideMinutes: number;
}

// ===========================================
// DRIVER STATICS INTERFACE
// ===========================================
export interface IDriverStatics extends mongoose.Model<IDriver> {
  findNearby(
    lat: number,
    lng: number,
    radiusKm?: number,
    vehicleType?: string
  ): Promise<IDriver[]>;
}

// ===========================================
// DRIVER INTERFACE
// ===========================================
export interface IDriver extends Document {
  // Methods
  updateLocation(lat: number, lng: number, heading?: number): void;
  goOnline(): void;
  goOffline(): void;
  startRide(): void;
  endRide(): void;
  addEarnings(amount: number): void;

  // Auth
  phone: string;
  email?: string;
  password?: string;

  // Profile
  name: string;
  photoUrl?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';

  // Vehicle
  vehicle: IVehicle;

  // Location
  currentLocation?: IDriverLocation;

  // Status - State Machine
  status: DriverStatus;

  // Verification
  isPhoneVerified: boolean;
  isDocumentsVerified: boolean;
  isBackgroundChecked: boolean;
  documents: IDocument[];

  // Bank Details
  bankDetails?: IBankDetails;

  // Stats
  rating: number;
  totalRides: number;
  totalEarnings: number;
  totalDistanceKm: number;
  totalMinutes: number;
  acceptanceRate: number;
  cancellationRate: number;

  // Earnings (denormalized for performance)
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;

  // Screen
  hasScreen: boolean;
  screenId?: string;
  screenUptime: number; // percentage

  // Referral
  referralCode?: string;
  referredBy?: string;

  // Wallet
  walletBalance: number;
  pendingPayout: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt?: Date;
}

// ===========================================
// DRIVER STATUS ENUM
// ===========================================
export enum DriverStatus {
  OFFLINE = 'offline',
  ONLINE = 'online',
  BUSY = 'busy', // Temporarily unavailable
  RIDING = 'riding', // On active ride
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

// ===========================================
// DRIVER SCHEMA
// ===========================================
const VehicleSchema = new Schema({
  type: { type: String, enum: ['auto', 'cab', 'suv', 'bike', 'bus'], required: true },
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number },
  color: { type: String, required: true },
  plate: { type: String, required: true, uppercase: true },
  rcNumber: { type: String, required: true },
  insuranceNumber: String,
  insuranceExpiry: Date,
  permitNumber: String,
  permitExpiry: Date,
}, { _id: false });

const BankDetailsSchema = new Schema({
  accountNumber: { type: String, required: true },
  ifsc: { type: String, required: true },
  accountHolderName: { type: String, required: true },
  upiId: String,
}, { _id: false });

const DocumentSchema = new Schema({
  type: { type: String, enum: ['dl', 'rc', 'insurance', 'permit', 'aadhar', 'pan'], required: true },
  number: { type: String, required: true },
  imageUrl: { type: String, required: true },
  verified: { type: Boolean, default: false },
  verifiedAt: Date,
  expiry: Date,
}, { _id: false });

const DriverLocationSchema = new Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  heading: Number,
  speed: Number,
  accuracy: Number,
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

const DriverSchema = new Schema<IDriver>({
  // Auth
  phone: { type: String, required: true, unique: true, index: true },
  email: { type: String, sparse: true },
  password: { type: String, select: false },

  // Profile
  name: { type: String, required: true },
  photoUrl: String,
  dateOfBirth: Date,
  gender: { type: String, enum: ['male', 'female', 'other'] },

  // Vehicle
  vehicle: { type: VehicleSchema, required: true },

  // Location
  currentLocation: { type: DriverLocationSchema },

  // Status
  status: {
    type: String,
    enum: Object.values(DriverStatus),
    default: DriverStatus.PENDING_VERIFICATION,
    index: true
  },

  // Verification
  isPhoneVerified: { type: Boolean, default: false },
  isDocumentsVerified: { type: Boolean, default: false },
  isBackgroundChecked: { type: Boolean, default: false },
  documents: [DocumentSchema],

  // Bank Details
  bankDetails: BankDetailsSchema,

  // Stats
  rating: { type: Number, default: 5, min: 1, max: 5 },
  totalRides: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  totalDistanceKm: { type: Number, default: 0 },
  totalMinutes: { type: Number, default: 0 },
  acceptanceRate: { type: Number, default: 100 },
  cancellationRate: { type: Number, default: 0 },

  // Earnings (denormalized)
  todayEarnings: { type: Number, default: 0 },
  weekEarnings: { type: Number, default: 0 },
  monthEarnings: { type: Number, default: 0 },

  // Screen
  hasScreen: { type: Boolean, default: false },
  screenId: String,
  screenUptime: { type: Number, default: 100 },

  // Referral
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: String,

  // Wallet
  walletBalance: { type: Number, default: 0 },
  pendingPayout: { type: Number, default: 0 },

  // Timestamps
  lastActiveAt: Date,
}, {
  timestamps: true,
});

// ===========================================
// INDEXES
// ===========================================
DriverSchema.index({ status: 1, 'currentLocation.lat': 1, 'currentLocation.lng': 1 });
DriverSchema.index({ 'vehicle.type': 1, status: 1 });
DriverSchema.index({ rating: -1 });
DriverSchema.index({ createdAt: -1 });

// ===========================================
// VIRTUALS
// ===========================================
DriverSchema.virtual('isOnline').get(function() {
  return this.status === DriverStatus.ONLINE;
});

DriverSchema.virtual('canAcceptRides').get(function() {
  return this.status === DriverStatus.ONLINE && this.isDocumentsVerified;
});

// ===========================================
// METHODS
// ===========================================
DriverSchema.methods.updateLocation = function(lat: number, lng: number, heading?: number) {
  this.currentLocation = {
    lat,
    lng,
    heading,
    updatedAt: new Date(),
  };
  this.lastActiveAt = new Date();
};

DriverSchema.methods.goOnline = function() {
  if (this.status === DriverStatus.OFFLINE || this.status === DriverStatus.BUSY) {
    this.status = DriverStatus.ONLINE;
    this.lastActiveAt = new Date();
  }
};

DriverSchema.methods.goOffline = function() {
  this.status = DriverStatus.OFFLINE;
};

DriverSchema.methods.startRide = function() {
  this.status = DriverStatus.RIDING;
};

DriverSchema.methods.endRide = function() {
  this.status = DriverStatus.ONLINE;
};

DriverSchema.methods.addEarnings = function(amount: number) {
  this.walletBalance += amount;
  this.totalEarnings += amount;
  this.todayEarnings += amount;
  this.weekEarnings += amount;
  this.monthEarnings += amount;
};

// ===========================================
// STATICS
// ===========================================
DriverSchema.statics.findNearby = async function(
  lat: number,
  lng: number,
  radiusKm: number = 5,
  vehicleType?: string
) {
  const query: any = {
    status: DriverStatus.ONLINE,
    isDocumentsVerified: true,
    'currentLocation': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        $maxDistance: radiusKm * 1000, // Convert km to meters
      },
    },
  };

  if (vehicleType) {
    query['vehicle.type'] = vehicleType;
  }

  return this.find(query);
};

// Extend Model with statics
export interface DriverModel extends mongoose.Model<IDriver>, IDriverStatics {}

// Export the model with proper typing
export const Driver = mongoose.model<IDriver, DriverModel>('Driver', DriverSchema);

// Type alias for TypeScript - use this for type annotations
export type Driver = IDriver;
