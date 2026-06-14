// ============================================================================
// Role AI Agents - Agent Session Model
// ============================================================================

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { JobRole, AgentLevel, ChatMessage } from '../types';

export interface IAgentSession extends Document {
  sessionId: string;
  userId?: string;
  role: JobRole;
  level: AgentLevel;
  messages: ChatMessage[];
  messageCount: number;
  lastActivity: Date;
  metadata: {
    language?: string;
    source?: string;
    userAgent?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<ChatMessage>(
  {
    role: {
      type: String,
      required: true,
      enum: ['user', 'assistant', 'system'],
    },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const AgentSessionSchema = new Schema<IAgentSession>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      index: true,
    },
    role: {
      type: String,
      required: true,
      enum: [
        'software-engineer',
        'sales',
        'marketing',
        'finance',
        'hr',
        'operations',
        'product',
        'design',
        'support',
        'admin',
      ],
    },
    level: {
      type: String,
      required: true,
      enum: ['L1', 'L2', 'L3', 'L4'],
    },
    messages: {
      type: [ChatMessageSchema],
      default: [],
    },
    messageCount: {
      type: Number,
      default: 0,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
      index: true,
    },
    metadata: {
      language: { type: String },
      source: { type: String },
      userAgent: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding user sessions
AgentSessionSchema.index({ userId: 1, createdAt: -1 });

// TTL index for auto-expiring sessions after 7 days
AgentSessionSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

export const AgentSession: Model<IAgentSession> = mongoose.model<IAgentSession>('AgentSession', AgentSessionSchema);
