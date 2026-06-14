import mongoose, { Document, Schema } from 'mongoose';

export type AuctionType = 'first_price' | 'second_price' | 'fixed_price' | 'hybrid';
export type AuctionStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'no_bids';

export interface IAuction extends Document {
  auctionId: string;
  bidRequestId: string;
  impId: string;
  auctionType: AuctionType;
  status: AuctionStatus;
  // Participants
  bidderCount: number;
  bidCount: number;
  // Winning bid
  winnerBidId?: string;
  winnerSeatId?: string;
  winningPrice?: number;
  winningPriceModel: 'gross' | 'net';
  // Alternative prices
  secondHighestPrice?: number;
  floorPrice: number;
  // Timing
  startTime: Date;
  endTime?: Date;
  timeToComplete?: number;
  // Auction parameters
  minimumBidIncrement?: number;
  reservePrice?: number;
  // Deal participation
  eligibleDealIds?: string[];
  winningDealId?: string;
  // Attribution
  advertiserId?: string;
  campaignId?: string;
  lineItemId?: string;
  creativeId?: string;
  // Analytics
  impressions: number;
  clicks: number;
  conversions: number;
  viewability: number;
  // Extensibility
  ext?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const AuctionSchema = new Schema<IAuction>(
  {
    auctionId: { type: String, required: true, unique: true, index: true },
    bidRequestId: { type: String, required: true, index: true },
    impId: { type: String, required: true },
    auctionType: {
      type: String,
      enum: ['first_price', 'second_price', 'fixed_price', 'hybrid'],
      default: 'second_price'
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled', 'no_bids'],
      default: 'pending',
      index: true
    },
    bidderCount: { type: Number, default: 0 },
    bidCount: { type: Number, default: 0 },
    winnerBidId: String,
    winnerSeatId: String,
    winningPrice: Number,
    winningPriceModel: { type: String, enum: ['gross', 'net'], default: 'gross' },
    secondHighestPrice: Number,
    floorPrice: { type: Number, default: 0 },
    startTime: { type: Date, required: true },
    endTime: Date,
    timeToComplete: Number,
    minimumBidIncrement: Number,
    reservePrice: Number,
    eligibleDealIds: [String],
    winningDealId: String,
    advertiserId: String,
    campaignId: String,
    lineItemId: String,
    creativeId: String,
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    viewability: { type: Number, default: 0 },
    ext: { type: Schema.Types.Mixed }
  },
  {
    timestamps: true,
    collection: 'auctions'
  }
);

// Compound indexes
AuctionSchema.index({ bidRequestId: 1, impId: 1 });
AuctionSchema.index({ status: 1, createdAt: -1 });
AuctionSchema.index({ winnerSeatId: 1, createdAt: -1 });
AuctionSchema.index({ auctionType: 1, status: 1 });
AuctionSchema.index({ createdAt: -1 });

// TTL index for cleanup
AuctionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 days

export const Auction = mongoose.model<IAuction>('Auction', AuctionSchema);
export default Auction;