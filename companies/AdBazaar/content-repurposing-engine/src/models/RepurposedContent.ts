import mongoose, { Document, Schema } from 'mongoose';
import { z } from 'zod';

// Zod schemas for validation
export const adaptedContentSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().min(0).max(2200),
  hashtags: z.array(z.string()).max(30),
});

export const repurposedContentStatusSchema = z.enum(['processing', 'ready', 'published', 'failed']);

export interface IRepurposedContent {
  id: string;
  originalContentId: string;
  originalPlatform: string;
  targetPlatform: string;
  adaptedContent: {
    title: string;
    description: string;
    hashtags: string[];
  };
  mediaUrl: string;
  mediaFormat: string;
  aspectRatio: string;
  status: 'processing' | 'ready' | 'published' | 'failed';
  createdAt: Date;
  publishedAt?: Date;
}

export interface IRepurposedContentDocument extends IRepurposedContent, Document {
  _id: mongoose.Types.ObjectId;
}

const RepurposedContentSchema = new Schema<IRepurposedContentDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    originalContentId: { type: String, required: true, index: true },
    originalPlatform: { type: String, required: true },
    targetPlatform: { type: String, required: true, index: true },
    adaptedContent: {
      title: { type: String, required: true },
      description: { type: String, default: '' },
      hashtags: [{ type: String }],
    },
    mediaUrl: { type: String, default: '' },
    mediaFormat: { type: String, default: 'mp4' },
    aspectRatio: { type: String, default: '16:9' },
    status: {
      type: String,
      enum: ['processing', 'ready', 'published', 'failed'],
      default: 'processing',
      index: true,
    },
    publishedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

RepurposedContentSchema.index({ createdAt: -1 });
RepurposedContentSchema.index({ originalContentId: 1, targetPlatform: 1 });

export const RepurposedContent = mongoose.model<IRepurposedContentDocument>(
  'RepurposedContent',
  RepurposedContentSchema
);