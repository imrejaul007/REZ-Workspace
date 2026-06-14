import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IProduct extends Document {
  sku: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  brand: string;
  price: number;
  cost: number;
  mrp: number;
  taxRate: number;
  images: string[];
  attributes: Record<string, any>;
  isActive: boolean;
  storeIds: Types.ObjectId[];
  supplierId: Types.ObjectId;
  reorderLevel: number;
  reorderQuantity: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    subcategory: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    cost: {
      type: Number,
      required: true,
      min: 0,
    },
    mrp: {
      type: Number,
      min: 0,
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    images: {
      type: [String],
      default: [],
    },
    attributes: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    storeIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Store',
      default: [],
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    reorderLevel: {
      type: Number,
      default: 10,
      min: 0,
    },
    reorderQuantity: {
      type: Number,
      default: 50,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Virtuals
ProductSchema.virtual('profitMargin').get(function () {
  if (this.price === 0) return 0;
  return ((this.price - this.cost) / this.price) * 100;
});

ProductSchema.virtual('isLowStock').get(function () {
  return this.reorderLevel > 0;
});

// Indexes
ProductSchema.index({ name: 'text', sku: 'text', description: 'text' });
ProductSchema.index({ category: 1, subcategory: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ isActive: 1, category: 1 });

// Ensure virtuals in JSON
ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
export default Product;
