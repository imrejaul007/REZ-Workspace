import mongoose, { Schema, Document } from 'mongoose';

export interface IKnowledgeArticle extends Document {
  articleId: string;
  companyId: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  summary: string;
  categoryId: string;
  tags: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isPublished: boolean;
  isFeatured: boolean;
  attachments: Array<{
    id: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
  }>;
  metadata: {
    readTime?: number;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    relatedArticles?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

const KnowledgeArticleSchema = new Schema<IKnowledgeArticle>(
  {
    articleId: { type: String, required: true, unique: true, index: true },
    companyId: { type: String, required: true, index: true },
    authorId: { type: String, required: true, index: true },
    authorName: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    summary: { type: String, required: true },
    categoryId: { type: String, required: true, index: true },
    tags: { type: [String], default: [] },
    viewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false, index: true },
    isFeatured: { type: Boolean, default: false },
    attachments: [
      {
        id: String,
        filename: String,
        url: String,
        mimeType: String,
        size: Number,
      },
    ],
    metadata: {
      readTime: Number,
      difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
      relatedArticles: [String],
    },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

KnowledgeArticleSchema.index({ companyId: 1, isPublished: 1 });
KnowledgeArticleSchema.index({ companyId: 1, categoryId: 1 });
KnowledgeArticleSchema.index({ title: 'text', content: 'text', summary: 'text' });
KnowledgeArticleSchema.index({ tags: 1 });
KnowledgeArticleSchema.index({ isFeatured: 1, isPublished: 1 });

export const KnowledgeArticle = mongoose.model<IKnowledgeArticle>('KnowledgeArticle', KnowledgeArticleSchema);
