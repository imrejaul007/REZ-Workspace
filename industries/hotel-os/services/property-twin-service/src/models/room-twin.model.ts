import mongoose, { Document, Schema } from 'mongoose';

// IoT device state
export interface IIoTDeviceState {
  deviceId: string;
  deviceType: 'thermostat' | 'lighting' | 'blinds' | 'tv' | 'door_lock' | 'minibar' | 'hvac' | 'smart_speaker';
  status: 'on' | 'off' | 'standby';
  settings: Record<string, unknown>;
  lastUpdated: Date;
}

// Room occupancy state
export interface IRoomOccupancy {
  isOccupied: boolean;
  currentGuestId?: string;
  checkIn?: Date;
  checkOut?: Date;
  expectedArrival?: Date;
  lastUpdated: Date;
}

// Room features
export interface IRoomFeatures {
  bedType: 'king' | 'queen' | 'twin' | 'double' | 'suite';
  bedCount: number;
  maxOccupancy: number;
  roomSize: number; // in square meters
  floor: number;
  view: 'city' | 'ocean' | 'garden' | 'pool' | 'mountain' | 'courtyard' | 'none';
  balcony: boolean;
  bathtub: boolean;
  showerType: 'standup' | 'walkin' | 'both';
  amenities: string[];
  accessibility: boolean;
  smoking: boolean;
}

// Room Twin document interface
export interface IRoomTwin extends Document {
  roomId: string;
  propertyId: string;
  roomNumber: string;
  floor: number;
  roomType: string;
  status: 'available' | 'occupied' | 'maintenance' | 'out-of-order' | 'cleaning' | 'inspected';
  occupancy: IRoomOccupancy;
  iotState: IIoTDeviceState[];
  features: IRoomFeatures;
  currentCondition: {
    cleanlinessScore: number; // 1-100
    maintenanceIssues: string[];
    lastInspected: Date;
    nextScheduledMaintenance?: Date;
  };
  pricing: {
    baseRate: number;
    currency: string;
    weekendRate?: number;
    seasonalRates?: {
      name: string;
      startDate: Date;
      endDate: Date;
      multiplier: number;
    }[];
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    lastActivity: Date;
    twinVersion: string;
  };
  tags: string[];
  statusHistory: {
    status: string;
    changedAt: Date;
    changedBy: string;
    reason?: string;
  }[];
}

