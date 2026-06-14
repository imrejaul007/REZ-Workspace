import mongoose, { Schema, Document } from 'mongoose';
import { Driver as IDriver } from '../types';

export interface DriverDocument extends Omit<IDriver, '_id'>, Document {}

const DriverSchema = new Schema<DriverDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
    vehicleType: { type: String, required: true },
    licenseNumber: { type: String, required: true },
    status: {
      type: String,
      enum: ['available', 'busy', 'offline'],
      default: 'available',
      index: true
    },
    currentLocation: {
      lat: Number,
      lng: Number
    },
    rating: { type: Number, default: 0, min: 0, max: 5 }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => { ret.id = ret._id.toString(); delete ret.__v; return ret; }
    }
  }
);

DriverSchema.statics.findAvailable = function() {
  return this.find({ status: 'available' });
};

export const DriverModel = mongoose.model<DriverDocument>('Driver', DriverSchema);
