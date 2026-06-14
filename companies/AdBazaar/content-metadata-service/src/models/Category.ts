import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  _id: mongoose.Types.ObjectId;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  path: string;
  depth: number;
  order: number;
  icon?: string;
  image?: string;
  contentCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    categoryId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, index: true },
    description: { type: String },
    parentId: { type: String, index: true },
    path: { type: String },
    depth: { type: Number, default: 0 },
    order: { type: Number, default: 0 },
    icon: { type: String },
    image: { type: String },
    contentCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

CategorySchema.index({ parentId: 1 });
CategorySchema.index({ path: 1 });
CategorySchema.index({ name: 'text' });

export const Category = mongoose.model<ICategory>('Category', CategorySchema);