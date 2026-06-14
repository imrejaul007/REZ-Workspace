import mongoose, { Schema, Document } from 'mongoose';
import type { HeartbeatDocument } from '../types/index.js';

const HeartbeatSchema = new Schema<HeartbeatDocument>({
  deviceId: {
    type: String,
    required: true,
    index: true,
  },
  contentId: {
    type: String,
    required: true,
    index: true,
  },
  position: {
    type: Number,
    required: true,
  },
  quality: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
  },
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  createdAt: { type: Date, default: Date.now },
});

// Indexes for session management
HeartbeatSchema.index({ sessionId: 1, createdAt: -1 });
HeartbeatSchema.index({ deviceId: 1, contentId: 1 });
HeartbeatSchema.index({ createdAt: -1 });

export const Heartbeat = mongoose.model<HeartbeatDocument>('Heartbeat', HeartbeatSchema);
