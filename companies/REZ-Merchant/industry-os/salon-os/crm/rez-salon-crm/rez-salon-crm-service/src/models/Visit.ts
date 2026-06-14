/**
 * Visit Model - Customer visit history
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IVisit extends Document {
  visitId: string;
  customerId: string;
  salonId: string;
  appointmentId?: string;
  stylistId?: string;
  services: Array<{
    serviceId: string;
    name: string;
    price: number;
  }>;
  products: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  paymentMethod?: 'cash' | 'card' | 'upi' | 'wallet' | 'mixed';
  rating?: number;
  feedback?: string;
  visitDate: string;
  createdAt: Date;
}

const VisitSchema = new Schema<IVisit>({
  visitId: { type: String, required: true, unique: true, index: true },
  customerId: { type: String, required: true, index: true },
  salonId: { type: String, required: true, index: true },
  appointmentId: String,
  stylistId: { type: String, index: true },
  services: [{
    serviceId: String,
    name: String,
    price: Number,
  }],
  products: [{
    productId: String,
    name: String,
    price: Number,
    quantity: { type: Number, default: 1 },
  }],
  totalAmount: { type: Number, default: 0 },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'wallet', 'mixed'],
  },
  rating: { type: Number, min: 1, max: 5 },
  feedback: String,
  visitDate: { type: String, required: true, index: true },
}, { timestamps: true });

VisitSchema.index({ customerId: 1, visitDate: -1 });
VisitSchema.index({ salonId: 1, visitDate: -1 });

export const Visit = mongoose.model<IVisit>('Visit', VisitSchema);
