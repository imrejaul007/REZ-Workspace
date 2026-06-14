import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  parentId: Types.ObjectId | null;
  level: number;
  attributes: string[];
  image: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    level: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    attributes: {
      type: [String],
      default: [],
    },
    image: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for full path
CategorySchema.virtual('path').get(function () {
  // This would be computed dynamically based on parent hierarchy
  return this.name;
});

// Indexes
CategorySchema.index({ name: 1 });
CategorySchema.index({ parentId: 1 });
CategorySchema.index({ level: 1, isActive: 1 });
CategorySchema.index({ isActive: 1 });

CategorySchema.set('toJSON', { virtuals: true });
CategorySchema.set('toObject', { virtuals: true });

export const Category = mongoose.model<ICategory>('Category', CategorySchema);
export default Category;