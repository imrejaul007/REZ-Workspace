import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IProductVariant {
  id: string;
  sku: string;
  name: string;
  price: number;
  attributes?: Record<string, string>;
  inventory: number;
  images?: string[];
  isActive: boolean;
}

export interface IProduct {
  id: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  categoryId?: string;
  tags: string[];
  images: string[];
  variants: IProductVariant[];
  inventory: number;
  lowStockThreshold: number;
  isActive: boolean;
  isFeatured: boolean;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductDocument extends Omit<IProduct, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const ProductVariantSchema = new Schema<IProductVariant>({
  id: { type: String, default: () => uuidv4() },
  sku: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  attributes: { type: Map, of: String },
  inventory: { type: Number, default: 0, min: 0 },
  images: [{ type: String }],
  isActive: { type: Boolean, default: true },
});

const ProductSchema = new Schema<IProductDocument>({
  id: { type: String, default: () => uuidv4(), unique: true, index: true },
  sku: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, maxlength: 200 },
  description: { type: String, maxlength: 5000 },
  price: { type: Number, required: true, min: 0 },
  compareAtPrice: { type: Number, min: 0 },
  categoryId: { type: String, index: true },
  tags: [{ type: String }],
  images: [{ type: String }],
  variants: [ProductVariantSchema],
  inventory: { type: Number, default: 0, min: 0 },
  lowStockThreshold: { type: Number, default: 10, min: 0 },
  isActive: { type: Boolean, default: true, index: true },
  isFeatured: { type: Boolean, default: false, index: true },
  weight: { type: Number, min: 0 },
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
  },
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
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

// Indexes for efficient querying
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ price: 1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ categoryId: 1, isActive: 1 });
ProductSchema.index({ tags: 1 });

export const Product = mongoose.model<IProductDocument>('Product', ProductSchema);

export default Product;
