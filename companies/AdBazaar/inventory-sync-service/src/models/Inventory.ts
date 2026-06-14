import mongoose, { Document, Schema } from 'mongoose';

export interface IInventory extends Document {
  inventoryId: string;
  productId: string;
  sku: string;
  companyId: string;
  warehouseId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
  reorderQuantity: number;
  lastSyncAt: Date;
  syncStatus: 'synced' | 'pending' | 'failed';
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const InventorySchema = new Schema<IInventory>(
  {
    inventoryId: { type: String, required: true, unique: true, index: true },
    productId: { type: String, required: true, index: true },
    sku: { type: String, required: true, index: true },
    companyId: { type: String, required: true, index: true },
    warehouseId: { type: String, required: true, index: true },
    quantity: { type: Number, required: true, default: 0 },
    reservedQuantity: { type: Number, default: 0 },
    availableQuantity: { type: Number, required: true, default: 0 },
    reorderLevel: { type: Number, default: 10 },
    reorderQuantity: { type: Number, default: 50 },
    lastSyncAt: { type: Date, default: Date.now },
    syncStatus: { type: String, enum: ['synced', 'pending', 'failed'], default: 'synced' },
    metadata: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

InventorySchema.index({ productId: 1, warehouseId: 1 });
InventorySchema.index({ companyId: 1, syncStatus: 1 });
InventorySchema.index({ availableQuantity: 1 });

export const Inventory = mongoose.model<IInventory>('Inventory', InventorySchema);