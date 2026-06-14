import mongoose, { Schema, Document } from 'mongoose';

export interface IKnowledgeCategory extends Document {
  categoryId: string;
  companyId: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  parentId?: string;
  order: number;
  articleCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeCategorySchema = new Schema<IKnowledgeCategory>(
  {
    categoryId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: 'folder' },
    color: { type: String, default: '#6366F1' },
    parentId: { type: String, index: true },
    order: { type: Number, default: 0 },
    articleCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

KnowledgeCategorySchema.index({ companyId: 1, isActive: 1 });
KnowledgeCategorySchema.index({ parentId: 1 });

export const KnowledgeCategory = mongoose.model<IKnowledgeCategory>('KnowledgeCategory', KnowledgeCategorySchema);
