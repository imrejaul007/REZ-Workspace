import mongoose, { Document, Schema } from 'mongoose';

export interface IInventory extends Document {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  lastRestocked?: Date;
  minStock: number;
  maxStock: number;
  createdAt: Date;
  updatedAt: Date;
}

const InventorySchema = new Schema<IInventory>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      unique: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    lastRestocked: {
      type: Date,
    },
    minStock: {
      type: Number,
      default: 5,
      min: 0,
    },
    maxStock: {
      type: Number,
      default: 100,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for stock status
InventorySchema.virtual('status').get(function () {
  if (this.quantity <= 0) return 'out_of_stock';
  if (this.quantity <= this.minStock) return 'low_stock';
  if (this.quantity >= this.maxStock) return 'overstocked';
  return 'in_stock';
});

// Virtual for reorder quantity suggestion
InventorySchema.virtual('suggestedReorderQty').get(function () {
  if (this.quantity >= this.minStock) return 0;
  return this.maxStock - this.quantity;
});

// Ensure virtuals are included in JSON
InventorySchema.set('toJSON', { virtuals: true });
InventorySchema.set('toObject', { virtuals: true });

// Index
InventorySchema.index({ quantity: 1 });
InventorySchema.index({ status: 1 });

export const Inventory = mongoose.model<IInventory>('Inventory', InventorySchema);
export default Inventory;