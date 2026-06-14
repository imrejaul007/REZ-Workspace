import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IWarehouse extends Document {
  name: string;
  code: string;
  type: 'main' | 'regional' | 'store';
  address: any;
  capacity: number;
  currentStock: number;
  managerId: string;
  isActive: boolean;
}

export interface IInventoryItem extends Document {
  productId: Types.ObjectId;
  warehouseId: Types.ObjectId;
  storeId?: Types.ObjectId;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderLevel: number;
  reorderQuantity: number;
  maxStock: number;
  lastRestocked?: Date;
  expiryDate?: Date;
  batchNumber?: string;
  cost: number;
}

export interface IStockMovement extends Document {
  type: 'in' | 'out' | 'transfer' | 'adjustment';
  productId: Types.ObjectId;
  fromWarehouseId?: Types.ObjectId;
  toWarehouseId?: Types.ObjectId;
  quantity: number;
  reason: string;
  referenceId?: Types.ObjectId;
  referenceType?: string;
  employeeId?: Types.ObjectId;
}

const WarehouseSchema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  type: { type: String, enum: ['main', 'regional', 'store'], default: 'store' },
  address: { type: Schema.Types.Mixed, default: {} },
  capacity: { type: Number, default: 0 },
  currentStock: { type: Number, default: 0 },
  managerId: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const InventoryItemSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  storeId: { type: Schema.Types.ObjectId, ref: 'Store' },
  quantity: { type: Number, default: 0, min: 0 },
  reservedQuantity: { type: Number, default: 0 },
  availableQuantity: { type: Number, default: 0 },
  reorderLevel: { type: Number, default: 10 },
  reorderQuantity: { type: Number, default: 50 },
  maxStock: { type: Number, default: 100 },
  lastRestocked: Date,
  expiryDate: Date,
  batchNumber: String,
  cost: { type: Number, default: 0 }
}, { timestamps: true });

InventoryItemSchema.virtual('isLowStock').get(function() {
  return this.quantity <= this.reorderLevel;
});

const StockMovementSchema = new Schema({
  type: { type: String, enum: ['in', 'out', 'transfer', 'adjustment'], required: true },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  fromWarehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
  toWarehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
  quantity: { type: Number, required: true },
  reason: String,
  referenceId: Schema.Types.ObjectId,
  referenceType: String,
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' }
}, { timestamps: true });

export const Warehouse = mongoose.model<IWarehouse>('Warehouse', WarehouseSchema);
export const InventoryItem = mongoose.model<IInventoryItem>('InventoryItem', InventoryItemSchema);
export const StockMovement = mongoose.model<IStockMovement>('StockMovement', StockMovementSchema);