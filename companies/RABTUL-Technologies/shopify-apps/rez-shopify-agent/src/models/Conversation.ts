/**
 * ReZ Agent - Conversation Model
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  conversationId: string;
  shop: string;
  tenantId: string;
  brandId: string;
  customerId?: string;
  customerEmail?: string;
  platform: 'web' | 'whatsapp' | 'instagram' | 'facebook';
  status: 'active' | 'resolved' | 'escalated';
  messages: Message[];
  context: {
    currentOrder?: string;
    currentProduct?: string;
    cartItems?: string[];
    intent?: string;
    sentiment?: 'positive' | 'neutral' | 'negative';
  };
  agentId?: string;
  startedAt: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  type: 'customer' | 'agent' | 'bot';
  content: string;
  timestamp: Date;
  attachments?: string[];
  quickReplies?: string[];
  intent?: string;
  confidence?: number;
}

const MessageSchema = new Schema({
  id: String,
  type: { type: String, enum: ['customer', 'agent', 'bot'] },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  attachments: [String],
  quickReplies: [String],
  intent: String,
  confidence: Number,
}, { _id: false });

const ContextSchema = new Schema({
  currentOrder: String,
  currentProduct: String,
  cartItems: [String],
  intent: String,
  sentiment: String,
}, { _id: false });

const ConversationSchema = new Schema({
  conversationId: { type: String, required: true, unique: true, index: true },
  shop: { type: String, required: true, lowercase: true, index: true },
  tenantId: { type: String, required: true, index: true },
  brandId: { type: String, required: true, index: true },
  customerId: String,
  customerEmail: String,
  platform: { type: String, enum: ['web', 'whatsapp', 'instagram', 'facebook'], default: 'web' },
  status: { type: String, enum: ['active', 'resolved', 'escalated'], default: 'active' },
  messages: [MessageSchema],
  context: ContextSchema,
  agentId: String,
  startedAt: { type: Date, default: Date.now },
  resolvedAt: Date,
}, {
  timestamps: true,
  collection: 'conversations',
});

ConversationSchema.index({ shop: 1, status: 1 });
ConversationSchema.index({ customerId: 1 });
ConversationSchema.index({ tenantId: 1 });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);

export interface IAgentKnowledge extends Document {
  shop: string;
  tenantId: string;
  category: 'faq' | 'product' | 'policy' | 'troubleshooting';
  question: string;
  answer: string;
  keywords: string[];
  active: boolean;
  createdAt: Date;
}

const AgentKnowledgeSchema = new Schema({
  shop: { type: String, required: true, lowercase: true, index: true },
  tenantId: { type: String, required: true, index: true },
  category: { type: String, enum: ['faq', 'product', 'policy', 'troubleshooting'], required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  keywords: [String],
  active: { type: Boolean, default: true },
}, {
  timestamps: true,
  collection: 'agent_knowledge',
});

AgentKnowledgeSchema.index({ shop: 1, active: 1 });
AgentKnowledgeSchema.index({ shop: 1, keywords: 1 });

export const AgentKnowledge = mongoose.model<IAgentKnowledge>('AgentKnowledge', AgentKnowledgeSchema);
