/**
 * AI Agent Studio - Models
 */

import mongoose, { Schema } from 'mongoose';

// ============================================
// AGENT DEFINITION
// ============================================

const AgentSchema = new Schema({
  name: { type: String, required: true },
  description: String,

  // Owner
  userId: { type: String, required: true, index: true },
  merchantId: String,

  // Type
  type: {
    type: String,
    enum: ['customer_support', 'sales', 'marketing', 'operations', 'custom'],
    required: true
  },

  // Personality & Behavior
  personality: {
    tone: { type: String, enum: ['friendly', 'professional', 'casual', 'formal'], default: 'friendly' },
    language: { type: String, default: 'en' },
    emoji: { type: Boolean, default: true },
  },

  // System prompt / instructions
  systemPrompt: { type: String, required: true },
  context: String,

  // Capabilities
  capabilities: [{
    type: {
      type: String,
      enum: ['answer_questions', 'book_appointments', 'process_orders', 'handle_returns', 'provide_recommendations', 'collect_feedback', 'generate_content', 'analyze_data']
    },
    enabled: { type: Boolean, default: true },
    config: Schema.Types.Mixed,
  }],

  // Tools / Integrations
  tools: [{
    name: String,
    enabled: { type: Boolean, default: true },
    config: Schema.Types.Mixed,
  }],

  // Training data
  trainingData: [{
    query: String,
    response: String,
    category: String,
  }],

  // Knowledge base
  knowledgeBase: {
    enabled: { type: Boolean, default: false },
    sources: [{
      type: { type: String, enum: ['faq', 'docs', 'products', 'orders'] },
      sourceId: String,
      content: String,
    }],
  },

  // Model config
  model: {
    provider: { type: String, enum: ['openai', 'anthropic', 'google'], default: 'openai' },
    model: { type: String, default: 'gpt-4' },
    temperature: { type: Number, default: 0.7, min: 0, max: 2 },
    maxTokens: { type: Number, default: 1000 },
  },

  // Settings
  settings: {
    maxConversations: { type: Number, default: 1000 },
    autoReply: { type: Boolean, default: true },
    responseDelay: { type: Number, default: 0 }, // seconds
  },

  // Status
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'archived'],
    default: 'draft'
  },

  // Stats
  stats: {
    totalConversations: { type: Number, default: 0 },
    totalMessages: { type: Number, default: 0 },
    avgResponseTime: { type: Number, default: 0 },
    satisfaction: { type: Number, default: 0 },
    lastConversation: Date,
  },
}, { timestamps: true });

AgentSchema.index({ userId: 1, status: 1 });
AgentSchema.index({ type: 1, status: 1 });

export const Agent = mongoose.models.Agent || mongoose.model('Agent', AgentSchema);

// ============================================
// CONVERSATION
// ============================================

const ConversationSchema = new Schema({
  agentId: { type: Schema.Types.ObjectId, ref: 'Agent', required: true, index: true },
  sessionId: { type: String, required: true, index: true },

  // User info
  userId: String,
  userPhone: String,
  userName: String,

  // Channel
  channel: {
    type: String,
    enum: ['whatsapp', 'web', 'api', 'voice'],
    default: 'web'
  },

  // Messages
  messages: [{
    role: { type: String, enum: ['user', 'assistant', 'system', 'tool'] },
    content: String,
    timestamp: { type: Date, default: Date.now },
    metadata: Schema.Types.Mixed,
  }],

  // Status
  status: {
    type: String,
    enum: ['active', 'resolved', 'escalated', 'closed'],
    default: 'active'
  },

  // Context
  context: {
    currentIntent: String,
    entities: Schema.Types.Mixed,
    variables: Schema.Types.Mixed,
  },

  // Analytics
  startedAt: { type: Date, default: Date.now },
  lastMessageAt: { type: Date, default: Date.now },
  endedAt: Date,
  duration: Number,

  // Satisfaction
  rating: { type: Number, min: 1, max: 5 },
  feedback: String,
}, { timestamps: true });

ConversationSchema.index({ agentId: 1, status: 1 });
ConversationSchema.index({ sessionId: 1 });
ConversationSchema.index({ userId: 1, createdAt: -1 });

export const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);

// ============================================
// KNOWLEDGE BASE
// ============================================

const KnowledgeItemSchema = new Schema({
  agentId: { type: Schema.Types.ObjectId, ref: 'Agent', required: true, index: true },
  category: { type: String, required: true },

  // Content
  question: String,
  answer: { type: String, required: true },
  tags: [String],

  // Metadata
  source: String,
  confidence: { type: Number, default: 1, min: 0, max: 1 },

  // Usage
  usageCount: { type: Number, default: 0 },
  lastUsed: Date,

  active: { type: Boolean, default: true },
}, { timestamps: true });

KnowledgeItemSchema.index({ agentId: 1, category: 1 });
KnowledgeItemSchema.index({ question: 'text' });

export const KnowledgeItem = mongoose.models.KnowledgeItem || mongoose.model('KnowledgeItem', KnowledgeItemSchema);

// ============================================
// ANALYTICS
// ============================================

const AgentAnalyticsSchema = new Schema({
  agentId: { type: Schema.Types.ObjectId, ref: 'Agent', required: true, index: true },
  date: { type: Date, required: true, index: true },

  // Counts
  conversations: { type: Number, default: 0 },
  messages: { type: Number, default: 0 },
  resolved: { type: Number, default: 0 },
  escalated: { type: Number, default: 0 },

  // Performance
  avgResponseTime: { type: Number, default: 0 },
  avgSessionDuration: { type: Number, default: 0 },

  // Satisfaction
  avgRating: { type: Number, default: 0 },
  totalRatings: { type: Number, default: 0 },

  // Intents
  intentDistribution: [{
    intent: String,
    count: Number,
  }],

  // Errors
  errors: { type: Number, default: 0 },
  fallbacks: { type: Number, default: 0 },
}, { timestamps: true });

AgentAnalyticsSchema.index({ agentId: 1, date: -1 });

export const AgentAnalytics = mongoose.models.AgentAnalytics || mongoose.model('AgentAnalytics', AgentAnalyticsSchema);
