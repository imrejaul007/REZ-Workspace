import mongoose, { Schema, Document } from 'mongoose';
import { AuctionType } from '../types';

// Auction Rules Schema
const AuctionRulesSchema = new Schema({
  allowSelfBid: { type: Boolean, default: false },
  minBidIncrement: { type: Number, default: 0.01 },
  maxBids: { type: Number, default: 100 },
  requireDealApproval: { type: Boolean, default: false },
  allowBidModification: { type: Boolean, default: true },
  autoExtendTime: { type: Boolean, default: false },
  extensionWindow: { type: Number, default: 0 }, // milliseconds
}, { _id: false });

// Auction Config Schema
export interface IAuctionConfig extends Document {
  configId: string;
  name: string;
  description: string;
  auctionType: AuctionType;
  reservePrice: number;
  floorPrice: number;
  timeLimit: number; // milliseconds
  rules: {
    allowSelfBid: boolean;
    minBidIncrement: number;
    maxBids: number;
    requireDealApproval: boolean;
    allowBidModification: boolean;
    autoExtendTime: boolean;
    extensionWindow: number;
  };
  isActive: boolean;
  priority: number;
  metadata: {
    createdBy: string;
    updatedBy: string;
    version: number;
  };
}

const AuctionConfigSchema = new Schema<IAuctionConfig>({
  configId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: String,
  auctionType: {
    type: String,
    required: true,
    enum: ['first-price', 'second-price', 'vickrey', 'weighted'],
    index: true,
  },
  reservePrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  floorPrice: {
    type: Number,
    min: 0,
    default: 0,
  },
  timeLimit: {
    type: Number,
    min: 100,
    max: 30000,
    default: 1000,
  },
  rules: {
    type: AuctionRulesSchema,
    default: () => ({}),
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  priority: {
    type: Number,
    default: 0,
  },
  metadata: {
    createdBy: { type: String, default: 'system' },
    updatedBy: { type: String, default: 'system' },
    version: { type: Number, default: 1 },
  },
}, {
  timestamps: true,
  collection: 'auction_configs',
});

// Pre-save middleware for version increment
AuctionConfigSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.metadata.version += 1;
    this.metadata.updatedBy = 'system';
  }
  next();
});

export const AuctionConfig = mongoose.model<IAuctionConfig>('AuctionConfig', AuctionConfigSchema);
