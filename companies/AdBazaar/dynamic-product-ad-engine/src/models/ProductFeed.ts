/**
 * ProductFeed MongoDB Model
 * Stores product feeds from various sources (manual, Shopify, WooCommerce, etc.)
 */

import mongoose, { Document, Schema } from 'mongoose';
import type {
  Product,
  FeedStats,
  FeedSource,
  FeedSyncConfig,
} from '../types';

// Product subdocument schema
const productSchema = new Schema<Product>({
  productId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true, index: true },
  subcategory: { type: String },
  brand: { type: String, index: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  currency: { type: String, default: 'INR' },
  imageUrl: { type: String, required: true },
  images: { type: [String] },
  url: { type: String, required: true },
  availability: {
    type: String,
    enum: ['in_stock', 'out_of_stock', 'limited'],
    default: 'in_stock',
  },
  stockQuantity: { type: Number, default: 0 },
  rating: { type: Number, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  tags: { type: [String] },
  attributes: { type: Map, of: String },
  lastUpdated: { type: Date, default: Date.now },
}, { _id: false });

// Feed stats schema
const feedStatsSchema = new Schema<FeedStats>({
  totalProducts: { type: Number, default: 0 },
  activeProducts: { type: Number, default: 0 },
  outOfStockProducts: { type: Number, default: 0 },
  lastSynced: { type: Date, default: Date.now },
  syncErrors: { type: Number, default: 0 },
}, { _id: false });

// Feed sync config schema
const feedSyncConfigSchema = new Schema<FeedSyncConfig>({
  enabled: { type: Boolean, default: true },
  frequency: {
    type: String,
    enum: ['hourly', 'daily', 'weekly'],
    default: 'daily',
  },
  lastSync: { type: Date },
  nextSync: { type: Date },
  apiKey: { type: String },
  webhookUrl: { type: String },
}, { _id: false });

// ProductFeed document interface
export interface IProductFeed extends Document {
  feedId: string;
  merchantId: string;
  name: string;
  description?: string;
  source: FeedSource;
  sourceUrl?: string;
  products: Product[];
  syncConfig?: FeedSyncConfig;
  stats: FeedStats;
  status: 'active' | 'syncing' | 'paused' | 'error';
  createdAt: Date;
  updatedAt: Date;
}

// ProductFeed schema
const productFeedSchema = new Schema<IProductFeed>(
  {
    feedId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    merchantId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: { type: String },
    source: {
      type: String,
      enum: ['manual', 'shopify', 'woocommerce', 'magento', 'bigcommerce', 'api'],
      default: 'manual',
    },
    sourceUrl: { type: String },
    products: [productSchema],
    syncConfig: feedSyncConfigSchema,
    stats: feedStatsSchema,
    status: {
      type: String,
      enum: ['active', 'syncing', 'paused', 'error'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    collection: 'product_feeds',
  }
);

// Indexes
productFeedSchema.index({ merchantId: 1, status: 1 });
productFeedSchema.index({ 'stats.lastSynced': 1 });
productFeedSchema.index({ 'products.category': 1 });
productFeedSchema.index({ 'products.brand': 1 });
productFeedSchema.index({ 'products.price': 1 });
productFeedSchema.index({ 'products.availability': 1 });

// Instance methods
productFeedSchema.methods.calculateStats = function () {
  const products = this.products;
  this.stats = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.availability === 'in_stock' || p.availability === 'limited').length,
    outOfStockProducts: products.filter(p => p.availability === 'out_of_stock').length,
    lastSynced: new Date(),
    syncErrors: 0,
  };
  return this.stats;
};

productFeedSchema.methods.getProductsByCategory = function (category: string): Product[] {
  return this.products.filter(p => p.category === category);
};

productFeedSchema.methods.getProductsByPriceRange = function (
  minPrice: number,
  maxPrice: number
): Product[] {
  return this.products.filter(p => p.price >= minPrice && p.price <= maxPrice);
};

productFeedSchema.methods.getInStockProducts = function (): Product[] {
  return this.products.filter(p => p.availability !== 'out_of_stock');
};

// Static methods
productFeedSchema.statics.findByMerchant = function (merchantId: string) {
  return this.find({ merchantId }).sort({ createdAt: -1 });
};

productFeedSchema.statics.findActiveFeeds = function () {
  return this.find({ status: 'active' });
};

productFeedSchema.statics.findByFeedId = function (feedId: string) {
  return this.findOne({ feedId });
};

// Pre-save hook to calculate stats
productFeedSchema.pre('save', function (next) {
  if (this.isModified('products')) {
    this.calculateStats();
  }
  next();
});

export const ProductFeedModel = mongoose.model<IProductFeed>('ProductFeed', productFeedSchema);

export default ProductFeedModel;