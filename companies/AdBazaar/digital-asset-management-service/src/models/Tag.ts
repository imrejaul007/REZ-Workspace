import mongoose, { Document, Schema } from 'mongoose';

export interface ITag extends Document {
  _id: mongoose.Types.ObjectId;
  tagId: string;
  name: string;
  slug: string;
  category?: string;
  color?: string;
  count: number;
  createdAt: Date;
  updatedAt: Date;
}

const TagSchema = new Schema<ITag>(
  {
    tagId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    category: { type: String, index: true },
    color: { type: String },
    count: { type: Number, default: 0 }
  },
  { timestamps: true }
);

TagSchema.index({ name: 1 });
TagSchema.index({ category: 1, name: 1 });

export const Tag = mongoose.model<ITag>('Tag', TagSchema);