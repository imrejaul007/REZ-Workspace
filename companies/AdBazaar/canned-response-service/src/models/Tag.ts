/**
 * Tag Model - Mongoose schema for response tags
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface ITag extends Document {
  tagId: string;
  name: string;
  slug: string;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const tagSchema = new Schema<ITag>(
  {
    tagId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, unique: true, maxlength: 50 },
    slug: { type: String, required: true, unique: true, index: true },
    usageCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Indexes
tagSchema.index({ usageCount: -1 });

export const Tag = mongoose.model<ITag>('Tag', tagSchema);
export default Tag;