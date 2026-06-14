import mongoose, { Schema, Document } from 'mongoose';
import { WebSocketMessage } from '../types';

// ==========================================
// Message Document Interface
// ==========================================

export interface IMessageDocument extends Omit<WebSocketMessage, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
  deliveryStatus?: Map<string, 'pending' | 'delivered' | 'failed'>;
}

// ==========================================
// Message Schema
// ==========================================

const MessageSchema = new Schema<IMessageDocument>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      index: true,
    },
    room: {
      type: String,
      required: true,
      index: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    senderId: {
      type: String,
      index: true,
    },
    deliveryStatus: {
      type: Map,
      of: String,
      default: new Map(),
    },
  },
  {
    collection: 'messages',
    timestamps: false,
  }
);

// ==========================================
// Indexes
// ==========================================

MessageSchema.index({ room: 1, timestamp: -1 });
MessageSchema.index({ senderId: 1, timestamp: -1 });
MessageSchema.index({ type: 1, room: 1, timestamp: -1 });

// ==========================================
// Static Methods
// ==========================================

MessageSchema.statics.findByRoom = function (
  roomId: string,
  limit = 50,
  before?: Date
): Promise<IMessageDocument[]> {
  const query: Record<string, unknown> = { room: roomId };
  if (before) {
    query.timestamp = { $lt: before };
  }
  return this.find(query).sort({ timestamp: -1 }).limit(limit).exec();
};

MessageSchema.statics.findByUserId = function (
  userId: string,
  limit = 50
): Promise<IMessageDocument[]> {
  return this.find({ senderId: userId }).sort({ timestamp: -1 }).limit(limit).exec();
};

// ==========================================
// Export
// ==========================================

export const Message = mongoose.model<IMessageDocument>('Message', MessageSchema);
