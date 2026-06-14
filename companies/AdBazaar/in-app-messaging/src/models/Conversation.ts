import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IConversation extends Document {
  participants: Array<{
    userId: string;
    role: 'owner' | 'member' | 'admin';
    joinedAt: Date;
    lastReadAt?: Date;
    notifications: 'all' | 'mentions' | 'none';
 }>;
  type: 'direct' | 'group' | 'support' | 'campaign';
  title?: string;
  avatar?: string;
  metadata?: {
    campaignId?: string;
    advertiserId?: string;
    topic?: string;
  };
  lastMessage?: {
    messageId: Types.ObjectId;
    content: string;
    senderId: string;
    timestamp: Date;
  };
  isActive: boolean;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    participants: [{
      userId: { type: String, required: true },
      role: { type: String, enum: ['owner', 'member', 'admin'], default: 'member' },
      joinedAt: { type: Date, default: Date.now },
      lastReadAt: Date,
      notifications: { type: String, enum: ['all', 'mentions', 'none'], default: 'all' },
    }],
    type: {
      type: String,
      enum: ['direct', 'group', 'support', 'campaign'],
      default: 'direct',
      index: true,
    },
    title: String,
    avatar: String,
    metadata: {
      campaignId: String,
      advertiserId: String,
      topic: String,
    },
    lastMessage: {
      messageId: { type: Schema.Types.ObjectId, ref: 'Message' },
      content: String,
      senderId: String,
      timestamp: Date,
    },
    isActive: { type: Boolean, default: true, index: true },
    isPinned: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

ConversationSchema.index({ 'participants.userId': 1, isActive: 1 });
ConversationSchema.index({ type: 1, isActive: 1 });
ConversationSchema.index({ updatedAt: -1 });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);