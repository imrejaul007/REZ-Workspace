import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface ICategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  icon?: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICategoryDocument extends Omit<ICategory, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const CategorySchema = new Schema<ICategoryDocument>({
  id: { type: String, default: () => uuidv4(), unique: true, index: true },
  name: { type: String, required: true, maxlength: 100 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, maxlength: 500 },
  parentId: { type: String, index: true },
  icon: { type: String },
  image: { type: String },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true, index: true },
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed },
}, {
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

// Self-reference for tree structure
CategorySchema.index({ parentId: 1, sortOrder: 1 });

// Virtual for children
CategorySchema.virtual('children', {
  ref: 'Category',
  localField: 'id',
  foreignField: 'parentId',
});

// Static method to get category tree
CategorySchema.statics.getCategoryTree = async function (activeOnly = true) {
  const query = activeOnly ? { isActive: true } : {};
  const categories = await this.find(query).sort({ sortOrder: 1, name: 1 });

  const buildTree = (parentId?: string): ICategory[] => {
    return categories
      .filter(cat => cat.parentId === parentId)
      .map(cat => ({
        ...cat.toJSON(),
        children: buildTree(cat.id),
      })) as unknown as ICategory[];
  };

  return buildTree(undefined);
};

// Static method to get all descendants of a category
CategorySchema.statics.getDescendants = async function (categoryId: string): Promise<string[]> {
  const descendants: string[] = [];
  const queue: string[] = [categoryId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = await this.find({ parentId: currentId }, { id: 1 });

    for (const child of children) {
      descendants.push(child.id);
      queue.push(child.id);
    }
  }

  return descendants;
};

export const Category = mongoose.model<ICategoryDocument>('Category', CategorySchema);

export default Category;
