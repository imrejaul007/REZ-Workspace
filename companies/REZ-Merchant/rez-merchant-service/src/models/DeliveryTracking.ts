/**
 * Delivery Tracking Model
 *
 * Tracks delivery status and details for restaurant orders.
 * Supports driver assignment, real-time location updates, and proof of delivery.
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

// Valid delivery statuses
export const DELIVERY_STATUS_VALUES = [
  'pending',
  'assigned',
  'picked_up',
  'in_transit',
  'delivered',
  'cancelled',
] as const;

export type DeliveryStatus = (typeof DELIVERY_STATUS_VALUES)[number];

/**
 * Location interface for driver/delivery tracking
 */
export interface ILocation {
  lat: number;
  lng: number;
}

/**
 * Delivery interface representing a delivery tracking document
 */
export interface IDelivery extends Document {
  orderId: Types.ObjectId;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  status: DeliveryStatus;
  pickupTime?: Date;
  deliveryTime?: Date;
  estimatedTime?: Date;
  actualTime?: Date;
  location?: ILocation;
  proofOfDelivery?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Delivery schema definition
 */
const DeliveryTrackingSchema = new Schema<IDelivery>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    driverId: {
      type: String,
      default: undefined,
    },
    driverName: {
      type: String,
      default: undefined,
    },
    driverPhone: {
      type: String,
      default: undefined,
    },
    status: {
      type: String,
      enum: DELIVERY_STATUS_VALUES,
      default: 'pending',
      required: true,
    },
    pickupTime: {
      type: Date,
      default: undefined,
    },
    deliveryTime: {
      type: Date,
      default: undefined,
    },
    estimatedTime: {
      type: Date,
      default: undefined,
    },
    actualTime: {
      type: Date,
      default: undefined,
    },
    location: {
      lat: { type: Number, default: undefined },
      lng: { type: Number, default: undefined },
    },
    proofOfDelivery: {
      type: String,
      default: undefined,
    },
  },
  { timestamps: true, strict: true, strictQuery: true },
);

// Indexes for efficient queries
DeliveryTrackingSchema.index({ orderId: 1 }, { unique: true });
DeliveryTrackingSchema.index({ driverId: 1, status: 1 });
DeliveryTrackingSchema.index({ status: 1, createdAt: -1 });

export const Delivery = mongoose.model<IDelivery>('Delivery', DeliveryTrackingSchema);