// Mongoose schema for IoT Device State
const IoTDeviceStateSchema = new Schema<IIoTDeviceState>(
  {
    deviceId: { type: String, required: true },
    deviceType: {
      type: String,
      enum: ['thermostat', 'lighting', 'blinds', 'tv', 'door_lock', 'minibar', 'hvac', 'smart_speaker'],
      required: true,
    },
    status: { type: String, enum: ['on', 'off', 'standby'], default: 'off' },
    settings: { type: Schema.Types.Mixed, default: {} },
    lastUpdated: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Mongoose schema for Room Occupancy
const RoomOccupancySchema = new Schema<IRoomOccupancy>(
  {
    isOccupied: { type: Boolean, default: false },
    currentGuestId: { type: String },
    checkIn: { type: Date },
    checkOut: { type: Date },
    expectedArrival: { type: Date },
    lastUpdated: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Mongoose schema for Room Features
const RoomFeaturesSchema = new Schema<IRoomFeatures>(
  {
    bedType: {
      type: String,
      enum: ['king', 'queen', 'twin', 'double', 'suite'],
      default: 'queen',
    },
    bedCount: { type: Number, default: 1, min: 1 },
    maxOccupancy: { type: Number, default: 2, min: 1 },
    roomSize: { type: Number, default: 25 }, // sq meters
    floor: { type: Number, required: true },
    view: {
      type: String,
      enum: ['city', 'ocean', 'garden', 'pool', 'mountain', 'courtyard', 'none'],
      default: 'none',
    },
    balcony: { type: Boolean, default: false },
    bathtub: { type: Boolean, default: false },
    showerType: { type: String, enum: ['standup', 'walkin', 'both'], default: 'standup' },
    amenities: [{ type: String }],
    accessibility: { type: Boolean, default: false },
    smoking: { type: Boolean, default: false },
  },
  { _id: false }
);

// Mongoose schema for Current Condition
const CurrentConditionSchema = new Schema(
  {
    cleanlinessScore: { type: Number, default: 100, min: 0, max: 100 },
    maintenanceIssues: [{ type: String }],
    lastInspected: { type: Date, default: Date.now },
    nextScheduledMaintenance: { type: Date },
  },
  { _id: false }
);

// Mongoose schema for Room Twin
const RoomTwinSchema = new Schema<IRoomTwin>(
  {
    roomId: { type: String, required: true, unique: true, index: true },
    propertyId: { type: String, required: true, index: true },
    roomNumber: { type: String, required: true },
    floor: { type: Number, required: true },
    roomType: { type: String, required: true },
    status: {
      type: String,
      enum: ['available', 'occupied', 'maintenance', 'out-of-order', 'cleaning', 'inspected'],
      default: 'available',
      index: true,
    },
    occupancy: { type: RoomOccupancySchema, default: () => ({}) },
    iotState: [IoTDeviceStateSchema],
    features: { type: RoomFeaturesSchema, required: true },
    currentCondition: { type: CurrentConditionSchema, default: () => ({}) },
    pricing: {
      baseRate: { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'USD' },
      weekendRate: { type: Number },
      seasonalRates: [
        {
          name: { type: String },
          startDate: { type: Date },
          endDate: { type: Date },
          multiplier: { type: Number },
        },
      ],
    },
    metadata: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
      lastActivity: { type: Date, default: Date.now },
      twinVersion: { type: String, default: '1.0.0' },
    },
    tags: [{ type: String }],
    statusHistory: [
      {
        status: { type: String },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: String },
        reason: { type: String },
      },
    ],
  },
  {
    timestamps: { createdAt: 'metadata.createdAt', updatedAt: 'metadata.updatedAt' },
  }
);

// Indexes
RoomTwinSchema.index({ roomNumber: 1, propertyId: 1 }, { unique: true });
RoomTwinSchema.index({ status: 1, 'occupancy.isOccupied': 1 });
RoomTwinSchema.index({ 'features.bedType': 1 });
RoomTwinSchema.index({ 'features.view': 1 });
RoomTwinSchema.index({ 'features.amenities': 1 });
RoomTwinSchema.index({ 'pricing.baseRate': 1 });
RoomTwinSchema.index({ tags: 1 });
RoomTwinSchema.index({ 'metadata.lastActivity': -1 });

// Compound index for room availability queries
RoomTwinSchema.index({ propertyId: 1, status: 1, floor: 1 });

// Pre-save middleware
RoomTwinSchema.pre('save', function (next) {
  // Track status changes
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      changedBy: 'system',
      reason: 'Status changed via save',
    });
    // Keep only last 50 status history entries
    if (this.statusHistory.length > 50) {
      this.statusHistory = this.statusHistory.slice(-50);
    }
  }

  this.metadata.lastActivity = new Date();
  next();
});

// Instance method to check room availability
RoomTwinSchema.methods.isAvailable = function (): boolean {
  return this.status === 'available' && !this.occupancy.isOccupied;
};

// Instance method to check if room needs maintenance
RoomTwinSchema.methods.needsMaintenance = function (): boolean {
  return (
    this.currentCondition.maintenanceIssues.length > 0 ||
    this.currentCondition.cleanlinessScore < 70
  );
};

// Instance method to get room readiness score
RoomTwinSchema.methods.getReadinessScore = function (): number {
  let score = 100;

  // Deduct for maintenance issues
  score -= this.currentCondition.maintenanceIssues.length * 10;

  // Deduct for low cleanliness
  score -= (100 - this.currentCondition.cleanlinessScore) * 0.5;

  // Deduct for out-of-order status
  if (this.status === 'out-of-order') {
    score = 0;
  }

  return Math.max(0, Math.min(100, score));
};

export const RoomTwin = mongoose.model<IRoomTwin>('RoomTwin', RoomTwinSchema);
