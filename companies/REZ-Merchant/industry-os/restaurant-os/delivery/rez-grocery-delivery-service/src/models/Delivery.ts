import mongoose, { Schema, Document } from 'mongoose';
import { Delivery as IDelivery, DeliveryStatus } from '../types';

export interface DeliveryDocument extends Omit<IDelivery, '_id'>, Document {}

const DeliverySchema = new Schema<DeliveryDocument>(
  {
    deliveryId: { type: String, required: true, unique: true, index: true },
    orderId: { type: String, required: true, index: true },
    customerId: { type: String, required: true, index: true },
    driverId: { type: String, index: true },
    pickupAddress: { type: String, required: true },
    deliveryAddress: { type: String, required: true },
    items: [{ productId: String, name: String, quantity: Number }],
    status: {
      type: String,
      enum: ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
      default: 'pending',
      index: true
    },
    scheduledTime: { type: Date, required: true },
    pickedUpAt: { type: Date },
    deliveredAt: { type: Date }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => { ret.id = ret._id.toString(); delete ret.__v; return ret; }
    }
  }
);

DeliverySchema.index({ status: 1, scheduledTime: 1 });
DeliverySchema.index({ driverId: 1, status: 1 });

export const DeliveryModel = mongoose.model<DeliveryDocument>('Delivery', DeliverySchema);
