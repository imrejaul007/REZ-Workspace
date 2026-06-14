import mongoose, { Schema, Document } from 'mongoose';

export type ProductAvailability = 'in_stock' | 'out_of_stock' | 'preorder';

export interface IProduct extends Document {
  id: string;
  catalogId: string;
  instagramProductId?: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  availability: ProductAvailability;
  category: string;
  createdAt: Date;
  updatedAt: Date;
  syncedAt?: Date;
  syncStatus: 'pending' | 'synced' | 'failed';
  syncError?: string;
}

const ProductSchema = new Schema<IProduct>(
  {
    catalogId: {
      type: String,
      required: true,
      index: true,
    },
    instagramProductId: {
      type: String,
      index: true,
      sparse: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
    },
    images: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length > 0 && v.length <= 20,
        message: 'Product must have between 1 and 20 images',
      },
    },
    availability: {
      type: String,
      enum: ['in_stock', 'out_of_stock', 'preorder'],
      default: 'in_stock',
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    syncedAt: {
      type: Date,
    },
    syncStatus: {
      type: String,
      enum: ['pending', 'synced', 'failed'],
      default: 'pending',
    },
    syncError: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = (ret._id as mongoose.Types.ObjectId).toString();
        ret._id = undefined;
        ret.__v = undefined;
        return ret;
      },
    },
  }
);

ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ price: 1, category: 1 });
ProductSchema.index({ syncStatus: 1, updatedAt: -1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
