import mongoose, { Document, Schema } from 'mongoose';

export interface IInventory extends Document {
  inventoryId: string;
  rewardId: string;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  soldQuantity: number;
  lowStockThreshold: number;
  lastRestocked?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const inventorySchema = new Schema<IInventory>({
  inventoryId: { type: String, required: true, unique: true },
  rewardId: { type: String, required: true, unique: true, index: true },
  totalQuantity: { type: Number, required: true },
  availableQuantity: { type: Number, required: true },
  reservedQuantity: { type: Number, default: 0 },
  soldQuantity: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 10 },
  lastRestocked: Date
}, { timestamps: true });

inventorySchema.index({ inventoryId: 1 });
inventorySchema.index({ rewardId: 1 });
inventorySchema.index({ availableQuantity: 1 });

export const Inventory = mongoose.model<IInventory>('Inventory', inventorySchema);