import mongoose, { Schema, Document } from 'mongoose';
import type { PlaybackEventDocument } from '../types/index.js';

const PlaybackEventSchema = new Schema<PlaybackEventDocument>({
  eventId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  contentId: {
    type: String,
    required: true,
    index: true,
  },
  deviceId: {
    type: String,
    required: true,
    index: true,
  },
  eventType: {
    type: String,
    required: true,
    enum: ['play', 'pause', 'seek', 'buffer', 'complete', 'error'],
  },
  timestamp: {
    type: Date,
    required: true,
  },
  metadata: {
    position: { type: Number, required: true },
    quality: { type: String, required: true },
    bitrate: { type: Number, required: true },
    bufferDuration: { type: Number },
  },
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  createdAt: { type: Date, default: Date.now },
});

// Indexes for analytics queries
PlaybackEventSchema.index({ contentId: 1, eventType: 1 });
PlaybackEventSchema.index({ deviceId: 1, createdAt: -1 });
PlaybackEventSchema.index({ sessionId: 1, createdAt: -1 });

export const PlaybackEvent = mongoose.model<PlaybackEventDocument>('PlaybackEvent', PlaybackEventSchema);
