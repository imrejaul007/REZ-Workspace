import mongoose, { Document, Schema } from 'mongoose';

export interface ITaxonomy extends Document {
  _id: mongoose.Types.ObjectId;
  taxonomyId: string;
  name: string;
  slug: string;
  description?: string;
  type: 'category' | 'genre' | 'topic' | 'industry' | 'custom';
  hierarchy: string[];
  depth: number;
  parentId?: string;
  children: string[];
  metadata: {
    icon?: string;
    color?: string;
    image?: string;
  };
  contentCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TaxonomySchema = new Schema<ITaxonomy>(
  {
    taxonomyId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, index: true },
    description: { type: String },
    type: {
      type: String,
      enum: ['category', 'genre', 'topic', 'industry', 'custom'],
      required: true,
      index: true
    },
    hierarchy: [String],
    depth: { type: Number, default: 0 },
    parentId: { type: String, index: true },
    children: [String],
    metadata: {
      icon: String,
      color: String,
      image: String
    },
    contentCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

TaxonomySchema.index({ parentId: 1 });
TaxonomySchema.index({ type: 1, isActive: 1 });
TaxonomySchema.index({ name: 'text', description: 'text' });

export const Taxonomy = mongoose.model<ITaxonomy>('Taxonomy', TaxonomySchema);