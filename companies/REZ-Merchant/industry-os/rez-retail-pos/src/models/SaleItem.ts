import mongoose, { Document, Schema } from 'mongoose';

export interface ISaleItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  hsnCode: string;
  taxRate: number;
  taxAmount: number;
  total: number;
  returnedQuantity?: number;
}

export const SaleItemSchema = new Schema<ISaleItem>({
  productId: { type: String, required: true },
  sku: { type: String, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  hsnCode: { type: String, required: true },
  taxRate: { type: Number, required: true, min: 0 },
  taxAmount: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  returnedQuantity: { type: Number, default: 0, min: 0 }
}, { _id: false });

export interface ISale extends Document {
  merchantId: string;
  storeId: string;
  items: ISaleItem[];
  subtotal: number;
  tax: {
    cgst: number;
    sgst: number;
    igst: number;
  };
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'upi' | 'card' | 'wallet' | 'mixed';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'partial';
  customerId?: string;
  receiptNumber: string;
  invoiceNumber: string;
  gstin?: string;
  createdAt: Date;
  updatedAt: Date;
  voidedAt?: Date;
  voidReason?: string;
}

const TaxSchema = new Schema({
  cgst: { type: Number, required: true, default: 0 },
  sgst: { type: Number, required: true, default: 0 },
  igst: { type: Number, required: true, default: 0 }
}, { _id: false });

export const SaleSchema = new Schema<ISale>({
  merchantId: { type: String, required: true, index: true },
  storeId: { type: String, required: true, index: true },
  items: { type: [SaleItemSchema], required: true },
  subtotal: { type: Number, required: true, min: 0 },
  tax: { type: TaxSchema, required: true },
  discount: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  paymentMethod: {
    type: String,
    enum: ['cash', 'upi', 'card', 'wallet', 'mixed'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'partial'],
    default: 'pending',
    index: true
  },
  customerId: { type: String, index: true },
  receiptNumber: { type: String, required: true, unique: true },
  invoiceNumber: { type: String, required: true, unique: true },
  gstin: { type: String },
  voidedAt: { type: Date },
  voidReason: { type: String }
}, {
  timestamps: true,
  indexes: [
    { createdAt: -1 },
    { receiptNumber: 1 },
    { invoiceNumber: 1 }
  ]
});

export const Sale = mongoose.model<ISale>('Sale', SaleSchema);
