import mongoose, { Schema, Document } from 'mongoose';

// ============================================
// UNIVERSAL RELATIONSHIP GRAPH MODELS
// ============================================

// Entity Types
export type EntityType =
  | 'customer' | 'lead' | 'merchant' | 'employee'
  | 'partner' | 'vendor' | 'franchisee' | 'patient'
  | 'guest' | 'driver' | 'owner' | 'user'
  | 'property' | 'vehicle' | 'product' | 'service'
  | 'organization' | 'branch' | 'department';

// Base Entity Model
export interface IEntity extends Document {
  entityId: string;
  type: EntityType;
  source: string; // Which product created this (e.g., 'hotel', 'restaurant', 'retail')
  sourceId: string; // Original ID in source system
  name: string;
  email?: string;
  phone: string;
  alternatePhones: string[];
  avatar?: string;
  metadata: Record<string, any>;
  tags: string[];
  segments: string[];
  healthScore: number; // 0-100
  riskScore: number; // 0-100
  lifetimeValue: number;
  createdAt: Date;
  updatedAt: Date;
}

const EntitySchema = new Schema<IEntity>({
  entityId: { type: String, required: true, unique: true, index: true },
  type: { type: String, enum: ['customer', 'lead', 'merchant', 'employee', 'partner', 'vendor', 'franchisee', 'patient', 'guest', 'driver', 'owner', 'user', 'property', 'vehicle', 'product', 'service', 'organization', 'branch', 'department'], required: true, index: true },
  source: { type: String, required: true, index: true },
  sourceId: { type: String, required: true },
  name: { type: String, required: true },
  email: String,
  phone: { type: String, required: true, index: true },
  alternatePhones: [String],
  avatar: String,
  metadata: { type: Schema.Types.Mixed, default: {} },
  tags: [String],
  segments: [String],
  healthScore: { type: Number, default: 100, min: 0, max: 100 },
  riskScore: { type: Number, default: 0, min: 0, max: 100 },
  lifetimeValue: { type: Number, default: 0 },
}, { timestamps: true });

EntitySchema.index({ type: 1, source: 1 });
EntitySchema.index({ phone: 1 });
EntitySchema.index({ email: 1 });
EntitySchema.index({ healthScore: 1, riskScore: 1 });

export const Entity = mongoose.model<IEntity>('Entity', EntitySchema);

