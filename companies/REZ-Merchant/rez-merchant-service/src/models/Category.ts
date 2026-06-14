import mongoose, { Schema, Document, Types } from 'mongoose';

// SECURITY FIX (MA-BACK-AUDIT-007): Replaced `any` with proper interfaces.
export interface CategoryMetadata {
  [key: string]: unknown;
}

export interface ICategory extends Document {
  store: Types.ObjectId;
  merchant: Types.ObjectId;
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  icon?: string;
  parentCategory?: Types.ObjectId;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  metadata?: CategoryMetadata;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    store: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    merchant: { type: Schema.Types.ObjectId, ref: 'Merchant' },
    name: { type: String, required: true, trim: true },
    slug: String,
    description: String,
    image: String,
    icon: String,
    parentCategory: { type: Schema.Types.ObjectId, ref: 'Category' },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    productCount: { type: Number, default: 0 },
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true, strict: true, strictQuery: true },
);

CategorySchema.index({ store: 1, isActive: 1, sortOrder: 1 });
CategorySchema.index({ merchant: 1, store: 1, name: 1 });

export const Category = mongoose.model<ICategory>('Category', CategorySchema);
