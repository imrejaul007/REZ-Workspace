import mongoose, { Schema, Document, Model } from 'mongoose';
import { ProductCost } from '../types';

export interface IProductCostDocument extends Omit<ProductCost, 'createdAt' | 'updatedAt'>, Document {
  _id: mongoose.Types.ObjectId;
}

const ProductCostSchema = new Schema<IProductCostDocument>(
  {
    costId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    productId: {
      type: String,
      required: true,
      index: true,
    },
    supplierId: {
      type: String,
      required: true,
      index: true,
    },
    merchantId: {
      type: String,
      required: true,
      index: true,
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    unit: {
      type: String,
      enum: ['piece', 'kg', 'g', 'l', 'ml', 'dozen', 'pack', 'box', 'case', 'carton'],
      default: 'piece',
    },
    quantityPerUnit: {
      type: Number,
      min: 1,
      default: 1,
    },
    previousCost: Number,
    costChangePercent: Number,
    isCurrent: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: 'lastUpdated', updatedAt: false },
    collection: 'productcosts',
  }
);

// Compound indexes
ProductCostSchema.index({ productId: 1, supplierId: 1, merchantId: 1 });
ProductCostSchema.index({ productId: 1, isCurrent: 1 });
ProductCostSchema.index({ merchantId: 1, isCurrent: 1 });
ProductCostSchema.index({ costChangePercent: 1 });

// Static method to get current cost for a product
ProductCostSchema.statics.getCurrentCost = async function (
  productId: string,
  supplierId: string,
  merchantId: string
): Promise<IProductCostDocument | null> {
  return this.findOne({ productId, supplierId, merchantId, isCurrent: true }).sort({ lastUpdated: -1 }).exec();
};

// Static method to get all current costs for a merchant
ProductCostSchema.statics.getAllCurrentCosts = async function (
  merchantId: string
): Promise<IProductCostDocument[]> {
  return this.find({ merchantId, isCurrent: true }).sort({ productId: 1 }).exec();
};

// Static method to get cost history for a product
ProductCostSchema.statics.getCostHistory = async function (
  productId: string,
  supplierId: string,
  merchantId: string,
  limit: number = 30
): Promise<IProductCostDocument[]> {
  return this.find({ productId, supplierId, merchantId })
    .sort({ lastUpdated: -1 })
    .limit(limit)
    .exec();
};

// Static method to update cost and mark previous as non-current
ProductCostSchema.statics.updateCost = async function (
  productId: string,
  supplierId: string,
  merchantId: string,
  newCost: number
): Promise<{ previousCost: number | null; changePercent: number | null }> {
  const current = await this.findOne({ productId, supplierId, merchantId, isCurrent: true });

  // Mark all existing costs as non-current
  await this.updateMany(
    { productId, supplierId, merchantId },
    { $set: { isCurrent: false } }
  );

  // Create new cost entry
  const previousCost = current?.costPrice ?? null;
  const changePercent = previousCost ? ((newCost - previousCost) / previousCost) * 100 : null;

  await this.create({
    // FIX (security): Replaced Math.random() with crypto.randomUUID()
    costId: (() => {
      try {
        const { randomUUID } = require('crypto');
        return `cost_${Date.now()}_${randomUUID().replace(/-/g, '').substring(0, 9)}`;
      } catch {
        return `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
    })(),
    productId,
    supplierId,
    merchantId,
    costPrice: newCost,
    isCurrent: true,
    previousCost,
    costChangePercent: changePercent,
  });

  return { previousCost, changePercent };
};

// Static method to find products with significant cost changes
ProductCostSchema.statics.findSignificantChanges = async function (
  merchantId: string,
  thresholdPercent: number = 5
): Promise<IProductCostDocument[]> {
  return this.find({
    merchantId,
    isCurrent: true,
    costChangePercent: { $ne: null },
    $or: [
      { costChangePercent: { $gte: thresholdPercent } },
      { costChangePercent: { $lte: -thresholdPercent } },
    ],
  })
    .sort({ costChangePercent: -1 })
    .exec();
};

// Static method to get products with increased costs (for alerts)
ProductCostSchema.statics.findCostIncreases = async function (
  merchantId: string,
  minPercent: number = 5
): Promise<IProductCostDocument[]> {
  return this.find({
    merchantId,
    isCurrent: true,
    costChangePercent: { $gte: minPercent },
  })
    .sort({ costChangePercent: -1 })
    .exec();
};

export const ProductCostModel: Model<IProductCostDocument> = mongoose.model<IProductCostDocument>('ProductCost', ProductCostSchema);
