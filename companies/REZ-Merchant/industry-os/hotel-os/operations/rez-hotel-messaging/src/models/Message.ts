/**
 * Message Model
 */

import mongoose, { Schema, Document } from 'mongoose';
import { Message } from '../types';

export interface IMessage extends Omit<Message, 'id'>, Document {}

const MessageSchema = new Schema<IMessage>(
  {
    id: { type: String, required: true, unique: true, index: true },
    conversationId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    senderType: {
      type: String,
      enum: ['guest', 'staff', 'hotel', 'system', 'bot'],
      required: true,
    },
    senderName: { type: String },
    recipientId: { type: String, required: true },
    recipientType: {
      type: String,
      enum: ['guest', 'staff', 'hotel', 'system'],
      required: true,
    },
    subject: { type: String },
    content: { type: String, required: true },
    type: {
      type: String,
      enum: ['text', 'image', 'document', 'system', 'template'],
      default: 'text',
    },
    templateId: { type: String },
    metadata: { type: Schema.Types.Mixed },
    attachments: [
      {
        url: String,
        type: String,
        name: String,
        size: Number,
      },
    ],
    readBy: [
      {
        userId: String,
        readAt: { type: Date, default: Date.now },
      },
    ],
    isRead: { type: Boolean, default: false },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read', 'failed'],
      default: 'sent',
    },
  },
  {
    timestamps: true,
    collection: 'hotel_messages',
  }
);

MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ recipientId: 1, isRead: 1 });

export const MessageModel = mongoose.model<IMessage>('Message', MessageSchema);
