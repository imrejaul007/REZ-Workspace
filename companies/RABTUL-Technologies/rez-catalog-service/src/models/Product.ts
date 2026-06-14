/**
 * Product model — strict:true prevents schema drift. All fields must be explicitly defined.
 * Uses Zod validation at API boundaries to validate incoming requests.
 *
 * CANONICAL PRICING FORMAT (from @rez/shared-types):
 * - pricing.original (was mrp) + pricing.selling
 * - selling = current/discounted price, original = MRP/base price
 */

import mongoose, { Schema, Document } from 'mongoose';

// MIGRATED: Import canonical types from @rez/shared-types (aligned, Feb 2026)
// Note: Local interfaces extend Document for Mongoose; shared-types types are plain data shapes
import type { IProductPricing as SharedPricing, IProductImage as SharedImage } from '@rez/shared-types';

/**
 * CANONICAL FORMAT (matches @rez/shared-types ProductPricingSchema):
 * - pricing.original (was mrp) + pricing.selling
 * - Images: Array<{ url: string, alt?: string, isPrimary?: boolean }>
 * Aligns with: IProductPricing, IProductImage from @rez/shared-types
 */
export type IProductPricing = SharedPricing;
export type IProductImage = SharedImage;

/**
 * Local IProduct extends Document for Mongoose ORM compatibility.
 * Aligns with IProduct from @rez/shared-types but adds Mongoose Document extension.
 */
export interface IProduct extends Document {
  // Core product fields
  name?: string;
  description?: string;
  category?: string;
  store?: string;
  merchantId?: string;
  storeId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  isAvailable?: boolean;

  // Pricing - CANONICAL FORMAT: pricing.original + pricing.selling
  pricing?: IProductPricing;

  // Legacy pricing fields (supported for compatibility)
  price?: number;
  compareAtPrice?: number;
  price_obj?: {
    current?: number;
    original?: number;
    selling?: number;
    mrp?: number;
  };

  // Images - CANONICAL FORMAT: Array of { url, alt?, isPrimary? }
  images?: IProductImage[];
  thumbnail?: string;

  // Ratings
  rating?: {
    value?: number;
    count?: number;
  };
  ratings?: {
    average?: number;
    total?: number;
  };

  // Additional product fields
  sku?: string;
  barcode?: string;
  stock?: number;
  unit?: string;
  weight?: number;
  dimensions?: Record<string, unknown>;
  variants?: Record<string, unknown>[];
  addOns?: Record<string, unknown>[];
  preparationTime?: number;
  taxRate?: number;
  discount?: number;
  subcategory?: string;
  tags?: string[];
  sortOrder?: number;
  viewCount?: number;
  metadata?: Record<string, unknown>;

  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
}

const ProductSchema = new Schema(
  {
    name: String,
    description: String,
    category: String,
    store: String,
    merchantId: String,
    storeId: String,
    isActive: Boolean,
    isFeatured: Boolean,
    isAvailable: Boolean,
    pricing: {
      selling: Number,
      original: Number,
      discount: Number,
      currency: String,
    },
    price: Number,
    compareAtPrice: Number,
    price_obj: {
      current: Number,
      original: Number,
      selling: Number,
      mrp: Number,
    },
    images: [Schema.Types.Mixed],
    thumbnail: String,
    rating: {
      value: Number,
      count: Number,
    },
    ratings: {
      average: Number,
      total: Number,
    },
    sku: String,
    barcode: String,
    stock: Number,
    unit: String,
    weight: Number,
    dimensions: Schema.Types.Mixed,
    variants: [Schema.Types.Mixed],
    addOns: [Schema.Types.Mixed],
    preparationTime: Number,
    taxRate: Number,
    discount: Number,
    subcategory: String,
    tags: [String],
    sortOrder: Number,
    viewCount: Number,
    metadata: Schema.Types.Mixed,
  },
  { strict: true, collection: 'products', timestamps: true }
);

ProductSchema.index({ 'store': 1, 'isActive': 1 });
ProductSchema.index({ 'category': 1, 'isActive': 1 });
ProductSchema.index({ 'isFeatured': 1, 'isActive': 1 });
// CRIT FIX: Add missing indexes for storeId, merchantId, isActive query patterns
ProductSchema.index({ 'storeId': 1, 'isActive': 1 });
ProductSchema.index({ 'merchantId': 1, 'isActive': 1 });
ProductSchema.index({ 'merchantId': 1, 'category': 1 });
ProductSchema.index({ 'name': 'text', 'description': 'text' });
ProductSchema.index({ 'status': 1 });
ProductSchema.index({ 'createdAt': -1 });
ProductSchema.index({ 'storeId': 1, 'createdAt': -1 });

// Register model — Mongoose internally deduplicates by name, avoid manual ternary checks
export const Product = mongoose.model<IProduct>('CatalogService_Product', ProductSchema);
