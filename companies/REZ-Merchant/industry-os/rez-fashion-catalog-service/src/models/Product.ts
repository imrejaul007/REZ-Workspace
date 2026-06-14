import mongoose, { Schema, Document } from 'mongoose';
import { Product as IProduct } from '../types';

export interface ProductDocument extends Omit<IProduct, '_id'>, Document {}

const ColorSchema = new Schema({ name: String, hex: String }, { _id: false });

const ProductSchema = new Schema<ProductDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, maxlength: 1000 },
    sku: { type: String, required: true, unique: true, uppercase: true, index: true },
    collectionId: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    subcategory: { type: String },
    brand: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number },
    currency: { type: String, default: 'INR' },
    images: [{ type: String }],
    sizes: [{ type: String }],
    colors: [ColorSchema],
    material: { type: String },
    careInstructions: [{ type: String }],
    status: { type: String, enum: ['active', 'inactive', 'out_of_stock'], default: 'active', index: true }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => { ret.id = ret._id.toString(); delete ret.__v; return ret; }
    }
  }
);

ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ category: 1, status: 1 });
ProductSchema.index({ collectionId: 1 });

export const ProductModel = mongoose.model<ProductDocument>('Product', ProductSchema);
