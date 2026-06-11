import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  sku: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  lowStockThreshold: number;
  reorderLevel: number;
  tags: string[];
  image?: string;
  isActive: boolean;
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
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
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
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: 0,
    },
    reorderLevel: {
      type: Number,
      default: 10,
      min: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    image: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for profit margin
ProductSchema.virtual('profitMargin').get(function () {
  if (this.price === 0) return 0;
  return ((this.price - this.cost) / this.price) * 100;
});

// Virtual for isLowStock
ProductSchema.virtual('isLowStock').get(function () {
  return this.stock <= this.lowStockThreshold;
});

// Ensure virtuals are included in JSON
ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

// Indexes
ProductSchema.index({ name: 'text', sku: 'text' });
ProductSchema.index({ price: 1 });
ProductSchema.index({ isActive: 1, category: 1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
export default Product;