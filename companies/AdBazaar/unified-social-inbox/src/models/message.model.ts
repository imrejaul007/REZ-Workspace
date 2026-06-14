import mongoose, { Schema, Document } from 'mongoose';
import { IMessage, Platform, MessageSender, MediaType } from '../types';

export interface MessageDocument extends Omit<IMessage, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const MessageSenderSchema = new Schema({
  type: { type: String, enum: ['user', 'agent'], required: true },
  platformUserId: { type: String },
  agentId: { type: String },
}, { _id: false });

const MessageMetadataSchema = new Schema({
  quickReply: { type: String },
  templateUsed: { type: String },
}, { _id: false });

const MessageSchema = new Schema<MessageDocument>({
  conversationId: { type: String, required: true, index: true },
  platform: {
    type: String,
    enum: ['instagram', 'facebook', 'twitter', 'linkedin', 'whatsapp'],
    required: true,
  },
  platformMessageId: { type: String, required: true, unique: true, index: true },
  sender: { type: MessageSenderSchema, required: true },
  content: { type: String, required: true },
  mediaUrl: { type: String },
  mediaType: { type: String, enum: ['image', 'video', 'audio'] },
  timestamp: { type: Date, required: true, index: true },
  read: { type: Boolean, default: false, index: true },
  metadata: { type: MessageMetadataSchema },
}, {
  timestamps: true,
});

// Compound indexes for common queries
MessageSchema.index({ conversationId: 1, timestamp: -1 });
MessageSchema.index({ conversationId: 1, read: 1 });
MessageSchema.index({ platform: 1, timestamp: -1 });
MessageSchema.index({ 'sender.type': 1, timestamp: -1 });

// Virtual for id field
MessageSchema.virtual('id').get(function(this: MessageDocument) {
  return this._id.toHexString();
});

// Ensure virtuals are included in JSON
MessageSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Message = mongoose.model<MessageDocument>('Message', MessageSchema);
