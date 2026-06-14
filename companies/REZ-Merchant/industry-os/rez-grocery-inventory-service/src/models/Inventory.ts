import mongoose, { Schema, Document } from 'mongoose';
import { Inventory as IInventory } from '../types';

export interface InventoryDocument extends Omit<IInventory, '_id'>, Document {}

const InventorySchema = new Schema<InventoryDocument>(
  {
    productId: { type: String, required: true, index: true },
    productName: { type: String, required: true },
    sku: { type: String, required: true, unique: true, uppercase: true, index: true },
    category: { type: String, required: true, index: true },
    quantity: { type: Number, required: true, default: 0, min: 0 },
    unit: { type: String, required: true },
    minStockLevel: { type: Number, default: 10, min: 0 },
    maxStockLevel: { type: Number, default: 100, min: 0 },
    costPrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    supplierId: { type: String, index: true },
    expiryDate: { type: Date },
    batchNumber: { type: String },
    location: { type: String, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active', index: true }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => { ret.id = ret._id.toString(); delete ret.__v; return ret; }
    }
  }
);

InventorySchema.index({ category: 1, status: 1 });
InventorySchema.index({ expiryDate: 1 });

InventorySchema.virtual('isLowStock').get(function() { return this.quantity <= this.minStockLevel; });
InventorySchema.virtual('isOutOfStock').get(function() { return this.quantity === 0; });
InventorySchema.set('toJSON', { virtuals: true });

InventorySchema.statics.findLowStock = function() {
  return this.find({ $expr: { $lte: ['$quantity', '$minStockLevel'] }, status: 'active' });
};

InventorySchema.statics.findExpiring = function(days: number = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  return this.find({ expiryDate: { $lte: futureDate }, status: 'active' });
};

export const InventoryModel = mongoose.model<InventoryDocument>('Inventory', InventorySchema);
