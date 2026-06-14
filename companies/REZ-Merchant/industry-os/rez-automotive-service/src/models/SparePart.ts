import mongoose, { Schema, model, Document } from 'mongoose';
import { ISparePart, PartCategory } from '../types';

export interface SparePartDocument extends Omit<ISparePart, '_id'>, Document {}

const sparePartSchema = new Schema<SparePartDocument>(
  {
    partId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    merchantId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    partNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['engine', 'brake', 'suspension', 'electrical', 'body', 'interior'] as PartCategory[],
      lowercase: true,
      index: true,
    },
    vehicleCompatibility: [{
      type: String,
      uppercase: true,
      trim: true,
    }],
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    minStock: {
      type: Number,
      required: true,
      min: 0,
      default: 5,
    },
    reorderLevel: {
      type: Number,
      required: true,
      min: 0,
      default: 10,
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    supplierId: {
      type: String,
      index: true,
    },
    oem: {
      type: Boolean,
      default: false,
    },
    alternatePartNumber: {
      type: String,
      uppercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        keys: { merchantId: 1, category: 1 },
        name: 'idx_merchant_category',
      },
      {
        keys: { partNumber: 1 },
        name: 'idx_part_number',
      },
      {
        keys: { name: 'text', partNumber: 'text' },
        name: 'idx_text_search',
      },
      {
        keys: { stock: 1, reorderLevel: 1 },
        name: 'idx_stock_levels',
      },
    ],
  }
);

// Pre-save hook to generate partId if not provided
sparePartSchema.pre('save', function (next) {
  if (!this.partId) {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.partId = `SPT-${timestamp}-${randomStr}`;
  }
  next();
});

// Virtual for profit margin calculation
sparePartSchema.virtual('profitMargin').get(function () {
  if (this.costPrice === 0) return 100;
  return ((this.sellingPrice - this.costPrice) / this.sellingPrice) * 100;
});

// Virtual to check if reorder is needed
sparePartSchema.virtual('needsReorder').get(function () {
  return this.stock <= this.reorderLevel;
});

// Virtual to check if below minimum stock
sparePartSchema.virtual('belowMinStock').get(function () {
  return this.stock < this.minStock;
});

// Method to reserve stock (for orders)
sparePartSchema.methods.reserveStock = async function (quantity: number): Promise<boolean> {
  if (this.stock < quantity) {
    return false;
  }
  this.stock -= quantity;
  await this.save();
  return true;
};

// Method to release reserved stock
sparePartSchema.methods.releaseStock = async function (quantity: number): Promise<void> {
  this.stock += quantity;
  await this.save();
};

// Static method to get low stock alerts
sparePartSchema.statics.getLowStockAlerts = function (merchantId?: string) {
  const query = merchantId ? { merchantId } : {};
  return this.find({
    ...query,
    $expr: { $lte: ['$stock', '$reorderLevel'] },
  }).sort({ stock: 1 }).select('-__v -_id');
};

// Static method to get out of stock parts
sparePartSchema.statics.getOutOfStock = function (merchantId?: string) {
  const query = merchantId ? { merchantId } : {};
  return this.find({ ...query, stock: 0 }).select('-__v -_id');
};

// Static method to get parts by category
sparePartSchema.statics.getByCategory = function (category: PartCategory, merchantId: string) {
  return this.find({ merchantId, category }).sort({ name: 1 }).select('-__v -_id');
};

// Static method to get inventory value
sparePartSchema.statics.getInventoryValue = async function (merchantId: string): Promise<{
  totalParts: number;
  totalValue: number;
  categoryBreakdown: Record<string, { count: number; value: number }>;
}> {
  const parts = await this.find({ merchantId });

  const categoryBreakdown: Record<string, { count: number; value: number }> = {};
  let totalValue = 0;

  for (const part of parts) {
    if (!categoryBreakdown[part.category]) {
      categoryBreakdown[part.category] = { count: 0, value: 0 };
    }
    categoryBreakdown[part.category].count += part.stock;
    categoryBreakdown[part.category].value += part.stock * part.costPrice;
    totalValue += part.stock * part.costPrice;
  }

  return {
    totalParts: parts.length,
    totalValue,
    categoryBreakdown,
  };
};

// Ensure virtuals are included in JSON output
sparePartSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const SparePart = model<SparePartDocument>('SparePart', sparePartSchema);