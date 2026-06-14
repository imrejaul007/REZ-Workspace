import mongoose from 'mongoose';

export interface IChat extends mongoose.Document {
  conversationId: string;
  participants: string[];
  messages: IMessage[];
  lastMessage?: IMessage;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage {
  id?: string;
  senderId: string;
  senderType: 'user' | 'driver';
  text: string;
  type: 'text' | 'location' | 'image' | 'receipt';
  readAt?: Date;
  createdAt?: Date;
}

const MessageSchema = new mongoose.Schema({
  senderId: { type: String, required: true },
  senderType: { type: String, enum: ['user', 'driver'] },
  text: { type: String },
  type: { type: String, enum: ['text', 'location', 'image', 'receipt'], default: 'text' },
  readAt: Date,
}, { timestamps: true });

const ChatSchema = new mongoose.Schema({
  conversationId: { type: String, unique: true },
  participants: [String],
  messages: [MessageSchema],
  lastMessage: MessageSchema,
  unreadCount: { type: Number, default: 0 },
}, { timestamps: true });

export const Chat = mongoose.model<IChat>('Chat', ChatSchema);

// Type alias for TypeScript
export type Chat = IChat;
