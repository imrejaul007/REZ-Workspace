/**
 * Conversation Model for AI Front Desk Service
 */

import mongoose, { Document, Schema } from 'mongoose';

export type MessageRole = 'guest' | 'ai' | 'staff';

export interface IConversationMessage {
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export interface IConversation extends Document {
  guestId?: string;
  roomNumber: string;
  messages: IConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ConversationMessageSchema = new Schema<IConversationMessage>(
  {
    role: {
      type: String,
      required: true,
      enum: ['guest', 'ai', 'staff'],
    },
    content: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ConversationSchema = new Schema<IConversation>(
  {
    guestId: { type: String, trim: true },
    roomNumber: { type: String, required: true, trim: true },
    messages: { type: [ConversationMessageSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

// Indexes
ConversationSchema.index({ guestId: 1 });
ConversationSchema.index({ roomNumber: 1 });
ConversationSchema.index({ createdAt: -1 });

export const Conversation = mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);

export default Conversation;