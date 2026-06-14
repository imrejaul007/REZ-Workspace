import mongoose, { Schema, Document } from 'mongoose';

export interface IDriver extends Document {
  userId: string;
  name: string;
  phone: string;
  email?: string;
  vehicle: {
    type: 'bike' | 'scooter' | 'car';
    plateNumber: string;
    model?: string;
  };
  status: 'available' | 'busy' | 'offline';
  currentLocation?: {
    lat: number;
    lng: number;
    updatedAt: Date;
  };
  rating: number;
  totalDeliveries: number;
  earnings: {
    today: number;
    week: number;
    month: number;
  };
  documents: {
    license: string;
    rcBook: string;
    insurance: string;
  };
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DriverSchema = new Schema<IDriver>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String },
    vehicle: {
      type: {
        type: String,
        enum: ['bike', 'scooter', 'car'],
        required: true
      },
      plateNumber: { type: String, required: true },
      model: { type: String }
    },
    status: {
      type: String,
      enum: ['available', 'busy', 'offline'],
      default: 'offline'
    },
    currentLocation: {
      lat: Number,
      lng: Number,
      updatedAt: Date
    },
    rating: { type: Number, default: 5.0, min: 0, max: 5 },
    totalDeliveries: { type: Number, default: 0 },
    earnings: {
      today: { type: Number, default: 0 },
      week: { type: Number, default: 0 },
      month: { type: Number, default: 0 }
    },
    documents: {
      license: { type: String, required: true },
      rcBook: { type: String, required: true },
      insurance: { type: String, required: true }
    },
    verified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Indexes
DriverSchema.index({ 'currentLocation.lat': 1, 'currentLocation.lng': 1 });
DriverSchema.index({ status: 1 });
DriverSchema.index({ rating: -1 });

export const Driver = mongoose.model<IDriver>('Driver', DriverSchema);