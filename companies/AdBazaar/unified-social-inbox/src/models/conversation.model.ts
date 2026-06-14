import mongoose, { Schema, Document } from 'mongoose';
import { IConversation, Platform, ConversationStatus, Priority, Sentiment } from '../types';

export interface ConversationDocument extends Omit<IConversation, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const PlatformUserSchema = new Schema({
  platformUserId: { type: String, required: true },
  username: { type: String, required: true },
  displayName: { type: String, required: true },
  profileImage: { type: String },
  followerCount: { type: Number },
}, { _id: false });

const LastMessageSchema = new Schema({
  content: { type: String },
  sender: { type: String, enum: ['user', 'agent'] },
  timestamp: { type: Date },
}, { _id: false });

const ConversationSchema = new Schema<ConversationDocument>({
  platformConversationId: { type: String, required: true, unique: true, index: true },
  platform: {
    type: String,
    enum: ['instagram', 'facebook', 'twitter', 'linkedin', 'whatsapp'],
    required: true,
    index: true,
  },
  user: { type: PlatformUserSchema, required: true },
  accountId: { type: String, required: true, index: true },
  lastMessage: { type: LastMessageSchema },
  unreadCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['active', 'closed', 'snoozed'],
    default: 'active',
    index: true,
  },
  tags: [{ type: String, index: true }],
  assignee: { type: String, index: true },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
    index: true,
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    index: true,
  },
  snoozedUntil: { type: Date, index: true },
}, {
  timestamps: true,
});

// Compound indexes for common queries
ConversationSchema.index({ accountId: 1, status: 1 });
ConversationSchema.index({ accountId: 1, platform: 1, status: 1 });
ConversationSchema.index({ accountId: 1, assignee: 1, status: 1 });
ConversationSchema.index({ accountId: 1, priority: 1, status: 1 });
ConversationSchema.index({ updatedAt: -1, status: 1 });

// Virtual for id field
ConversationSchema.virtual('id').get(function(this: ConversationDocument) {
  return this._id.toHexString();
});

// Ensure virtuals are included in JSON
ConversationSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Conversation = mongoose.model<ConversationDocument>('Conversation', ConversationSchema);
