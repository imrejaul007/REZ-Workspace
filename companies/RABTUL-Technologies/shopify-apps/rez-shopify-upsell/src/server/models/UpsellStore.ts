/**
 * Upsell Store Model
 */

import mongoose, { Schema, Document } from 'mongoose';
import { UpsellConfig, UpsellSettings } from '../../shared/types';

export interface IUpsellStore extends Document {
  shop: string;
  tenantId: string;
  brandId: string;
  enabled: boolean;
  position: 'checkout' | 'cart' | 'thank_you';
  discountCode?: string;
  discountPercentage: number;
  products: Array<{
    productId: string;
    variantId: string;
    title: string;
    price: number;
    image?: string;
    compareAtPrice?: number;
  }>;
  settings: {
    showOnMobile: boolean;
    autoTrigger: boolean;
    delaySeconds: number;
    maxUpsellsPerSession: number;
    trackAllClicks: boolean;
    primaryColor: string;
    backgroundColor: string;
  };
  stats: {
    totalOffers: number;
    totalClicks: number;
    totalAccepted: number;
    totalDeclined: number;
    totalRevenue: number;
  };
  createdAt: Date;
  updatedAt: Date;
  incrementStat(stat: 'totalOffers' | 'totalClicks' | 'totalAccepted' | 'totalDeclined', amount?: number): Promise<void>;
  addRevenue(amount: number): Promise<void>;
}

const UpsellProductSchema = new Schema({
  productId: { type: String, required: true },
  variantId: { type: String, required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  image: String,
  compareAtPrice: Number,
}, { _id: false });

const UpsellSettingsSchema = new Schema({
  showOnMobile: { type: Boolean, default: true },
  autoTrigger: { type: Boolean, default: true },
  delaySeconds: { type: Number, default: 5 },
  maxUpsellsPerSession: { type: Number, default: 3 },
  trackAllClicks: { type: Boolean, default: true },
  primaryColor: { type: String, default: '#0ea5e9' },
  backgroundColor: { type: String, default: '#ffffff' },
}, { _id: false });

const UpsellStatsSchema = new Schema({
  totalOffers: { type: Number, default: 0 },
  totalClicks: { type: Number, default: 0 },
  totalAccepted: { type: Number, default: 0 },
  totalDeclined: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
}, { _id: false });

const UpsellStoreSchema = new Schema({
  shop: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  tenantId: {
    type: String,
    required: true,
    index: true,
  },
  brandId: {
    type: String,
    required: true,
    index: true,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  position: {
    type: String,
    enum: ['checkout', 'cart', 'thank_you'],
    default: 'checkout',
  },
  discountCode: String,
  discountPercentage: {
    type: Number,
    default: 10,
  },
  products: [UpsellProductSchema],
  settings: {
    type: UpsellSettingsSchema,
    default: () => ({}),
  },
  stats: {
    type: UpsellStatsSchema,
    default: () => ({}),
  },
}, {
  timestamps: true,
  collection: 'upsell_stores',
});

// Compound indexes
UpsellStoreSchema.index({ shop: 1, tenantId: 1 }, { unique: true });
UpsellStoreSchema.index({ tenantId: 1, brandId: 1 });

// Methods
UpsellStoreSchema.methods.incrementStat = async function(
  stat: 'totalOffers' | 'totalClicks' | 'totalAccepted' | 'totalDeclined',
  amount: number = 1
) {
  await this.updateOne({ $inc: { [`stats.${stat}`]: amount } });
};

UpsellStoreSchema.methods.addRevenue = async function(amount: number) {
  await this.updateOne({ $inc: { 'stats.totalRevenue': amount } });
};

export const UpsellStore = mongoose.model<IUpsellStore>('UpsellStore', UpsellStoreSchema);
