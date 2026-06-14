import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type MovementType = 'in' | 'out' | 'adjustment' | 'return' | 'transfer';

export interface IInventoryMovement {
  id: string;
  type: MovementType;
  quantity: number;
  reason?: string;
  reference?: string;
  createdBy?: string;
  createdAt: Date;
}

export interface IInventory {
  id: string;
  productId: string;
  sku: string;
  warehouseId?: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number;
  reorderPoint: number;
  reorderQuantity: number;
  lastRestocked?: Date;
  movements: IInventoryMovement[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IInventoryDocument extends Omit<IInventory, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const InventoryMovementSchema = new Schema<IInventoryMovement>({
  id: { type: String, default: () => uuidv4() },
  type: {
    type: String,
    enum: ['in', 'out', 'adjustment', 'return', 'transfer'],
    required: true,
  },
  quantity: { type: Number, required: true },
  reason: { type: String },
  reference: { type: String },
  createdBy: { type: String },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const InventorySchema = new Schema<IInventoryDocument>({
  id: { type: String, default: () => uuidv4(), unique: true, index: true },
  productId: { type: String, required: true, index: true },
  sku: { type: String, required: true, index: true },
  warehouseId: { type: String, index: true },
  quantity: { type: Number, required: true, default: 0, min: 0 },
  reservedQuantity: { type: Number, default: 0, min: 0 },
  availableQuantity: { type: Number, required: true, default: 0, min: 0 },
  lowStockThreshold: { type: Number, default: 10, min: 0 },
  reorderPoint: { type: Number, default: 20, min: 0 },
  reorderQuantity: { type: Number, default: 50, min: 1 },
  lastRestocked: { type: Date },
  movements: [InventoryMovementSchema],
}, {
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

// Indexes
InventorySchema.index({ productId: 1, warehouseId: 1 }, { unique: true });
InventorySchema.index({ sku: 1, warehouseId: 1 }, { unique: true });
InventorySchema.index({ quantity: 1 });
InventorySchema.index({ availableQuantity: 1 });

// Pre-save middleware to update availableQuantity
InventorySchema.pre('save', function (next) {
  this.availableQuantity = this.quantity - this.reservedQuantity;
  next();
});

// Static method to check low stock
InventorySchema.statics.getLowStockItems = function (threshold?: number) {
  return this.find({
    $expr: {
      $lte: ['$availableQuantity', { $ifNull: [threshold, '$lowStockThreshold'] }],
    },
  });
};

// Static method to get out of stock items
InventorySchema.statics.getOutOfStockItems = function () {
  return this.find({ availableQuantity: { $lte: 0 } });
};

// Static method to adjust stock
InventorySchema.statics.adjustStock = async function (
  productId: string,
  quantity: number,
  type: MovementType,
  options?: { warehouseId?: string; reason?: string; reference?: string; createdBy?: string }
) {
  const { warehouseId, reason, reference, createdBy } = options || {};

  const inventory = await this.findOne({
    productId,
    ...(warehouseId && { warehouseId }),
  });

  if (!inventory) {
    throw new Error(`Inventory not found for product ${productId}`);
  }

  const movement: IInventoryMovement = {
    id: uuidv4(),
    type,
    quantity,
    reason,
    reference,
    createdBy,
    createdAt: new Date(),
  };

  switch (type) {
    case 'in':
    case 'return':
      inventory.quantity += quantity;
      if (type === 'in') inventory.lastRestocked = new Date();
      break;
    case 'out':
      if (inventory.quantity < quantity) {
        throw new Error('Insufficient stock');
      }
      inventory.quantity -= quantity;
      break;
    case 'adjustment':
      inventory.quantity = quantity;
      break;
    case 'transfer':
      // Handle transfer logic separately
      break;
  }

  inventory.movements.push(movement);
  await inventory.save();

  return inventory;
};

export const Inventory = mongoose.model<IInventoryDocument>('Inventory', InventorySchema);

export default Inventory;
