import mongoose, { Document, Schema } from 'mongoose';

export interface IFeedback extends Document {
  feedbackId: string;
  recommendationId: string;
  userId: string;
  itemId: string;
  type: 'click' | 'view' | 'add_to_cart' | 'purchase' | 'dismiss' | 'rating';
  rating?: number;
  metadata?: {
    position?: number;
    source?: string;
    context?: string;
    device?: string;
  };
  createdAt: Date;
}

const feedbackSchema = new Schema<IFeedback>({
  feedbackId: { type: String, required: true, unique: true },
  recommendationId: { type: String, required: true },
  userId: { type: String, required: true, index: true },
  itemId: { type: String, required: true },
  type: {
    type: String,
    enum: ['click', 'view', 'add_to_cart', 'purchase', 'dismiss', 'rating'],
    required: true
  },
  rating: { type: Number, min: 1, max: 5 },
  metadata: {
    position: Number,
    source: String,
    context: String,
    device: String
  }
}, { timestamps: true });

feedbackSchema.index({ feedbackId: 1 });
feedbackSchema.index({ recommendationId: 1 });
feedbackSchema.index({ userId: 1, createdAt: -1 });
feedbackSchema.index({ itemId: 1 });
feedbackSchema.index({ type: 1, createdAt: -1 });

export const Feedback = mongoose.model<IFeedback>('Feedback', feedbackSchema);