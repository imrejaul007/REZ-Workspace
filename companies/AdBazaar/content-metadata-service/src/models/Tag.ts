import mongoose, { Document, Schema } from 'mongoose';

export interface ITag extends Document {
  _id: mongoose.Types.ObjectId;
  tagId: string;
  name: string;
  slug: string;
  type: 'content' | 'brand' | 'campaign' | 'audience' | 'custom';
  category?: string;
  color?: string;
  synonyms: string[];
  contentCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TagSchema = new Schema<ITag>(
  {
    tagId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['content', 'brand', 'campaign', 'audience', 'custom'],
      default: 'content',
      index: true
    },
    category: { type: String, index: true },
    color: { type: String },
    synonyms: [String],
    contentCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

TagSchema.index({ name: 1 });
TagSchema.index({ type: 1, category: 1 });
TagSchema.index({ synonyms: 1 });

export const Tag = mongoose.model<ITag>('Tag', TagSchema);