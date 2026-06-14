/**
 * Category Model - Mongoose schema for response categories
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  order: number;
  isActive: boolean;
  responseCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    categoryId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, maxlength: 500 },
    icon: String,
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    responseCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Indexes
categorySchema.index({ order: 1 });
categorySchema.index({ isActive: 1, order: 1 });

export const Category = mongoose.model<ICategory>('Category', categorySchema);
export default Category;