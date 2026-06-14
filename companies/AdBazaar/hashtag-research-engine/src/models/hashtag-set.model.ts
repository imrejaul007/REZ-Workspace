import mongoose, { Document, Schema } from 'mongoose';

export interface IHashtagSet {
  id: string;
  name: string;
  tags: string[];
  createdAt: Date;
  usageCount: number;
}

export interface IHashtagSetDocument extends Document {
  id: string;
  name: string;
  tags: string[];
  usageCount: number;
  createdBy?: string;
  isPublic: boolean;
  category?: string;
}

const hashtagSetSchema = new Schema<IHashtagSetDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    tags: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length > 0 && v.length <= 30,
        message: 'Hashtag set must have between 1 and 30 tags',
      },
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: String,
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
      index: true,
    },
    category: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
hashtagSetSchema.index({ isPublic: 1, usageCount: -1 });
hashtagSetSchema.index({ category: 1, usageCount: -1 });
hashtagSetSchema.index({ createdBy: 1, createdAt: -1 });

export const HashtagSet = mongoose.model<IHashtagSetDocument>('HashtagSet', hashtagSetSchema);