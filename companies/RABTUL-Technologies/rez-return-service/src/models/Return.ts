import mongoose, { Schema, Document } from 'mongoose';

export interface IReturnItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  condition: 'sealed' | 'opened' | 'damaged';
}

export interface IReturn extends Document {
  merchantId: string;
  storeId: string;
  originalSaleId: string;
  receiptNumber: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: IReturnItem[];
  reason: string;
  reasonCategory: 'defective' | 'wrong_item' | 'changed_mind' | 'damaged' | 'expired' | 'other';
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  subtotal: number;
  taxAmount: number;
  refundAmount: number;
  refundMethod: 'original' | 'wallet' | 'bank';
  refundStatus: 'pending' | 'initiated' | 'completed' | 'failed';
  refundTransactionId?: string;
  processedBy?: string;
  processedAt?: Date;
  rejectedBy?: string;
  rejectedReason?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReturnItemSchema = new Schema({
  productId: { type: String, required: true },
  sku: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  total: { type: Number, required: true },
  condition: { type: String, enum: ['sealed', 'opened', 'damaged'], default: 'sealed' }
}, { _id: false });

const ReturnSchema = new Schema({
  merchantId: { type: String, required: true, index: true },
  storeId: { type: String, required: true, index: true },
  originalSaleId: { type: String, required: true },
  receiptNumber: { type: String, required: true },
  customerId: { type: String, sparse: true },
  customerName: { type: String },
  customerPhone: { type: String },
  items: [ReturnItemSchema],
  reason: { type: String, required: true },
  reasonCategory: {
    type: String,
    enum: ['defective', 'wrong_item', 'changed_mind', 'damaged', 'expired', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending',
    index: true
  },
  subtotal: { type: Number, required: true },
  taxAmount: { type: Number, default: 0 },
  refundAmount: { type: Number, required: true },
  refundMethod: {
    type: String,
    enum: ['original', 'wallet', 'bank'],
    default: 'original'
  },
  refundStatus: {
    type: String,
    enum: ['pending', 'initiated', 'completed', 'failed'],
    default: 'pending'
  },
  refundTransactionId: String,
  processedBy: String,
  processedAt: Date,
  rejectedBy: String,
  rejectedReason: String,
  notes: String
}, {
  timestamps: true
});

ReturnSchema.index({ receiptNumber: 1 });
ReturnSchema.index({ customerId: 1 });
ReturnSchema.index({ createdAt: -1 });

export const Return = mongoose.model<IReturn>('Return', ReturnSchema);
