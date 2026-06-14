import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

// Zod validation schema
export const InventoryItemZodSchema = z.object({
  itemId: z.string().min(1, 'Item ID is required'),
  storeId: z.string().min(1, 'Store ID is required'),
  productId: z.string().min(1, 'Product ID is required'),
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  category: z.string().min(1, 'Category is required'),
  quantity: z.number().int().min(0, 'Quantity must be a non-negative integer'),
  unit: z.enum(['pcs', 'kg', 'g', 'l', 'ml'], {
    errorMap: () => ({ message: 'Unit must be one of: pcs, kg, g, l, ml' })
  }),
  price: z.number().positive('Price must be positive'),
  mrp: z.number().positive('MRP must be positive'),
  stockLevel: z.enum(['in_stock', 'low_stock', 'out_of_stock']),
  lowStockThreshold: z.number().int().min(0, 'Low stock threshold must be non-negative'),
  expiryDate: z.date().optional(),
  batchNumber: z.string().optional(),
});

export type InventoryItemInput = z.infer<typeof InventoryItemZodSchema>;

// Stock level enum values
export type StockLevel = 'in_stock' | 'low_stock' | 'out_of_stock';

// Unit enum values
export type Unit = 'pcs' | 'kg' | 'g' | 'l' | 'ml';

// Mongoose document interface
export interface IInventoryItem extends Document {
  itemId: string;
  storeId: string;
  productId: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit: Unit;
  price: number;
  mrp: number;
  stockLevel: StockLevel;
  lowStockThreshold: number;
  expiryDate?: Date;
  batchNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Calculate stock level based on quantity and threshold
export function calculateStockLevel(quantity: number, threshold: number): StockLevel {
  if (quantity === 0) {
    return 'out_of_stock';
  }
  if (quantity <= threshold) {
    return 'low_stock';
  }
  return 'in_stock';
}

// Mongoose schema
const InventoryItemSchema = new Schema<IInventoryItem>(
  {
    itemId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    storeId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    productId: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    unit: {
      type: String,
      required: true,
      enum: ['pcs', 'kg', 'g', 'l', 'ml'],
      default: 'pcs',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    mrp: {
      type: Number,
      required: true,
      min: 0,
    },
    stockLevel: {
      type: String,
      required: true,
      enum: ['in_stock', 'low_stock', 'out_of_stock'],
      default: 'in_stock',
    },
    lowStockThreshold: {
      type: Number,
      required: true,
      min: 0,
      default: 10,
    },
    expiryDate: {
      type: Date,
      required: false,
    },
    batchNumber: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for efficient queries
InventoryItemSchema.index({ storeId: 1, category: 1 });
InventoryItemSchema.index({ storeId: 1, stockLevel: 1 });
InventoryItemSchema.index({ productId: 1 });
InventoryItemSchema.index({ sku: 1 });
InventoryItemSchema.index({ expiryDate: 1 }, { sparse: true });

// Pre-save middleware to auto-calculate stock level
InventoryItemSchema.pre('save', function (next) {
  this.stockLevel = calculateStockLevel(this.quantity, this.lowStockThreshold);
  next();
});

// Static method to find by itemId
InventoryItemSchema.statics.findByItemId = function (itemId: string) {
  return this.findOne({ itemId });
};

// Static method to find low stock items by store
InventoryItemSchema.statics.findLowStockByStore = function (storeId: string) {
  return this.find({
    storeId,
    stockLevel: { $in: ['low_stock', 'out_of_stock'] },
  });
};

// Static method to find all low stock alerts
InventoryItemSchema.statics.findAllLowStock = function () {
  return this.find({
    stockLevel: { $in: ['low_stock', 'out_of_stock'] },
  }).sort({ quantity: 1 });
};

// Instance method to adjust stock
InventoryItemSchema.methods.adjustStock = function (adjustment: number) {
  const newQuantity = this.quantity + adjustment;
  if (newQuantity < 0) {
    throw new Error('Stock adjustment would result in negative quantity');
  }
  this.quantity = newQuantity;
  this.stockLevel = calculateStockLevel(this.quantity, this.lowStockThreshold);
  return this;
};

// Instance method to update stock quantity
InventoryItemSchema.methods.updateStock = function (newQuantity: number) {
  if (newQuantity < 0) {
    throw new Error('Stock quantity cannot be negative');
  }
  this.quantity = newQuantity;
  this.stockLevel = calculateStockLevel(this.quantity, this.lowStockThreshold);
  return this;
};

export const InventoryItem = mongoose.model<IInventoryItem>('InventoryItem', InventoryItemSchema);

export default InventoryItem;
