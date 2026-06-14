import mongoose, { Schema, Document } from 'mongoose';
import type {
  CopilotConversation,
  CopilotMessage,
  CopilotContext,
} from '../types/index.js';

export interface ConversationDocument extends Omit<CopilotConversation, 'messages' | 'context'>, Document {
  messages: CopilotMessage[];
  context: CopilotContext;
}

const MessageActionSchema = new Schema({
  type: {
    type: String,
    enum: ['create_campaign', 'pause_campaign', 'adjust_budget', 'generate_report', 'recommend'],
    required: true,
  },
  params: { type: Schema.Types.Mixed, required: true },
  executed: { type: Boolean, default: false },
  result: { type: Schema.Types.Mixed },
}, { _id: false });

const MessageSchema = new Schema({
  id: { type: String, required: true },
  role: {
    type: String,
    enum: ['user', 'copilot', 'system'],
    required: true,
  },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  actions: [MessageActionSchema],
}, { _id: false });

const CampaignSummarySchema = new Schema({
  campaignId: { type: String, required: true },
  name: { type: String, required: true },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'draft'],
    required: true,
  },
  budget: { type: Number, required: true },
  spent: { type: Number, required: true },
  impressions: { type: Number, required: true },
  clicks: { type: Number, required: true },
  ctr: { type: Number, required: true },
  cpc: { type: Number, required: true },
  conversions: { type: Number, required: true },
}, { _id: false });

const CampaignMetricsSchema = new Schema({
  totalCampaigns: { type: Number, required: true },
  activeCampaigns: { type: Number, required: true },
  totalSpend: { type: Number, required: true },
  totalImpressions: { type: Number, required: true },
  totalClicks: { type: Number, required: true },
  totalConversions: { type: Number, required: true },
  averageCtr: { type: Number, required: true },
  averageCpc: { type: Number, required: true },
  roas: { type: Number, required: true },
  period: {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
  },
}, { _id: false });

const ContextSchema = new Schema({
  currentCampaigns: [CampaignSummarySchema],
  recentMetrics: CampaignMetricsSchema,
  recommendations: [{ type: String }],
}, { _id: false });

const ConversationSchema = new Schema({
  conversationId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  advertiserId: {
    type: String,
    required: true,
    index: true,
  },
  campaignId: {
    type: String,
    index: true,
  },
  messages: [MessageSchema],
  context: ContextSchema,
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active',
    index: true,
  },
}, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
});

// Indexes for efficient querying
ConversationSchema.index({ advertiserId: 1, status: 1, createdAt: -1 });
ConversationSchema.index({ advertiserId: 1, campaignId: 1 });

// Instance methods
ConversationSchema.methods.addMessage = function(message: CopilotMessage) {
  this.messages.push(message);
  this.updatedAt = new Date();
  return this.save();
};

ConversationSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

// Static methods
ConversationSchema.statics.findByAdvertiser = function(advertiserId: string, status?: string) {
  const query: Record<string, unknown> = { advertiserId };
  if (status) {
    query.status = status;
  }
  return this.find(query).sort({ updatedAt: -1 });
};

ConversationSchema.statics.findByConversationId = function(conversationId: string) {
  return this.findOne({ conversationId });
};

export const Conversation = mongoose.model<ConversationDocument>('Conversation', ConversationSchema);