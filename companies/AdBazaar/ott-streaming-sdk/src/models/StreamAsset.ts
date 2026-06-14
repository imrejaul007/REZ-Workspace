import mongoose, { Schema, Document } from 'mongoose';
import type { StreamAssetDocument } from '../types/index.js';

const StreamQualitySchema = new Schema({
  url: { type: String, required: true },
  type: { type: String, enum: ['hls', 'dash'], required: true },
  quality: { type: String, required: true },
  bitrate: { type: Number, required: true },
}, { _id: false });

const DRMInfoSchema = new Schema({
  widevine: { type: Boolean, required: true },
  fairplay: { type: Boolean, required: true },
}, { _id: false });

const StreamAssetSchema = new Schema<StreamAssetDocument>({
  contentId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  streams: {
    type: [StreamQualitySchema],
    required: true,
  },
  thumbnail: {
    type: String,
    required: true,
  },
  drm: {
    type: DRMInfoSchema,
    required: true,
  },
  cdn: {
    type: String,
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

StreamAssetSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const StreamAsset = mongoose.model<StreamAssetDocument>('StreamAsset', StreamAssetSchema);
