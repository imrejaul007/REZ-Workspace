import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMessage extends Document {
  conversationId: Types.ObjectId;
  senderId: string;
  senderType: 'user' | 'advertiser' | 'system' | 'bot';
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system' | 'action';
  metadata?: {
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    actionType?: string;
    actionData?: Record<string, unknown>;
  };
  attachments?: Array<{
    type: 'image' | 'file';
    url: string;
    name: string;
    size: number;
  }>;
  readBy: Array<{
    userId: string;
    readAt: Date;
  }>;
  status: 'sent' | 'delivered' | 'read';
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    senderId: { type: String, required: true, index: true },
    senderType: {
      type: String,
      enum: ['user', 'advertiser', 'system', 'bot'],
      default: 'user',
    },
    content: { type: String, required: true },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'system', 'action'],
      default: 'text',
    },
    metadata: {
      fileUrl: String,
      fileName: String,
      fileSize: Number,
      actionType: String,
      actionData: Schema.Types.Mixed,
    },
    attachments: [{
      type: { type: String, enum: ['image', 'file'] },
      url: String,
      name: String,
      size: Number,
    }],
    readBy: [{
      userId: String,
      readAt: { type: Date, default: Date.now },
    }],
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },
  },
  {
    timestamps: true,
  }
);

MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ status: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);