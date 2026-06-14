import mongoose, { Schema, Document } from 'mongoose';

export type DeliveryStatus = 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';

export interface IDelivery extends Document {
  deliveryId: string;
  orderId: string;
  pickup: { lat: number; lng: number; address?: string };
  dropoff: { lat: number; lng: number; address?: string };
  driverId?: string;
  status: DeliveryStatus;
  eta?: number;
  history: Array<{
    status: string;
    timestamp: Date;
    location?: { lat: number; lng: number };
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const DeliverySchema = new Schema({
  deliveryId: { type: String, required: true },
  orderId: { type: String, required: true, index: true },
  pickup: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: String,
  },
  dropoff: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: String,
  },
  driverId: { type: String, index: true },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending',
  },
  eta: Number,
  history: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    location: {
      lat: Number,
      lng: Number,
    },
  }],
}, { timestamps: true });

// Unique index on deliveryId
DeliverySchema.index({ deliveryId: 1 }, { unique: true });

export const Delivery = mongoose.models.Delivery ||
  mongoose.model<IDelivery>('Delivery', DeliverySchema);
