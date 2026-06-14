import mongoose, { Schema, Document } from 'mongoose';

export interface IDriverLocation extends Document {
  driverId: string;
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  updatedAt: Date;
}

const DriverLocationSchema = new Schema({
  driverId: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  heading: { type: Number },
  speed: { type: Number },
  updatedAt: { type: Date, default: Date.now },
});

// Unique index on driverId for upsert operations
DriverLocationSchema.index({ driverId: 1 }, { unique: true });
// TTL index - auto-delete after 1 hour of inactivity
DriverLocationSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 3600 });

export const DriverLocation = mongoose.models.DriverLocation ||
  mongoose.model<IDriverLocation>('DriverLocation', DriverLocationSchema);
