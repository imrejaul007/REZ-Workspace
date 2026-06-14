import mongoose, { Schema, Document } from 'mongoose';

export interface ITrackingEvent extends Document {
  orderId: string;
  driverId?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'in_transit' | 'arriving' | 'delivered' | 'cancelled';
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  timestamp: Date;
  message?: string;
  estimatedDelivery?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TrackingEventSchema = new Schema<ITrackingEvent>(
  {
    orderId: { type: String, required: true, index: true },
    driverId: { type: String, index: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'in_transit', 'arriving', 'delivered', 'cancelled'],
      required: true
    },
    location: {
      lat: Number,
      lng: Number,
      address: String
    },
    timestamp: { type: Date, default: Date.now },
    message: String,
    estimatedDelivery: Date
  },
  { timestamps: true }
);

// Indexes
TrackingEventSchema.index({ orderId: 1, timestamp: -1 });
TrackingEventSchema.index({ driverId: 1 });
TrackingEventSchema.index({ status: 1 });

export const TrackingEvent = mongoose.model<ITrackingEvent>('TrackingEvent', TrackingEventSchema);