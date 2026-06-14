import mongoose, { Document, Schema } from 'mongoose';

export interface IProductInventory {
  currentStock: number;
  lowStockThreshold: number;
  reorderLevel: number;
  unit: string;
}

export interface IProductPricing {
  costPrice: number;
  sellingPrice: number;
  mrp: number;
  wholesalePrice?: number;
  taxRate: number;
}

export interface IProduct extends Document {
  productId: string;
  name: string;
  brand?: string;
  category: string;
  subcategory?: string;
  sku: string;
  barcode?: string;
  description?: string;
  inventory: IProductInventory;
  pricing: IProductPricing;
  imageUrl?: string;
  isActive: boolean;
  isService: boolean;
  hsnCode: string;
  gstRate: number;
  expiryDate?: Date;
  suppliers?: Array<{
    supplierId: string;
    supplierName: string;
    lastPurchasePrice: number;
    lastPurchaseDate?: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const ProductInventorySchema = new Schema<IProductInventory>(
  {
    currentStock: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 10, min: 0 },
    reorderLevel: { type: Number, default: 5, min: 0 },
    unit: { type: String, default: 'pcs' },
  },
  { _id: false }
);

const ProductPricingSchema = new Schema<IProductPricing>(
  {
    costPrice: { type: Number, default: 0, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    mrp: { type: Number, min: 0 },
    wholesalePrice: { type: Number, min: 0 },
    taxRate: { type: Number, default: 18, min: 0, max: 100 },
  },
  { _id: false }
);

const SupplierSchema = new Schema(
  {
    supplierId: { type: String, required: true },
    supplierName: { type: String, required: true },
    lastPurchasePrice: { type: Number, min: 0 },
    lastPurchaseDate: { type: Date },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    productId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    brand: { type: String, index: true },
    category: { type: String, required: true, index: true },
    subcategory: { type: String },
    sku: { type: String, required: true, unique: true, index: true },
    barcode: { type: String, sparse: true },
    description: { type: String },
    inventory: { type: ProductInventorySchema, required: true },
    pricing: { type: ProductPricingSchema, required: true },
    imageUrl: { type: String },
    isActive: { type: Boolean, default: true },
    isService: { type: Boolean, default: false },
    hsnCode: { type: String, default: '9994' },
    gstRate: { type: Number, default: 18 },
    expiryDate: { type: Date },
    suppliers: { type: [SupplierSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ProductSchema.index({ 'inventory.currentStock': 1 });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ isService: 1 });

// Virtual for margin calculation
ProductSchema.virtual('margin').get(function () {
  return this.pricing.sellingPrice - this.pricing.costPrice;
});

ProductSchema.virtual('marginPercent').get(function () {
  if (this.pricing.costPrice === 0) return 0;
  return ((this.pricing.sellingPrice - this.pricing.costPrice) / this.pricing.costPrice) * 100;
});

// Method to check low stock
ProductSchema.methods.isLowStock = function (): boolean {
  return this.inventory.currentStock <= this.inventory.lowStockThreshold;
};

// Method to check out of stock
ProductSchema.methods.isOutOfStock = function (): boolean {
  return this.inventory.currentStock <= 0;
};

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
