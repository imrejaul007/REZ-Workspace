import mongoose, { Document, Schema } from 'mongoose';

export type Platform = 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok';

export interface IPost extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  content: string;
  mediaUrls: string[];
  platform: Platform;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledAt?: Date;
  publishedAt?: Date;
  metadata: {
    hashtags?: string[];
    mentions?: string[];
    location?: string;
    link?: string;
  };
  analytics: {
    impressions?: number;
    likes?: number;
    shares?: number;
    comments?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    userId: { type: String, required: true, index: true },
    content: { type: String, required: true, maxlength: 5000 },
    mediaUrls: { type: [String], default: [] },
    platform: {
      type: String,
      enum: ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok'],
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published', 'failed'],
      default: 'draft',
      index: true
    },
    scheduledAt: { type: Date, index: true },
    publishedAt: { type: Date },
    metadata: {
      hashtags: [String],
      mentions: [String],
      location: String,
      link: String
    },
    analytics: {
      impressions: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      comments: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

PostSchema.index({ userId: 1, status: 1 });
PostSchema.index({ scheduledAt: 1, status: 1 });

export const Post = mongoose.model<IPost>('Post', PostSchema);