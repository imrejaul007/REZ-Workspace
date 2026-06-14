/**
 * Healthcare Billing Model
 */
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IHealthcareBill extends Document {
  patientId: Types.ObjectId;
  storeId: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  gst: number;
  discount: number;
  total: number;
  insuranceClaim?: {
    provider: string;
    claimNumber: string;
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
  };
  payments: {
    method: string;
    amount: number;
    reference?: string;
    date: Date;
  }[];
  status: 'pending' | 'partial' | 'paid' | 'cancelled';
  dueDate?: Date;
  createdAt: Date;
}

const HealthcareBillSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  appointmentId: { type: Schema.Types.ObjectId },
  items: [{
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true }
  }],
  subtotal: { type: Number, required: true },
  gst: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  insuranceClaim: {
    provider: String,
    claimNumber: String,
    amount: Number,
    status: { type: String, enum: ['pending', 'approved', 'rejected'] }
  },
  payments: [{
    method: String,
    amount: Number,
    reference: String,
    date: Date
  }],
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'cancelled'],
    default: 'pending'
  },
  dueDate: Date
}, { timestamps: true });

HealthcareBillSchema.index({ patientId: 1, status: 1 });

export const HealthcareBill = mongoose.model<IHealthcareBill>('HealthcareBill', HealthcareBillSchema);
