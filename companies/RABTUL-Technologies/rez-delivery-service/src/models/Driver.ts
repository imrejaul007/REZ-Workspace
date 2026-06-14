import mongoose, { Schema, Document } from 'mongoose';
import { IDriver, DriverStatus, GeoLocation, DriverStatus as DriverStatusEnum } from '../types';

export interface DriverDocument extends Omit<IDriver, '_id'>, Document {}

const GeoLocationSchema = new Schema<GeoLocation>(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    address: { type: String },
    timestamp: { type: Date }
  },
  { _id: false }
);

const VehicleSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['motorcycle', 'car', 'van', 'truck'],
      required: true
    },
    licensePlate: { type: String, required: true },
    model: { type: String },
    color: { type: String }
  },
  { _id: false }
);

const AvailabilitySchema = new Schema(
  {
    isAvailable: { type: Boolean, default: true },
    maxRadius: { type: Number, default: 10 },
    workingHours: {
      start: { type: String, default: '08:00' },
      end: { type: String, default: '20:00' }
    }
  },
  { _id: false }
);

const DriverSchema = new Schema<DriverDocument>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(DriverStatus),
      default: DriverStatus.AVAILABLE,
      index: true
    },
    currentLocation: { type: GeoLocationSchema },
    vehicle: {
      type: VehicleSchema,
      required: true
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5
    },
    totalDeliveries: {
      type: Number,
      default: 0
    },
    completedDeliveries: {
      type: Number,
      default: 0
    },
    failedDeliveries: {
      type: Number,
      default: 0
    },
    currentDeliveryId: {
      type: String,
      sparse: true,
      index: true
    },
    availability: {
      type: AvailabilitySchema,
      default: () => ({})
    }
  },
  {
    timestamps: true,
    collection: 'drivers'
  }
);

DriverSchema.index({ status: 1, 'availability.isAvailable': 1 });
DriverSchema.index({ 'currentLocation.latitude': 1, 'currentLocation.longitude': 1 });

DriverSchema.methods.updateLocation = function (location: GeoLocation): void {
  this.currentLocation = {
    ...location,
    timestamp: new Date()
  };
};

DriverSchema.methods.setStatus = function (status: DriverStatus): void {
  this.status = status;
  if (status === DriverStatus.BUSY) {
    this.availability.isAvailable = false;
  } else if (status === DriverStatus.AVAILABLE) {
    this.availability.isAvailable = true;
  }
};

DriverSchema.methods.incrementCompletedDeliveries = function (): void {
  this.completedDeliveries += 1;
  this.totalDeliveries += 1;
};

DriverSchema.methods.incrementFailedDeliveries = function (): void {
  this.failedDeliveries += 1;
  this.totalDeliveries += 1;
};

DriverSchema.methods.assignDelivery = function (deliveryId: string): void {
  this.currentDeliveryId = deliveryId;
  this.status = DriverStatus.BUSY;
  this.availability.isAvailable = false;
};

DriverSchema.methods.completeDelivery = function (): void {
  this.currentDeliveryId = undefined;
  this.status = DriverStatus.AVAILABLE;
  this.availability.isAvailable = true;
  this.incrementCompletedDeliveries();
};

DriverSchema.methods.cancelDelivery = function (): void {
  this.currentDeliveryId = undefined;
  this.status = DriverStatus.AVAILABLE;
  this.availability.isAvailable = true;
  this.incrementFailedDeliveries();
};

DriverSchema.statics.findAvailableDrivers = function (
  location?: GeoLocation,
  maxDistance?: number
): Promise<DriverDocument[]> {
  const query: unknown = {
    status: DriverStatus.AVAILABLE,
    'availability.isAvailable': true
  };

  if (location && maxDistance) {
    const latDelta = maxDistance / 111;
    const lonDelta = maxDistance / (111 * Math.cos((location.latitude * Math.PI) / 180));

    query['currentLocation.latitude'] = {
      $gte: location.latitude - latDelta,
      $lte: location.latitude + latDelta
    };
    query['currentLocation.longitude'] = {
      $gte: location.longitude - lonDelta,
      $lte: location.longitude + lonDelta
    };
  }

  return this.find(query).sort({ rating: -1 }).exec();
};

export const Driver = mongoose.model<DriverDocument>('Driver', DriverSchema);
export default Driver;
