import mongoose, { Schema, Document } from 'mongoose';
import type { IMarketplaceBid, BidStatus } from '../types.js';

export interface MarketplaceBidDocument extends Omit<IMarketplaceBid, 'createdAt' | 'updatedAt'>, Document {}

const marketplaceBidSchema = new Schema<MarketplaceBidDocument>(
  {
    bidId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    segmentId: {
      type: String,
      required: true,
      index: true,
    },
    advertiserId: {
      type: String,
      required: true,
      index: true,
    },
    bidAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    maxBudget: {
      type: Number,
      required: true,
      min: 0,
    },
    campaignId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'winning', 'outbid', 'expired'],
      default: 'pending',
      index: true,
    },
    currentWinningBid: {
      type: Number,
    },
    auctionEndsAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'marketplace_bids',
  }
);

// Indexes
marketplaceBidSchema.index({ segmentId: 1, status: 1 });
marketplaceBidSchema.index({ advertiserId: 1, status: 1 });
marketplaceBidSchema.index({ auctionEndsAt: 1 }, { partialFilterExpression: { status: 'pending' } });

export const MarketplaceBid = mongoose.model<MarketplaceBidDocument>('MarketplaceBid', marketplaceBidSchema);