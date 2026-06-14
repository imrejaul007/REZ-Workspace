// Merchant AI Employee UI - MongoDB Models
import mongoose, { Schema, Document } from 'mongoose';

// ============== AI Agent Model ==============

export interface IAgent extends Document {
  merchantId: string;
  agentType: 'support' | 'sales' | 'conversational' | 'analytics' | 'escalation';
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'training' | 'error';
  personality: {
    tone: 'formal' | 'casual' | 'friendly' | 'professional';
    responseLength: 'short' | 'medium' | 'long';
    language: string;
  };
  capabilities: {
    maxConcurrentConversations: number;
    autoEscalation: boolean;
    sentimentAnalysis: boolean;
    multiTurnMemory: boolean;
    productRecommendations: boolean;
    dynamicPricing: boolean;
  };
  operatingHours: {
    enabled: boolean;
    timezone: string;
    schedule?: Record<string, { enabled: boolean; startTime: string; endTime: string }>;
  };
  escalationSettings: {
    autoEscalateOnSentiment: boolean;
    sentimentThreshold: number;
    maxBotHandoffs: number;
    handoffDelaySeconds: number;
  };
  metrics?: {
    totalConversations: number;
    avgResponseTime: number;
    satisfaction: number;
    lastUpdated: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AgentSchema = new Schema<IAgent>(
  {
    merchantId: { type: String, required: true, index: true },
    agentType: { type: String, required: true, enum: ['support', 'sales', 'conversational', 'analytics', 'escalation'] },
    name: { type: String, required: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    status: { type: String, enum: ['active', 'inactive', 'training', 'error'], default: 'inactive' },
    personality: {
      tone: { type: String, enum: ['formal', 'casual', 'friendly', 'professional'], default: 'friendly' },
      responseLength: { type: String, enum: ['short', 'medium', 'long'], default: 'medium' },
      language: { type: String, default: 'en' },
    },
    capabilities: {
      maxConcurrentConversations: { type: Number, default: 10 },
      autoEscalation: { type: Boolean, default: true },
      sentimentAnalysis: { type: Boolean, default: true },
      multiTurnMemory: { type: Boolean, default: true },
      productRecommendations: { type: Boolean, default: false },
      dynamicPricing: { type: Boolean, default: false },
    },
    operatingHours: {
      enabled: { type: Boolean, default: true },
      timezone: { type: String, default: 'Asia/Kolkata' },
      schedule: { type: Map, of: { enabled: Boolean, startTime: String, endTime: String } },
    },
    escalationSettings: {
      autoEscalateOnSentiment: { type: Boolean, default: true },
      sentimentThreshold: { type: Number, default: -0.5 },
      maxBotHandoffs: { type: Number, default: 3 },
      handoffDelaySeconds: { type: Number, default: 30 },
    },
    metrics: {
      totalConversations: { type: Number, default: 0 },
      avgResponseTime: { type: Number, default: 0 },
      satisfaction: { type: Number, default: 0 },
      lastUpdated: { type: Date },
    },
  },
  { timestamps: true }
);

AgentSchema.index({ merchantId: 1, agentType: 1 });
AgentSchema.index({ status: 1 });

export const Agent = mongoose.model<IAgent>('MerchantAIAgent', AgentSchema);

// ============== Training Data Model ==============

export interface ITrainingData extends Document {
  merchantId: string;
  agentId?: string;
  type: 'faq' | 'product' | 'policy' | 'conversation' | 'custom';
  question: string;
  answer: string;
  intent?: string;
  entities?: string[];
  metadata?: {
    category?: string;
    tags?: string[];
    confidence?: number;
    source?: string;
  };
  enabled: boolean;
  usageCount: number;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TrainingDataSchema = new Schema<ITrainingData>(
  {
    merchantId: { type: String, required: true, index: true },
    agentId: { type: String, index: true },
    type: { type: String, required: true, enum: ['faq', 'product', 'policy', 'conversation', 'custom'] },
    question: { type: String, required: true, maxlength: 1000 },
    answer: { type: String, required: true, maxlength: 5000 },
    intent: { type: String },
    entities: [{ type: String }],
    metadata: {
      category: String,
      tags: [String],
      confidence: Number,
      source: String,
    },
    enabled: { type: Boolean, default: true },
    usageCount: { type: Number, default: 0 },
    lastUsed: { type: Date },
  },
  { timestamps: true }
);

TrainingDataSchema.index({ merchantId: 1, type: 1 });
TrainingDataSchema.index({ merchantId: 1, enabled: 1 });
TrainingDataSchema.index({ question: 'text', answer: 'text' });

export const TrainingData = mongoose.model<ITrainingData>('MerchantTrainingData', TrainingDataSchema);

// ============== Training Job Model ==============

export interface ITrainingJob extends Document {
  merchantId: string;
  agentId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  samplesProcessed: number;
  totalSamples: number;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TrainingJobSchema = new Schema<ITrainingJob>(
  {
    merchantId: { type: String, required: true, index: true },
    agentId: { type: String, required: true, index: true },
    status: { type: String, enum: ['queued', 'processing', 'completed', 'failed'], default: 'queued' },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    samplesProcessed: { type: Number, default: 0 },
    totalSamples: { type: Number, default: 0 },
    error: { type: String },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

TrainingJobSchema.index({ merchantId: 1, status: 1 });

export const TrainingJob = mongoose.model<ITrainingJob>('MerchantTrainingJob', TrainingJobSchema);

// ============== Database Connection ==============

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/merchant-ai-ui';

  try {
    await mongoose.connect(mongoUri);
    isConnected = true;
    console.log(`[DB] Connected to MongoDB: ${mongoUri}`);
  } catch (error) {
    console.error('[DB] MongoDB connection failed:', error);
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  if (!isConnected) return;

  await mongoose.disconnect();
  isConnected = false;
  console.log('[DB] Disconnected from MongoDB');
}

export { mongoose };
