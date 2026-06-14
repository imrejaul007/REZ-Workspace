import mongoose, { Document, Schema } from 'mongoose';

// Enums for Grocery Categories
export enum GroceryCategory {
  PRODUCE = 'PRODUCE',
  DAIRY = 'DAIRY',
  BAKERY = 'BAKERY',
  FROZEN = 'FROZEN',
  BEVERAGES = 'BEVERAGES',
  SNACKS = 'SNACKS',
  ESSENTIALS = 'ESSENTIALS'
}

// Enums for Product Status
export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED'
}

// Enums for Product Units
export enum ProductUnit {
  KG = 'KG',
  PCS = 'PCS',
  PACKS = 'PACKS',
  LITERS = 'LITERS',
  GRAMS = 'GRAMS',
  BOTTLES = 'BOTTLES',
  CANS = 'CANS',
  BOXES = 'BOXES'
}

// Product Image Interface
export interface IProductImage {
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

// Product Interface
export interface IProduct extends Document {
  productId: string;
  name: string;
  category: GroceryCategory;
  brand?: string;
  sku: string;
  barcode: string;
  unit: ProductUnit;
  weight?: number;
  mrp: number;
  sellingPrice: number;
  costPrice: number;
  stock: number;
  minStock: number;
  reorderLevel: number;
  expiryDate?: Date;
  batchNumber?: string;
  supplierId?: string;
  merchantId: string;
  isOrganic: boolean;
  isImported: boolean;
  images: IProductImage[];
  status: ProductStatus;
  description?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Product Image Schema
const ProductImageSchema = new Schema<IProductImage>({
  url: { type: String, required: true },
  alt: { type: String },
  isPrimary: { type: Boolean, default: false }
}, { _id: false });

// Product Schema
const ProductSchema = new Schema<IProduct>({
  productId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: GroceryCategory,
    required: true,
    index: true
  },
  brand: {
    type: String,
    index: true
  },
  sku: {
    type: String,
    required: true,
    index: true
  },
  barcode: {
    type: String,
    required: true,
    index: true
  },
  unit: {
    type: String,
    enum: ProductUnit,
    required: true
  },
  weight: {
    type: Number
  },
  mrp: {
    type: Number,
    required: true,
    min: 0
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  minStock: {
    type: Number,
    default: 10,
    min: 0
  },
  reorderLevel: {
    type: Number,
    default: 20,
    min: 0
  },
  expiryDate: {
    type: Date,
    index: true
  },
  batchNumber: {
    type: String
  },
  supplierId: {
    type: String,
    index: true
  },
  merchantId: {
    type: String,
    required: true,
    index: true
  },
  isOrganic: {
    type: Boolean,
    default: false
  },
  isImported: {
    type: Boolean,
    default: false
  },
  images: [ProductImageSchema],
  status: {
    type: String,
    enum: ProductStatus,
    default: ProductStatus.ACTIVE,
    index: true
  },
  description: {
    type: String
  },
  tags: [{
    type: String
  }]
}, {
  timestamps: true,
  collection: 'grocery_products'
});

// Compound Indexes
ProductSchema.index({ merchantId: 1, category: 1 });
ProductSchema.index({ merchantId: 1, status: 1 });
ProductSchema.index({ expiryDate: 1, status: 1 });
ProductSchema.index({ barcode: 1 }, { unique: true });

// Text Index for Search
ProductSchema.index({ name: 'text', description: 'text', brand: 'text' });

// Virtual for checking if product is expired
ProductSchema.virtual('isExpired').get(function() {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
});

// Virtual for checking if product needs reorder
ProductSchema.virtual('needsReorder').get(function() {
  return this.stock <= this.reorderLevel;
});

// Virtual for profit margin
ProductSchema.virtual('profitMargin').get(function() {
  if (this.sellingPrice === 0) return 0;
  return ((this.sellingPrice - this.costPrice) / this.sellingPrice) * 100;
});

// Virtual for stock percentage
ProductSchema.virtual('stockPercentage').get(function() {
  if (this.minStock === 0) return 100;
  return (this.stock / this.minStock) * 100;
});

// Methods
ProductSchema.methods.markAsOutOfStock = function(): void {
  if (this.stock === 0) {
    this.status = ProductStatus.OUT_OF_STOCK;
  }
};

ProductSchema.methods.markAsActive = function(): void {
  if (this.stock > 0 && this.status === ProductStatus.OUT_OF_STOCK) {
    this.status = ProductStatus.ACTIVE;
  }
};

// Pre-save hook to update status based on stock
ProductSchema.pre('save', function(next) {
  if (this.isModified('stock')) {
    if (this.stock === 0) {
      this.status = ProductStatus.OUT_OF_STOCK;
    } else if (this.status === ProductStatus.OUT_OF_STOCK) {
      this.status = ProductStatus.ACTIVE;
    }
  }
  next();
});

export const Product = mongoose.model<IProduct>('Product', ProductSchema);