import mongoose, { Schema, Document } from 'mongoose';
import {
  ISponsoredProduct,
  BidStrategy,
  SponsoredProductStatus,
  ProductInfo,
  BidConfig,
  Budget,
  Targeting,
  Performance,
} from '../types';

export interface SponsoredProductDocument extends Omit<ISponsoredProduct, 'bid' | 'budget' | 'targeting' | 'performance'>, Document {
  bid: BidConfig & { _id: mongoose.Types.ObjectId };
  budget: Budget & { _id: mongoose.Types.ObjectId };
  targeting: Targeting & { _id: mongoose.Types.ObjectId };
  performance: Performance & { _id: mongoose.Types.ObjectId };
}

const ProductInfoSchema = new Schema<ProductInfo>(
  {
    name: { type: String, required: true },
    category: { type: String, required: true, index: true },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String },
  },
  { _id: false }
);

const BidConfigSchema = new Schema<BidConfig>(
  {
    amount: { type: Number, required: true, min: 0.01 },
    strategy: {
      type: String,
      enum: ['manual', 'auto', 'rule-based'],
      default: 'manual',
    },
    maxBid: { type: Number, required: true, min: 0.01 },
  },
  { _id: true }
);

const BudgetSchema = new Schema<Budget>(
  {
    daily: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0, default: 0 },
    spent: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: true }
);

const TargetingSchema = new Schema<Targeting>(
  {
    keywords: { type: [String], default: [], index: true },
    categoryMatch: { type: Boolean, default: false },
    priceRange: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 },
    },
  },
  { _id: true }
);

const PerformanceSchema = new Schema<Performance>(
  {
    impressions: { type: Number, default: 0, min: 0 },
    clicks: { type: Number, default: 0, min: 0 },
    ctr: { type: Number, default: 0, min: 0 },
    orders: { type: Number, default: 0, min: 0 },
    revenue: { type: Number, default: 0, min: 0 },
    acos: { type: Number, default: 0, min: 0 },
    searchRank: { type: Number, default: 0, min: 0 },
  },
  { _id: true }
);

const SponsoredProductSchema = new Schema<SponsoredProductDocument>(
  {
    sponsoredId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    campaignId: {
      type: String,
      required: true,
      index: true,
    },
    merchantId: {
      type: String,
      required: true,
      index: true,
    },
    productId: {
      type: String,
      required: true,
      index: true,
    },
    product: {
      type: ProductInfoSchema,
      required: true,
    },
    bid: {
      type: BidConfigSchema,
      required: true,
    },
    budget: {
      type: BudgetSchema,
      required: true,
    },
    targeting: {
      type: TargetingSchema,
      default: () => ({}),
    },
    performance: {
      type: PerformanceSchema,
      default: () => ({
        impressions: 0,
        clicks: 0,
        ctr: 0,
        orders: 0,
        revenue: 0,
        acos: 0,
        searchRank: 0,
      }),
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'outbid'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'sponsored_products',
  }
);

// Compound indexes for common queries
SponsoredProductSchema.index({ merchantId: 1, status: 1 });
SponsoredProductSchema.index({ campaignId: 1, status: 1 });
SponsoredProductSchema.index({ 'product.category': 1, status: 1 });
SponsoredProductSchema.index({ 'targeting.keywords': 1 });
SponsoredProductSchema.index({ 'performance.searchRank': 1, status: 1 });

// Text index for search
SponsoredProductSchema.index(
  { 'product.name': 'text', 'product.category': 'text', 'targeting.keywords': 'text' },
  { weights: { 'product.name': 10, 'product.category': 5, 'targeting.keywords': 3 } }
);

// Virtual for ACOS calculation
SponsoredProductSchema.virtual('calculatedAcos').get(function () {
  if (this.performance.revenue > 0) {
    const totalSpend = this.bid.amount * this.performance.clicks;
    return (totalSpend / this.performance.revenue) * 100;
  }
  return 0;
});

// Instance method to update performance
SponsoredProductSchema.methods.updatePerformance = function (metrics: Partial<Performance>) {
  this.performance = { ...this.performance, ...metrics };

  // Recalculate CTR
  if (this.performance.impressions > 0 && this.performance.clicks > 0) {
    this.performance.ctr = (this.performance.clicks / this.performance.impressions) * 100;
  }

  // Recalculate ACOS
  if (this.performance.revenue > 0) {
    const totalSpend = this.bid.amount * this.performance.clicks;
    this.performance.acos = (totalSpend / this.performance.revenue) * 100;
  }

  return this.save();
};

// Instance method to update budget spent
SponsoredProductSchema.methods.addSpend = function (amount: number) {
  this.budget.spent += amount;
  return this.save();
};

// Instance method to check if budget is exhausted
SponsoredProductSchema.methods.isBudgetExhausted = function () {
  return this.budget.spent >= this.budget.total;
};

// Static method to find products by merchant
SponsoredProductSchema.statics.findByMerchant = function (merchantId: string, status?: SponsoredProductStatus) {
  const query: Record<string, unknown> = { merchantId };
  if (status) {
    query.status = status;
  }
  return this.find(query);
};

// Static method to find products by campaign
SponsoredProductSchema.statics.findByCampaign = function (campaignId: string, status?: SponsoredProductStatus) {
  const query: Record<string, unknown> = { campaignId };
  if (status) {
    query.status = status;
  }
  return this.find(query);
};

// Static method to search products
SponsoredProductSchema.statics.searchProducts = function (
  query: string,
  filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    merchantId?: string;
    status?: SponsoredProductStatus;
  },
  page: number = 1,
  limit: number = 20
) {
  const searchQuery: Record<string, unknown> = { status: 'active' };

  if (query) {
    searchQuery.$text = { $search: query };
  }

  if (filters.category) {
    searchQuery['product.category'] = filters.category;
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    searchQuery['product.price'] = {};
    if (filters.minPrice !== undefined) {
      (searchQuery['product.price'] as Record<string, number>).$gte = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      (searchQuery['product.price'] as Record<string, number>).$lte = filters.maxPrice;
    }
  }

  if (filters.merchantId) {
    searchQuery.merchantId = filters.merchantId;
  }

  if (filters.status) {
    searchQuery.status = filters.status;
  }

  return this.find(searchQuery)
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ 'performance.searchRank': 1, 'performance.ctr': -1 });
};

// Pre-save hook to generate sponsoredId
SponsoredProductSchema.pre('save', function (next) {
  if (!this.sponsoredId) {
    const { v4: uuidv4 } = require('uuid');
    this.sponsoredId = `SPON-${uuidv4().substring(0, 8).toUpperCase()}`;
  }
  next();
});

// Ensure virtuals are included in JSON output
SponsoredProductSchema.set('toJSON', { virtuals: true });
SponsoredProductSchema.set('toObject', { virtuals: true });

export const SponsoredProduct = mongoose.model<SponsoredProductDocument>('SponsoredProduct', SponsoredProductSchema);
export default SponsoredProduct;