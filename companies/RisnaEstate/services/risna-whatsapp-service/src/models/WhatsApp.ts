import mongoose, { Schema, Document } from 'mongoose';

export enum MessageType {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound'
}

export enum MessageStatus {
  RECEIVED = 'received',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
}

export enum InquiryStatus {
  NEW = 'new',
  REPLIED = 'replied',
  CONVERTED = 'converted',
  CLOSED = 'closed'
}

export interface IConversation extends Document {
  phone: string;
  name?: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  messageCount: number;
  status: 'active' | 'closed';
  tags?: string[];
  assignedBrokerId?: string;
  deletedAt?: Date;
}

export interface IInquiry extends Document {
  phone: string;
  name?: string;
  propertyId?: string;
  message: string;
  source: 'whatsapp' | 'web' | 'qr';
  status: InquiryStatus;
  brokerId?: string;
  responses?: string[];
  convertedAt?: Date;
  deletedAt?: Date;
}

export interface IAutoReply extends Document {
  keyword: string;
  response: string;
  type: 'greeting' | 'property' | 'visit' | 'brochure' | 'price' | 'custom';
  active: boolean;
  priority: number;
}

const ConversationSchema = new Schema<IConversation>({
  phone: { type: String, required: true, index: true },
  name: String,
  lastMessage: String,
  lastMessageAt: Date,
  messageCount: { type: Number, default: 1 },
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  tags: [String],
  assignedBrokerId: String,
  deletedAt: Date
}, { timestamps: true });

ConversationSchema.index({ phone: 1, lastMessageAt: -1 });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);

const InquirySchema = new Schema<IInquiry>({
  phone: { type: String, required: true, index: true },
  name: String,
  propertyId: String,
  message: { type: String, required: true },
  source: { type: String, enum: ['whatsapp', 'web', 'qr'], default: 'whatsapp' },
  status: { type: String, enum: Object.values(InquiryStatus), default: InquiryStatus.NEW },
  brokerId: String,
  responses: [String],
  convertedAt: Date,
  deletedAt: Date
}, { timestamps: true });

InquirySchema.index({ status: 1, createdAt: -1 });
InquirySchema.index({ brokerId: 1, status: 1 });

export const Inquiry = mongoose.model<IInquiry>('Inquiry', InquirySchema);

const AutoReplySchema = new Schema<IAutoReply>({
  keyword: { type: String, required: true, unique: true },
  response: { type: String, required: true },
  type: { type: String, enum: Object.values(MessageType), default: 'custom' },
  active: { type: Boolean, default: true },
  priority: { type: Number, default: 0 }
});

AutoReplySchema.index({ keyword: 1, active: 1 });

export const AutoReply = mongoose.model<IAutoReply>('AutoReply', AutoReplySchema);
