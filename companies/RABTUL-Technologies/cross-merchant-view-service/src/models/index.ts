// Cross-Merchant View Service - MongoDB Models
import mongoose, { Schema, Document } from 'mongoose';

// ============== Merchant Summary Model ==============

export interface IMerchantSummary extends Document {
  merchantId: string;
  name: string;
  slug: string;
  tier: 'basic' | 'pro' | 'enterprise';
  industry: string;
  activeAgents: number;
  totalConversations: number;
  avgSatisfaction: number;
  totalRevenue: number;
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MerchantSummarySchema = new Schema<IMerchantSummary>(
  {
    merchantId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    tier: { type: String, enum: ['basic', 'pro', 'enterprise'], default: 'basic' },
    industry: { type: String, default: 'general' },
    activeAgents: { type: Number, default: 0 },
    totalConversations: { type: Number, default: 0 },
    avgSatisfaction: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

MerchantSummarySchema.index({ tier: 1 });
MerchantSummarySchema.index({ lastActivity: -1 });

export const MerchantSummary = mongoose.model<IMerchantSummary>('CrossMerchantSummary', MerchantSummarySchema);

// ============== Unified Customer Model ==============

export interface ICustomerActivity {
  merchantId: string;
  merchantName: string;
  type: 'conversation' | 'purchase' | 'support' | 'feedback';
  timestamp: Date;
  summary: string;
  metadata?: Record<string, unknown>;
}

export interface IMerchantInteraction {
  merchantId: string;
  merchantName: string;
  interactions: number;
  lastInteraction: Date;
  totalSpent: number;
}

export interface IUnifiedCustomer extends Document {
  customerId: string;
  primaryEmail?: string;
  primaryPhone?: string;
  name?: string;
  totalMerchants: number;
  totalConversations: number;
  totalPurchases: number;
  avgSatisfaction: number;
  lifetimeValue: number;
  firstSeen: Date;
  lastSeen: Date;
  recentActivity: ICustomerActivity[];
  merchantInteractions: IMerchantInteraction[];
  createdAt: Date;
  updatedAt: Date;
}

const CustomerActivitySchema = new Schema<ICustomerActivity>(
  {
    merchantId: { type: String, required: true },
    merchantName: { type: String, required: true },
    type: { type: String, enum: ['conversation', 'purchase', 'support', 'feedback'], required: true },
    timestamp: { type: Date, default: Date.now },
    summary: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const MerchantInteractionSchema = new Schema<IMerchantInteraction>(
  {
    merchantId: { type: String, required: true },
    merchantName: { type: String, required: true },
    interactions: { type: Number, default: 0 },
    lastInteraction: { type: Date, default: Date.now },
    totalSpent: { type: Number, default: 0 },
  },
  { _id: false }
);

const UnifiedCustomerSchema = new Schema<IUnifiedCustomer>(
  {
    customerId: { type: String, required: true, unique: true, index: true },
    primaryEmail: { type: String, sparse: true },
    primaryPhone: { type: String, sparse: true },
    name: { type: String },
    totalMerchants: { type: Number, default: 0 },
    totalConversations: { type: Number, default: 0 },
    totalPurchases: { type: Number, default: 0 },
    avgSatisfaction: { type: Number, default: 0 },
    lifetimeValue: { type: Number, default: 0 },
    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    recentActivity: [CustomerActivitySchema],
    merchantInteractions: [MerchantInteractionSchema],
  },
  { timestamps: true }
);

UnifiedCustomerSchema.index({ primaryEmail: 1 });
UnifiedCustomerSchema.index({ primaryPhone: 1 });
UnifiedCustomerSchema.index({ lifetimeValue: -1 });
UnifiedCustomerSchema.index({ lastSeen: -1 });

export const UnifiedCustomer = mongoose.model<IUnifiedCustomer>('UnifiedCustomer', UnifiedCustomerSchema);

// ============== Aggregated Metrics Model ==============

export interface IAggregatedMetric extends Document {
  date: Date;
  totalConversations: number;
  totalSatisfaction: number;
  totalRevenue: number;
  uniqueCustomers: number;
  merchantBreakdown: {
    merchantId: string;
    conversations: number;
    revenue: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const AggregatedMetricSchema = new Schema<IAggregatedMetric>(
  {
    date: { type: Date, required: true, unique: true, index: true },
    totalConversations: { type: Number, default: 0 },
    totalSatisfaction: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    uniqueCustomers: { type: Number, default: 0 },
    merchantBreakdown: [
      {
        merchantId: String,
        conversations: Number,
        revenue: Number,
      },
    ],
  },
  { timestamps: true }
);

AggregatedMetricSchema.index({ date: -1 });

export const AggregatedMetric = mongoose.model<IAggregatedMetric>('AggregatedMetric', AggregatedMetricSchema);

// ============== Database Connection ==============

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cross-merchant-view';

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
