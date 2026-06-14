import mongoose, { Schema, Document } from 'mongoose';

// Merchant Model
export interface IMerchant extends Document {
  merchantId: string;
  name: string;
  category: string;
  subcategory?: string;
  location: {
    city: string;
    state: string;
    pincode: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const MerchantSchema = new Schema<IMerchant>(
  {
    merchantId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    category: { type: String, required: true, index: true },
    subcategory: { type: String },
    location: {
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
  },
  { timestamps: true }
);

export const Merchant = mongoose.model<IMerchant>('Merchant', MerchantSchema);

// Revenue Record Model
export interface IRevenueRecord extends Document {
  merchantId: string;
  date: Date;
  revenue: number;
  orders: number;
  averageOrderValue: number;
  costs: {
    cogs: number;
    marketing: number;
    operations: number;
    other: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const RevenueRecordSchema = new Schema<IRevenueRecord>(
  {
    merchantId: { type: String, required: true, index: true },
    date: { type: Date, required: true, index: true },
    revenue: { type: Number, required: true },
    orders: { type: Number, required: true },
    averageOrderValue: { type: Number, required: true },
    costs: {
      cogs: { type: Number, default: 0 },
      marketing: { type: Number, default: 0 },
      operations: { type: Number, default: 0 },
      other: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

RevenueRecordSchema.index({ merchantId: 1, date: -1 });

export const RevenueRecord = mongoose.model<IRevenueRecord>('RevenueRecord', RevenueRecordSchema);

// Product Performance Model
export interface IProductPerformance extends Document {
  merchantId: string;
  productId: string;
  name: string;
  sku: string;
  category: string;
  revenue: number;
  unitsSold: number;
  margin: number;
  returnRate: number;
  trend: 'rising' | 'falling' | 'stable';
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProductPerformanceSchema = new Schema<IProductPerformance>(
  {
    merchantId: { type: String, required: true, index: true },
    productId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    category: { type: String, required: true, index: true },
    revenue: { type: Number, required: true },
    unitsSold: { type: Number, required: true },
    margin: { type: Number, required: true },
    returnRate: { type: Number, default: 0 },
    trend: { type: String, enum: ['rising', 'falling', 'stable'], default: 'stable' },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ProductPerformanceSchema.index({ merchantId: 1, revenue: -1 });
ProductPerformanceSchema.index({ merchantId: 1, productId: 1 }, { unique: true });

export const ProductPerformance = mongoose.model<IProductPerformance>('ProductPerformance', ProductPerformanceSchema);

// Customer Model
export interface ICustomer extends Document {
  merchantId: string;
  customerId: string;
  email?: string;
  phone?: string;
  firstPurchase: Date;
  lastPurchase: Date;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  rfmScores: {
    recency: number;
    frequency: number;
    monetary: number;
  };
  segment: string;
  churnRisk: 'high' | 'medium' | 'low';
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    merchantId: { type: String, required: true, index: true },
    customerId: { type: String, required: true, index: true },
    email: { type: String },
    phone: { type: String },
    firstPurchase: { type: Date, required: true },
    lastPurchase: { type: Date, required: true },
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    rfmScores: {
      recency: { type: Number, default: 0 },
      frequency: { type: Number, default: 0 },
      monetary: { type: Number, default: 0 },
    },
    segment: { type: String, default: 'new' },
    churnRisk: { type: String, enum: ['high', 'medium', 'low'], default: 'low' },
  },
  { timestamps: true }
);

CustomerSchema.index({ merchantId: 1, customerId: 1 }, { unique: true });
CustomerSchema.index({ merchantId: 1, segment: 1 });
CustomerSchema.index({ merchantId: 1, churnRisk: 1 });

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);

// Competitor Model
export interface ICompetitor extends Document {
  merchantId: string;
  competitorId: string;
  name: string;
  location: string;
  pricePosition: 'premium' | 'mid' | 'budget';
  estimatedRevenue: number;
  rating: number;
  reviewCount: number;
  strengths: string[];
  weaknesses: string[];
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CompetitorSchema = new Schema<ICompetitor>(
  {
    merchantId: { type: String, required: true, index: true },
    competitorId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    location: { type: String, required: true },
    pricePosition: { type: String, enum: ['premium', 'mid', 'budget'], default: 'mid' },
    estimatedRevenue: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

CompetitorSchema.index({ merchantId: 1, competitorId: 1 }, { unique: true });

export const Competitor = mongoose.model<ICompetitor>('CompetitorSchema', CompetitorSchema);

// Recommendation Model
export interface IRecommendation extends Document {
  merchantId: string;
  recommendationId: string;
  category: 'revenue' | 'marketing' | 'inventory' | 'pricing' | 'customer';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
  expectedImpact: {
    metric: string;
    value: number;
    unit: string;
  };
  effort: 'low' | 'medium' | 'high';
  timeframe: string;
  enabled: boolean;
  generatedAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RecommendationSchema = new Schema<IRecommendation>(
  {
    merchantId: { type: String, required: true, index: true },
    recommendationId: { type: String, required: true, index: true },
    category: {
      type: String,
      enum: ['revenue', 'marketing', 'inventory', 'pricing', 'customer'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    action: { type: String, required: true },
    expectedImpact: {
      metric: { type: String, required: true },
      value: { type: Number, required: true },
      unit: { type: String, required: true },
    },
    effort: { type: String, enum: ['low', 'medium', 'high'], required: true },
    timeframe: { type: String, required: true },
    enabled: { type: Boolean, default: true },
    generatedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

RecommendationSchema.index({ merchantId: 1, recommendationId: 1 }, { unique: true });
RecommendationSchema.index({ merchantId: 1, priority: 1 });
RecommendationSchema.index({ merchantId: 1, category: 1 });
RecommendationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Recommendation = mongoose.model<IRecommendation>('Recommendation', RecommendationSchema);

// Industry Benchmark Model
export interface IIndustryBenchmark extends Document {
  category: string;
  subcategory?: string;
  location?: string;
  metrics: {
    averageRevenue: number;
    averageOrderValue: number;
    averageMargin: number;
    averageOrdersPerDay: number;
    topPerformersRevenue: number;
  };
  period: {
    start: Date;
    end: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const IndustryBenchmarkSchema = new Schema<IIndustryBenchmark>(
  {
    category: { type: String, required: true, index: true },
    subcategory: { type: String },
    location: { type: String },
    metrics: {
      averageRevenue: { type: Number, required: true },
      averageOrderValue: { type: Number, required: true },
      averageMargin: { type: Number, required: true },
      averageOrdersPerDay: { type: Number, required: true },
      topPerformersRevenue: { type: Number, required: true },
    },
    period: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
    },
  },
  { timestamps: true }
);

IndustryBenchmarkSchema.index({ category: 1, subcategory: 1, location: 1 });

export const IndustryBenchmark = mongoose.model<IIndustryBenchmark>('IndustryBenchmark', IndustryBenchmarkSchema);

// Export all models
export const models = {
  Merchant,
  RevenueRecord,
  ProductPerformance,
  Customer,
  Competitor,
  Recommendation,
  IndustryBenchmark,
};

export default models;
