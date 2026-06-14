import mongoose, { Schema, Document } from 'mongoose';

export enum DriverStatus {
  AVAILABLE = 'available',
  BUSY = 'busy',
  OFFLINE = 'offline',
  ON_BREAK = 'on_break',
}

export interface IDeliveryPerson extends Document {
  driverId: string;
  name: string;
  phone: string;
  email?: string;
  status: DriverStatus;
  currentLocation?: {
    lat: number;
    lng: number;
    updatedAt: Date;
  };
  vehicleType: 'bicycle' | 'scooter' | 'motorcycle' | 'car';
  vehicleNumber?: string;
  zones: string[];
  rating: number;
  totalDeliveries: number;
  todayDeliveries: number;
  todayEarnings: number;
  totalEarnings: number;
  bankDetails?: {
    accountNumber: string;
    ifsc: string;
    holderName: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryPersonSchema = new Schema<IDeliveryPerson>(
  {
    driverId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String },
    status: {
      type: String,
      enum: Object.values(DriverStatus),
      default: DriverStatus.OFFLINE,
      index: true,
    },
    currentLocation: {
      lat: { type: Number },
      lng: { type: Number },
      updatedAt: { type: Date },
    },
    vehicleType: {
      type: String,
      enum: ['bicycle', 'scooter', 'motorcycle', 'car'],
      default: 'scooter',
    },
    vehicleNumber: { type: String },
    zones: [{ type: String }],
    rating: { type: Number, default: 5.0, min: 0, max: 5 },
    totalDeliveries: { type: Number, default: 0 },
    todayDeliveries: { type: Number, default: 0 },
    todayEarnings: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    bankDetails: {
      accountNumber: { type: String },
      ifsc: { type: String },
      holderName: { type: String },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

DeliveryPersonSchema.index({ currentLocation: '2dsphere' });
DeliveryPersonSchema.index({ status: 1, isActive: 1 });

export const DeliveryPerson = mongoose.model<IDeliveryPerson>('DeliveryPerson', DeliveryPersonSchema);