// Relationship Model
export interface IRelationship extends Document {
  relationshipId: string;
  fromEntityId: string;
  toEntityId: string;
  type: string; // 'owns', 'manages', 'referred', 'works_at', 'bought_from', etc.
  strength: number; // 0-100
  metadata: Record<string, any>;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

const RelationshipSchema = new Schema<IRelationship>({
  relationshipId: { type: String, required: true, unique: true, index: true },
  fromEntityId: { type: String, required: true, index: true },
  toEntityId: { type: String, required: true, index: true },
  type: { type: String, required: true },
  strength: { type: Number, default: 50, min: 0, max: 100 },
  metadata: { type: Schema.Types.Mixed, default: {} },
  source: { type: String, required: true },
}, { timestamps: true });

RelationshipSchema.index({ fromEntityId: 1, type: 1 });
RelationshipSchema.index({ toEntityId: 1, type: 1 });

export const Relationship = mongoose.model<IRelationship>('Relationship', RelationshipSchema);

// Interaction/Timeline Model
export interface IInteraction extends Document {
  interactionId: string;
  entityId: string;
  type: 'call' | 'email' | 'whatsapp' | 'sms' | 'meeting' | 'purchase' | 'support' | 'chat' | 'visit';
  direction: 'inbound' | 'outbound' | 'system';
  channel?: string;
  summary?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  intent?: string;
  value?: number;
  metadata: Record<string, any>;
  createdBy?: string;
  aiGenerated?: boolean;
  createdAt: Date;
}

const InteractionSchema = new Schema<IInteraction>({
  interactionId: { type: String, required: true, unique: true, index: true },
  entityId: { type: String, required: true, index: true },
  type: { type: String, enum: ['call', 'email', 'whatsapp', 'sms', 'meeting', 'purchase', 'support', 'chat', 'visit'], required: true },
  direction: { type: String, enum: ['inbound', 'outbound', 'system'], default: 'system' },
  channel: String,
  summary: String,
  sentiment: { type: String, enum: ['positive', 'neutral', 'negative'] },
  intent: String,
  value: Number,
  metadata: { type: Schema.Types.Mixed, default: {} },
  createdBy: String,
  aiGenerated: { type: Boolean, default: false },
}, { timestamps: { createdAt: true, updatedAt: false } });

InteractionSchema.index({ entityId: 1, createdAt: -1 });
InteractionSchema.index({ type: 1, createdAt: -1 });
InteractionSchema.index({ sentiment: 1 });

export const Interaction = mongoose.model<IInteraction>('Interaction', InteractionSchema);

// AI Task/Action Model
export interface IAITask extends Document {
  taskId: string;
  entityId?: string;
  type: string; // 'follow_up', 'reminder', 'report', 'analysis', 'campaign'
  title: string;
  description: string;
  assignedTo: string; // Agent ID
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  result?: any;
  error?: string;
  scheduledFor?: Date;
  completedAt?: Date;
  createdBy?: string;
  aiInitiated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AITaskSchema = new Schema<IAITask>({
  taskId: { type: String, required: true, unique: true, index: true },
  entityId: String,
  type: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  assignedTo: { type: String, required: true, index: true },
  status: { type: String, enum: ['pending', 'in_progress', 'completed', 'failed'], default: 'pending', index: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  result: Schema.Types.Mixed,
  error: String,
  scheduledFor: Date,
  completedAt: Date,
  createdBy: String,
  aiInitiated: { type: Boolean, default: false },
}, { timestamps: true });

AITaskSchema.index({ assignedTo: 1, status: 1 });
AITaskSchema.index({ scheduledFor: 1, status: 1 });

export const AITask = mongoose.model<IAITask>('AITask', AITaskSchema);

// Conversation/Session Model
export interface IConversation extends Document {
  conversationId: string;
  entityId: string;
  agentId?: string;
  type: 'chat' | 'call' | 'whatsapp';
  messages: Array<{
    role: 'user' | 'ai' | 'system';
    content: string;
    timestamp: Date;
    attachments?: any[];
  }>;
  context: Record<string, any>;
  status: 'active' | 'closed';
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>({
  conversationId: { type: String, required: true, unique: true, index: true },
  entityId: { type: String, required: true, index: true },
  agentId: String,
  type: { type: String, enum: ['chat', 'call', 'whatsapp'], default: 'chat' },
  messages: [{
    role: { type: String, enum: ['user', 'ai', 'system'] },
    content: String,
    timestamp: { type: Date, default: Date.now },
    attachments: [Schema.Types.Mixed],
  }],
  context: { type: Schema.Types.Mixed, default: {} },
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  summary: String,
}, { timestamps: true });

ConversationSchema.index({ entityId: 1, createdAt: -1 });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);

// Metric/Event Model
export interface IMetric extends Document {
  metricId: string;
  entityId?: string;
  source: string;
  metricType: string; // 'revenue', 'conversion', 'engagement', etc.
  value: number;
  unit?: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  periodStart: Date;
  periodEnd: Date;
  metadata: Record<string, any>;
  createdAt: Date;
}

const MetricSchema = new Schema<IMetric>({
  metricId: { type: String, required: true, unique: true, index: true },
  entityId: String,
  source: { type: String, required: true, index: true },
  metricType: { type: String, required: true, index: true },
  value: { type: Number, required: true },
  unit: String,
  period: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'], default: 'daily' },
  periodStart: Date,
  periodEnd: Date,
  metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: { createdAt: true, updatedAt: false } });

MetricSchema.index({ entityId: 1, metricType: 1, periodStart: -1 });
MetricSchema.index({ source: 1, metricType: 1, periodStart: -1 });

export const Metric = mongoose.model<IMetric>('Metric', MetricSchema);

// Knowledge Document Model
export interface IKnowledgeDocument extends Document {
  documentId: string;
  title: string;
  content: string;
  type: 'sop' | 'policy' | 'faq' | 'guide' | 'contract' | 'template';
  category: string;
  tags: string[];
  metadata: Record<string, any>;
  embeddings?: number[]; // For vector search
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeDocumentSchema = new Schema<IKnowledgeDocument>({
  documentId: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['sop', 'policy', 'faq', 'guide', 'contract', 'template'], required: true },
  category: { type: String, required: true, index: true },
  tags: [String],
  metadata: { type: Schema.Types.Mixed, default: {} },
  embeddings: [Number],
  createdBy: String,
}, { timestamps: true });

KnowledgeDocumentSchema.index({ title: 'text', content: 'text' });
KnowledgeDocumentSchema.index({ type: 1, category: 1 });

export const KnowledgeDocument = mongoose.model<IKnowledgeDocument>('KnowledgeDocument', KnowledgeDocumentSchema);

export default {
  Entity,
  Relationship,
  Interaction,
  AITask,
  Conversation,
  Metric,
  KnowledgeDocument,
};