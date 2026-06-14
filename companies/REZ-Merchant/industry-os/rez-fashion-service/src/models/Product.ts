import mongoose, { Schema, model, Document } from 'mongoose';
import { IProduct, ProductCategory, Gender, ProductStatus } from '../types';

export interface ProductDocument extends Omit<IProduct, '_id'>, Document {}

const productSchema = new Schema<ProductDocument>(
  {
    productId: { type: String, required: true, unique: true, index: true },
    merchantId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, uppercase: true, trim: true },
    barcode: { type: String, uppercase: true, trim: true, index: true },
    category: {
      type: String,
      required: true,
      enum: ['tops', 'bottoms', 'dresses', 'ethnic', 'western', 'accessories', 'footwear'] as ProductCategory[],
      lowercase: true,
      index: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ['men', 'women', 'unisex', 'kids'] as Gender[],
      lowercase: true,
    },
    sizes: [{ type: String, uppercase: true, trim: true }],
    colors: [{ type: String, trim: true }],
    material: { type: String, trim: true },
    brand: { type: String, trim: true, index: true },
    season: { type: String, trim: true },
    collection: { type: String, trim: true },
    mrp: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    minStock: { type: Number, required: true, min: 0, default: 5 },
    reorderLevel: { type: Number, required: true, min: 0, default: 10 },
    images: [{ type: String }],
    description: { type: String, trim: true },
    tags: [{ type: String, lowercase: true, trim: true }],
    status: {
      type: String,
      required: true,
      enum: ['active', 'out_of_stock', 'discontinued'] as ProductStatus[],
      lowercase: true,
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      { keys: { merchantId: 1, category: 1 }, name: 'idx_merchant_category' },
      { keys: { merchantId: 1, status: 1 }, name: 'idx_merchant_status' },
      { keys: { name: 'text', sku: 'text', description: 'text' }, name: 'idx_text_search' },
      { keys: { brand: 1, category: 1 }, name: 'idx_brand_category' },
      { keys: { sellingPrice: 1 }, name: 'idx_price' },
    ],
  }
);

productSchema.pre('save', function (next) {
  if (!this.productId) {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.productId = `PRD-${timestamp}-${randomStr}`;
  }
  if (!this.barcode) {
    this.barcode = `BR${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
  // Auto-update status based on stock
  if (this.stock === 0 && this.status === 'active') {
    this.status = 'out_of_stock';
  } else if (this.stock > 0 && this.status === 'out_of_stock') {
    this.status = 'active';
  }
  next();
});

productSchema.virtual('profitMargin').get(function () {
  if (this.sellingPrice === 0) return 0;
  return ((this.sellingPrice - this.costPrice) / this.sellingPrice) * 100;
});

productSchema.virtual('needsReorder').get(function () {
  return this.stock <= this.reorderLevel;
});

productSchema.methods.updateStock = async function (quantity: number, operation: 'add' | 'subtract' | 'set'): Promise<void> {
  if (operation === 'set') {
    this.stock = quantity;
  } else if (operation === 'add') {
    this.stock += quantity;
  } else {
    this.stock = Math.max(0, this.stock - quantity);
  }
  if (this.stock === 0) this.status = 'out_of_stock';
  else if (this.status === 'out_of_stock') this.status = 'active';
  await this.save();
};

productSchema.statics.getLowStockProducts = function (merchantId?: string) {
  const query = merchantId ? { merchantId } : {};
  return this.find({ ...query, $expr: { $lte: ['$stock', '$reorderLevel'] } }).sort({ stock: 1 });
};

productSchema.statics.getOutOfStock = function (merchantId?: string) {
  const query = merchantId ? { merchantId } : {};
  return this.find({ ...query, stock: 0 }).sort({ name: 1 });
};

productSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Product = model<ProductDocument>('Product', productSchema);