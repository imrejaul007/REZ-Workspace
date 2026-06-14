/**
 * REZ Go Product Timeline Model
 *
 * Tracks product history for:
 * - Price history
 * - Cashback history
 * - Purchase frequency
 * - Price predictions
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IProductPricePoint extends Document {
  productId: string;
  barcode: string;
  storeId: string;
  price: number;
  mrp: number;
  cashback: number;
  timestamp: Date;
}

export interface IProductPurchase extends Document {
  purchaseId: string;
  userId: string;
  productId: string;
  barcode: string;
  storeId: string;
  sessionId: string;
  price: number;
  mrp: number;
  cashbackEarned: number;
  cashbackPercent: number;
  quantity: number;
  total: number;
  timestamp: Date;
}

export interface IProductInsight extends Document {
  productId: string;
  barcode: string;
  userId?: string; // Optional for global insights

  // Price insights
  lowestPrice: number;
  lowestPriceDate: Date;
  highestPrice: number;
  highestPriceDate: Date;
  averagePrice: number;
  priceTrend: 'increasing' | 'decreasing' | 'stable';

  // Purchase insights
  purchaseCount: number;
  totalSpent: number;
  totalCashback: number;
  favoriteStore: string;

  // Timing insights
  bestTimeToBuy: {
    dayOfWeek: number; // 0-6
    timeOfDay: string; // "HH:MM"
    averageCashback: number;
  };

  // Price prediction
  predictedPriceNextMonth: number;
  priceConfidence: number;

  updatedAt: Date;
}

const PricePointSchema = new Schema<IProductPricePoint>({
  productId: { type: String, required: true, index: true },
  barcode: { type: String, required: true, index: true },
  storeId: { type: String, required: true, index: true },
  price: { type: Number, required: true },
  mrp: { type: Number, required: true },
  cashback: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now, index: true },
});

const PurchaseSchema = new Schema<IProductPurchase>({
  purchaseId: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  productId: { type: String, required: true, index: true },
  barcode: { type: String, required: true, index: true },
  storeId: { type: String, required: true, index: true },
  sessionId: { type: String, required: true },
  price: { type: Number, required: true },
  mrp: { type: Number, required: true },
  cashbackEarned: { type: Number, default: 0 },
  cashbackPercent: { type: Number, default: 0 },
  quantity: { type: Number, default: 1 },
  total: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
});

const ProductInsightSchema = new Schema<IProductInsight>({
  productId: { type: String, required: true, unique: true, index: true },
  barcode: { type: String, required: true, index: true },
  userId: { type: String, sparse: true, index: true },

  lowestPrice: { type: Number },
  lowestPriceDate: { type: Date },
  highestPrice: { type: Number },
  highestPriceDate: { type: Date },
  averagePrice: { type: Number },
  priceTrend: { type: String, enum: ['increasing', 'decreasing', 'stable'], default: 'stable' },

  purchaseCount: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  totalCashback: { type: Number, default: 0 },
  favoriteStore: { type: String },

  bestTimeToBuy: {
    dayOfWeek: Number,
    timeOfDay: String,
    averageCashback: Number,
  },

  predictedPriceNextMonth: Number,
  priceConfidence: Number,
}, { timestamps: true });

// Indexes
PricePointSchema.index({ productId: 1, storeId: 1, timestamp: -1 });
PurchaseSchema.index({ userId: 1, timestamp: -1 });
PurchaseSchema.index({ productId: 1, userId: 1 });
ProductInsightSchema.index({ productId: 1, userId: 1 });

export const ProductPricePoint = mongoose.model<IProductPricePoint>('ProductPricePoint', PricePointSchema);
export const ProductPurchase = mongoose.model<IProductPurchase>('ProductPurchase', PurchaseSchema);
export const ProductInsight = mongoose.model<IProductInsight>('ProductInsight', ProductInsightSchema);
