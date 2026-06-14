import mongoose, { Schema, Document } from 'mongoose';

export type CategoryType = 'shampoo' | 'color' | 'tool' | 'treatment' | 'equipment' | 'accessory';

export interface ICategory extends Document {
  categoryId: string;
  name: string;
  type: CategoryType;
  description: string;
  parentCategory?: mongoose.Types.ObjectId;
  icon?: string;
  color?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    categoryId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['shampoo', 'color', 'tool', 'treatment', 'equipment', 'accessory'],
      required: true
    },
    description: { type: String, default: '' },
    parentCategory: { type: Schema.Types.ObjectId, ref: 'Category' },
    icon: { type: String },
    color: { type: String },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

CategorySchema.index({ type: 1, isActive: 1, displayOrder: 1 });

export const Category = mongoose.model<ICategory>('Category', CategorySchema);
