import mongoose, { Document, Schema } from 'mongoose';
import { IPinterestComment } from '../types';

export interface IPinterestCommentDocument extends IPinterestComment, Document {}

const PinterestCommentSchema = new Schema<IPinterestCommentDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    pinId: { type: String, required: true, index: true },
    accountId: { type: String, required: true, index: true },
    authorName: { type: String, required: true },
    authorImage: { type: String },
    text: { type: String, required: true },
    hidden: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'pinterest_comments',
  }
);

// Indexes for efficient queries
PinterestCommentSchema.index({ pinId: 1 });
PinterestCommentSchema.index({ accountId: 1 });
PinterestCommentSchema.index({ hidden: 1 });

export const PinterestComment = mongoose.model<IPinterestCommentDocument>(
  'PinterestComment',
  PinterestCommentSchema
);