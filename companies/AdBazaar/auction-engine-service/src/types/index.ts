import { z } from 'zod';

// Auction Types
export const AuctionTypeSchema = z.enum(['first-price', 'second-price', 'vickrey', 'weighted']);
export type AuctionType = z.infer<typeof AuctionTypeSchema>;

export const AuctionStatusSchema = z.enum(['pending', 'completed', 'no-fill', 'cancelled']);
export type AuctionStatus = z.infer<typeof AuctionStatusSchema>;

// Creative Schema
export const CreativeSchema = z.object({
  width: z.number(),
  height: z.number(),
  format: z.string(),
  mimeType: z.string().optional(),
  url: z.string().url().optional(),
});
export type Creative = z.infer<typeof CreativeSchema>;

// Bid Schema
export const BidSchema = z.object({
  bidId: z.string().optional(),
  seatId: z.string(),
  adId: z.string(),
  price: z.number().min(0),
  qualityScore: z.number().min(0).max(1).optional(),
  creative: CreativeSchema.optional(),
  dealId: z.string().optional(),
  timestamp: z.date().optional(),
});
export type Bid = z.infer<typeof BidSchema>;

// AdSlot Schema
export const AdSlotSchema = z.object({
  slotId: z.string(),
  reservePrice: z.number().min(0),
  floorPrice: z.number().min(0).optional(),
  slotType: z.string().optional(),
  dimensions: z.object({
    width: z.number(),
    height: z.number(),
  }).optional(),
});
export type AdSlot = z.infer<typeof AdSlotSchema>;

// Deal Schema
export const DealSchema = z.object({
  dealId: z.string(),
  seatId: z.string(),
  price: z.number().min(0),
  priority: z.number().min(0).optional(),
  dealType: z.enum(['preferred', 'direct', 'private']).optional(),
});
export type Deal = z.infer<typeof DealSchema>;

// Auction Analytics Schema
export const AuctionAnalyticsSchema = z.object({
  totalBids: z.number(),
  bidFloor: z.number(),
  bidCeiling: z.number(),
  spread: z.number(),
  avgBidPrice: z.number().optional(),
  medianBidPrice: z.number().optional(),
});
export type AuctionAnalytics = z.infer<typeof AuctionAnalyticsSchema>;

// First Price Auction Request
export const FirstPriceAuctionRequestSchema = z.object({
  auctionId: z.string(),
  adSlots: z.array(AdSlotSchema),
  bids: z.array(BidSchema).min(2, 'Minimum 2 bids required'),
  deals: z.array(DealSchema).optional(),
  timeout: z.number().min(100).max(5000).optional(),
});
export type FirstPriceAuctionRequest = z.infer<typeof FirstPriceAuctionRequestSchema>;

// Second Price Auction Request
export const SecondPriceAuctionRequestSchema = z.object({
  auctionId: z.string(),
  adSlots: z.array(AdSlotSchema),
  bids: z.array(BidSchema).min(2, 'Minimum 2 bids required'),
  deals: z.array(DealSchema).optional(),
  timeout: z.number().min(100).max(5000).optional(),
});
export type SecondPriceAuctionRequest = z.infer<typeof SecondPriceAuctionRequestSchema>;

// Vickrey Auction Request
export const VickreyAuctionRequestSchema = z.object({
  auctionId: z.string(),
  adSlots: z.array(AdSlotSchema),
  bids: z.array(BidSchema).min(2, 'Minimum 2 bids required'),
  deals: z.array(DealSchema).optional(),
  timeout: z.number().min(100).max(5000).optional(),
});
export type VickreyAuctionRequest = z.infer<typeof VickreyAuctionRequestSchema>;

// Weighted Auction Request
export const WeightedAuctionRequestSchema = z.object({
  auctionId: z.string(),
  adSlots: z.array(AdSlotSchema),
  bids: z.array(BidSchema).min(2, 'Minimum 2 bids required'),
  deals: z.array(DealSchema).optional(),
  weightFormula: z.enum(['linear', 'exponential', 'sqrt']).optional(),
  timeout: z.number().min(100).max(5000).optional(),
});
export type WeightedAuctionRequest = z.infer<typeof WeightedAuctionRequestSchema>;

// Auction Result
export interface AuctionResult {
  auctionId: string;
  auctionType: AuctionType;
  winner: Bid | null;
  price: number;
  secondPrice: number;
  effectiveBid?: number;
  adjustedBid?: number;
  deal: Deal | null;
  status: AuctionStatus;
  timestamp: Date;
  analytics: AuctionAnalytics;
  reasoning?: string;
}

// Auction Statistics
export interface AuctionStats {
  totalAuctions: number;
  completedAuctions: number;
  noFillAuctions: number;
  totalRevenue: number;
  avgPrice: number;
  avgSecondPrice: number;
  topBidders: Array<{
    seatId: string;
    winCount: number;
    totalSpend: number;
  }>;
  auctionTypeBreakdown: Record<AuctionType, number>;
}

// Auction History Query
export const AuctionHistoryQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  auctionType: AuctionTypeSchema.optional(),
  seatId: z.string().optional(),
  limit: z.number().min(1).max(1000).default(100),
  offset: z.number().min(0).default(0),
});
export type AuctionHistoryQuery = z.infer<typeof AuctionHistoryQuerySchema>;

// Simulate Request
export const SimulateAuctionRequestSchema = z.object({
  auctionType: AuctionTypeSchema,
  bids: z.array(BidSchema).min(2),
  reservePrice: z.number().min(0).default(0),
  simulations: z.number().min(1).max(10000).default(1000),
});
export type SimulateAuctionRequest = z.infer<typeof SimulateAuctionRequestSchema>;

// Simulate Response
export interface SimulateAuctionResponse {
  auctionType: AuctionType;
  simulations: number;
  results: Array<{
    winner: string;
    price: number;
    probability: number;
  }>;
  expectedValue: number;
  confidence: number;
}
