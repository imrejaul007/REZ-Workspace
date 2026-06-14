/**
 * Lab Order Model
 */
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILabOrder extends Document {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  storeId: Types.ObjectId;
  labPartner?: string;
  tests: {
    code: string;
    name: string;
    price: number;
  }[];
  status: 'ordered' | 'sample_collected' | 'processing' | 'ready' | 'delivered';
  results?: {
    testCode: string;
    testName: string;
    value: string;
    unit: string;
    referenceRange: string;
    status: 'normal' | 'high' | 'low';
  }[];
  reportUrl?: string;
  orderedAt: Date;
  reportAt?: Date;
  createdAt: Date;
}

const LabOrderSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'MerchantUser', required: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
  labPartner: String,
  tests: [{
    code: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true }
  }],
  status: {
    type: String,
    enum: ['ordered', 'sample_collected', 'processing', 'ready', 'delivered'],
    default: 'ordered'
  },
  results: [{
    testCode: String,
    testName: String,
    value: String,
    unit: String,
    referenceRange: String,
    status: { type: String, enum: ['normal', 'high', 'low'] }
  }],
  reportUrl: String,
  orderedAt: { type: Date, default: Date.now },
  reportAt: Date
}, { timestamps: true });

LabOrderSchema.index({ patientId: 1, status: 1 });

export const LabOrder = mongoose.model<ILabOrder>('LabOrder', LabOrderSchema);
