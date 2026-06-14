import mongoose, { Schema, Document } from 'mongoose';

export enum TrackingEventType {
  ORDER_CREATED = 'order_created',
  ORDER_CONFIRMED = 'order_confirmed',
  ORDER_PREPARING = 'order_preparing',
  ORDER_READY = 'order_ready',
  DRIVER_ASSIGNED = 'driver_assigned',
  DRIVER_EN_ROUTE_PICKUP = 'driver_en_route_pickup',
  DRIVER_ARRIVED_PICKUP = 'driver_arrived_pickup',
  ORDER_PICKED_UP = 'order_picked_up',
  ORDER_IN_TRANSIT = 'order_in_transit',
  DRIVER_ARRIVED_DROPOFF = 'driver_arrived_dropoff',
  DELIVERY_COMPLETED = 'delivery_completed',
  DELIVERY_CANCELLED = 'delivery_cancelled',
}

export interface ITracking extends Document {
  trackingId: string;
  orderId: string;
  driverId?: string;
  events: {
    type: TrackingEventType;
    timestamp: Date;
    location?: {
      lat: number;
      lng: number;
    };
    note?: string;
  }[];
  currentLocation?: {
    lat: number;
    lng: number;
    updatedAt: Date;
  };
  estimatedArrival?: Date;
  distanceRemaining?: number; // in km
  etaSeconds?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TrackingSchema = new Schema<ITracking>(
  {
    trackingId: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, required: true, unique: true, index: true },
    driverId: { type: String, index: true },
    events: [
      {
        type: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        location: {
          lat: { type: Number },
          lng: { type: Number },
        },
        note: { type: String },
      },
    ],
    currentLocation: {
      lat: { type: Number },
      lng: { type: Number },
      updatedAt: { type: Date },
    },
    estimatedArrival: { type: Date },
    distanceRemaining: { type: Number },
    etaSeconds: { type: Number },
  },
  { timestamps: true }
);

TrackingSchema.index({ orderId: 1 });
TrackingSchema.index({ updatedAt: -1 });

export const Tracking = mongoose.model<ITracking>('Tracking', TrackingSchema);
