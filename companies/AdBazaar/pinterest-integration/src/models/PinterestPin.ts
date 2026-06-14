import mongoose, { Document, Schema } from 'mongoose';
import { IPinterestPin } from '../types';

export interface IPinterestPinDocument extends IPinterestPin, Document {}

const PinterestPinSchema = new Schema<IPinterestPinDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    pinterestPinId: { type: String, required: true, unique: true, index: true },
    boardId: { type: String, required: true, index: true },
    accountId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    link: { type: String },
    mediaUrl: { type: String, required: true },
    mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
    altText: { type: String },
    keywords: { type: [String], default: [] },
    ctaLink: { type: String },
    viewCount: { type: Number, default: 0 },
    repinCount: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
    savedCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published', 'failed'],
      default: 'draft',
    },
    scheduledTime: { type: Date },
    publishedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'pinterest_pins',
  }
);

// Indexes for efficient queries
PinterestPinSchema.index({ accountId: 1 });
PinterestPinSchema.index({ boardId: 1 });
PinterestPinSchema.index({ status: 1 });
PinterestPinSchema.index({ keywords: 1 });
PinterestPinSchema.index({ title: 'text', description: 'text' });
PinterestPinSchema.index({ scheduledTime: 1 }, { sparse: true });

// Virtual for checking if pin is scheduled
PinterestPinSchema.virtual('isScheduled').get(function () {
  return this.status === 'scheduled' && this.scheduledTime;
});

export const PinterestPin = mongoose.model<IPinterestPinDocument>(
  'PinterestPin',
  PinterestPinSchema
);