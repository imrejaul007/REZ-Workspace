import mongoose, { Document, Schema } from 'mongoose';

export interface IRecommendation extends Document {
  recommendationId: string;
  userId: string;
  type: 'product' | 'content' | 'ad' | 'personalized' | 'trending';
  source: 'collaborative' | 'content-based' | 'hybrid' | 'popularity' | 'contextual';
  items: Array<{
    itemId: string;
    itemType: string;
    score: number;
    reason?: string;
    metadata?: Record<string, unknown>;
  }>;
  context?: {
    page?: string;
    category?: string;
    searchQuery?: string;
    device?: string;
  };
  expiryAt?: Date;
  createdAt: Date;
}

const itemSchema = new Schema({
  itemId: { type: String, required: true },
  itemType: { type: String, required: true },
  score: { type: Number, required: true, min: 0, max: 1 },
  reason: { type: String },
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed }
}, { _id: false });

const recommendationSchema = new Schema<IRecommendation>({
  recommendationId: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  type: {
    type: String,
    enum: ['product', 'content', 'ad', 'personalized', 'trending'],
    required: true
  },
  source: {
    type: String,
    enum: ['collaborative', 'content-based', 'hybrid', 'popularity', 'contextual'],
    required: true
  },
  items: [itemSchema],
  context: {
    page: String,
    category: String,
    searchQuery: String,
    device: String
  },
  expiryAt: { type: Date }
}, { timestamps: true });

recommendationSchema.index({ recommendationId: 1 });
recommendationSchema.index({ userId: 1, createdAt: -1 });
recommendationSchema.index({ type: 1, createdAt: -1 });

export const Recommendation = mongoose.model<IRecommendation>('Recommendation', recommendationSchema);