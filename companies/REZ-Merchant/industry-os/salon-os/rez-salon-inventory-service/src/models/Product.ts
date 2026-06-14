import mongoose, { Schema, Document } from 'mongoose';

export type ProductCategory = 'shampoo' | 'color' | 'tool' | 'treatment' | 'equipment' | 'accessory';

export interface IProduct extends Document {
  productId: string;
  name: string;
  brand: string;
  category: ProductCategory;
  description: string;
  sku: string;
  barcode?: string;
  unit: string; // e.g., 'ml', 'pcs', 'g'
  unitSize: number;
  costPrice: number;
  sellingPrice: number;
  minStockLevel: number;
  reorderPoint: number;
  supplier: mongoose.Types.ObjectId;
  expiryTracking: boolean;
  shelfLifeDays?: number;
  ingredients?: string[];
  usagePerService: Map<string, number>; // serviceId -> amount used per service
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    productId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    brand: { type: String, required: true },
    category: {
      type: String,
      enum: ['shampoo', 'color', 'tool', 'treatment', 'equipment', 'accessory'],
      required: true,
      index: true
    },
    description: { type: String, default: '' },
    sku: { type: String, required: true, unique: true },
    barcode: { type: String },
    unit: { type: String, required: true, default: 'pcs' },
    unitSize: { type: Number, required: true, default: 1 },
    costPrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    minStockLevel: { type: Number, default: 10 },
    reorderPoint: { type: Number, default: 20 },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    expiryTracking: { type: Boolean, default: false },
    shelfLifeDays: { type: Number },
    ingredients: [{ type: String }],
    usagePerService: { type: Map, of: Number, default: new Map() },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

ProductSchema.index({ name: 'text', brand: 'text', description: 'text' });
ProductSchema.index({ category: 1, isActive: 1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
