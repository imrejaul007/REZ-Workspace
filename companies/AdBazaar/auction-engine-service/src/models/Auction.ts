import mongoose, { Schema, Document } from 'mongoose';
import { AuctionType, AuctionStatus } from '../types';

// Bid Subdocument Schema
const BidSchema = new Schema({
  bidId: { type: String, required: true },
  seatId: { type: String, required: true, index: true },
  adId: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  qualityScore: { type: Number, min: 0, max: 1 },
  creative: {
    width: Number,
    height: Number,
    format: String,
    mimeType: String,
    url: String,
  },
  dealId: String,
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

// AdSlot Subdocument Schema
const AdSlotSchema = new Schema({
  slotId: { type: String, required: true },
  reservePrice: { type: Number, required: true, min: 0 },
  floorPrice: { type: Number, min: 0 },
  slotType: String,
  dimensions: {
    width: Number,
    height: Number,
  },
}, { _id: false });

// Deal Subdocument Schema
const DealSchema = new Schema({
  dealId: { type: String, required: true },
  seatId: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  priority: { type: Number, default: 0 },
  dealType: { type: String, enum: ['preferred', 'direct', 'private'] },
}, { _id: false });

// Analytics Subdocument Schema
const AnalyticsSchema = new Schema({
  totalBids: { type: Number, required: true },
  bidFloor: { type: Number, required: true },
  bidCeiling: { type: Number, required: true },
  spread: { type: Number, required: true },
  avgBidPrice: Number,
  medianBidPrice: Number,
}, { _id: false });

// Main Auction Schema
export interface IAuction extends Document {
  auctionId: string;
  auctionType: AuctionType;
  bids: mongoose.Types.DocumentArray<any>;
  winner: any;
  price: number;
  secondPrice: number;
  effectiveBid: number;
  adjustedBid: number;
  deals: mongoose.Types.DocumentArray<any>;
  adSlots: mongoose.Types.DocumentArray<any>;
  status: AuctionStatus;
  timestamp: Date;
  analytics: any;
  reasoning: string;
  metadata: {
    startTime: Date;
    endTime: Date;
    duration: number;
    error: string;
  };
}

const AuctionSchema = new Schema<IAuction>({
  auctionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  auctionType: {
    type: String,
    required: true,
    enum: ['first-price', 'second-price', 'vickrey', 'weighted'],
    index: true,
  },
  bids: [BidSchema],
  winner: {
    seatId: String,
    adId: String,
    price: Number,
    qualityScore: Number,
    creative: {
      width: Number,
      height: Number,
      format: String,
    },
  },
  price: { type: Number, default: 0 },
  secondPrice: { type: Number, default: 0 },
  effectiveBid: { type: Number },
  adjustedBid: { type: Number },
  deals: [DealSchema],
  adSlots: [AdSlotSchema],
  status: {
    type: String,
    enum: ['pending', 'completed', 'no-fill', 'cancelled'],
    default: 'pending',
    index: true,
  },
  timestamp: { type: Date, default: Date.now, index: true },
  analytics: AnalyticsSchema,
  reasoning: String,
  metadata: {
    startTime: Date,
    endTime: Date,
    duration: Number,
    error: String,
  },
}, {
  timestamps: true,
  collection: 'auctions',
});

// Indexes for efficient queries
AuctionSchema.index({ timestamp: -1 });
AuctionSchema.index({ 'analytics.totalBids': -1 });
AuctionSchema.index({ price: -1 });
AuctionSchema.index({ status: 1, timestamp: -1 });
AuctionSchema.index({ auctionType: 1, timestamp: -1 });

// Pre-save middleware
AuctionSchema.pre('save', function(next) {
  if (this.metadata && !this.metadata.endTime) {
    this.metadata.endTime = new Date();
    if (this.metadata.startTime) {
      this.metadata.duration = this.metadata.endTime.getTime() - this.metadata.startTime.getTime();
    }
  }
  next();
});

export const Auction = mongoose.model<IAuction>('Auction', AuctionSchema);
