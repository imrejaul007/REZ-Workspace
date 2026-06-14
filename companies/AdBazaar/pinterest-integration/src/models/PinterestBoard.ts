import mongoose, { Document, Schema } from 'mongoose';
import { IPinterestBoard } from '../types';

export interface IPinterestBoardDocument extends IPinterestBoard, Document {}

const PinterestBoardSchema = new Schema<IPinterestBoardDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    pinterestBoardId: { type: String, required: true, unique: true, index: true },
    accountId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    privacy: { type: String, enum: ['public', 'secret'], default: 'public' },
    pinCount: { type: Number, default: 0 },
    followerCount: { type: Number, default: 0 },
    coverImage: { type: String },
  },
  {
    timestamps: true,
    collection: 'pinterest_boards',
  }
);

// Indexes for efficient queries
PinterestBoardSchema.index({ accountId: 1 });
PinterestBoardSchema.index({ pinterestBoardId: 1 });
PinterestBoardSchema.index({ name: 'text', description: 'text' });

export const PinterestBoard = mongoose.model<IPinterestBoardDocument>(
  'PinterestBoard',
  PinterestBoardSchema
);