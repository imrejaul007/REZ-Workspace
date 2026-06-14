import mongoose, { Schema, Document } from 'mongoose';

export interface IArticle extends Document {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string;
  category: string;
  tags: string[];
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  views: number;
  readTime: number; // minutes
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema = new Schema<IArticle>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  excerpt: { type: String },
  coverImage: { type: String },
  category: { type: String, required: true, index: true },
  tags: [{ type: String }],
  author: {
    id: { type: String, required: true },
    name: { type: String, required: true },
    avatar: String,
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true,
  },
  featured: { type: Boolean, default: false, index: true },
  views: { type: Number, default: 0 },
  readTime: { type: Number, default: 5 },
  publishedAt: Date,
}, {
  timestamps: true,
});

// Indexes
ArticleSchema.index({ title: 'text', content: 'text', excerpt: 'text' });
ArticleSchema.index({ category: 1, status: 1, publishedAt: -1 });

export const Article = mongoose.model<IArticle>('Article', ArticleSchema);
