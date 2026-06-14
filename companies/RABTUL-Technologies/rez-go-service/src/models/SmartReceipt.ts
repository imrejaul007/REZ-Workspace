/**
 * REZ Go Smart Receipt Model
 *
 * Searchable receipts with:
 * - Full-text search
 * - Product lookup
 * - Reorder capability
 * - Expiry tracking
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IReceipt extends Document {
  receiptId: string;
  sessionId: string;
  userId: string;
  storeId: string;
  storeName: string;
  merchantId: string;

  // Items
  items: Array<{
    productId: string;
    barcode: string;
    name: string;
    quantity: number;
    price: number;
    mrp: number;
    total: number;
    cashbackEarned: number;
  }>;

  // Totals
  subtotal: number;
  tax: number;
  total: number;
  totalMrp: number;
  totalSavings: number;
  cashbackEarned: number;

  // Payment
  paymentMethod: string;
  paymentId: string;

  // Status
  status: 'completed' | 'refunded' | 'partial_refund';

  // For search
  searchText: string; // Concatenated searchable text
  productNames: string[]; // Array of product names for filtering

  // Expiry tracking
  expiryItems: Array<{
    productId: string;
    name: string;
    expiryDate?: Date;
    warrantyMonths?: number;
    tracked: boolean;
  }>;

  // AI insights
  insights: {
    categoryBreakdown: Record<string, number>;
    topBrands: string[];
    healthScore?: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

const ReceiptItemSchema = new Schema({
  productId: String,
  barcode: String,
  name: String,
  quantity: Number,
  price: Number,
  mrp: Number,
  total: Number,
  cashbackEarned: Number,
}, { _id: false });

const ExpiryItemSchema = new Schema({
  productId: String,
  name: String,
  expiryDate: Date,
  warrantyMonths: Number,
  tracked: { type: Boolean, default: false },
}, { _id: false });

const ReceiptSchema = new Schema<IReceipt>({
  receiptId: { type: String, required: true, unique: true, index: true },
  sessionId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  storeId: { type: String, required: true, index: true },
  storeName: String,
  merchantId: String,

  items: [ReceiptItemSchema],
  subtotal: Number,
  tax: Number,
  total: Number,
  totalMrp: Number,
  totalSavings: Number,
  cashbackEarned: Number,

  paymentMethod: String,
  paymentId: String,

  status: { type: String, enum: ['completed', 'refunded', 'partial_refund'], default: 'completed' },

  searchText: { type: String, index: 'text' },
  productNames: [String],

  expiryItems: [ExpiryItemSchema],

  insights: {
    categoryBreakdown: { type: Map, of: Number },
    topBrands: [String],
    healthScore: Number,
  },
}, { timestamps: true });

// Text search index
ReceiptSchema.index({ searchText: 'text' });
ReceiptSchema.index({ userId: 1, createdAt: -1 });
ReceiptSchema.index({ 'items.barcode': 1 });

export const Receipt = mongoose.model<IReceipt>('Receipt', ReceiptSchema);
