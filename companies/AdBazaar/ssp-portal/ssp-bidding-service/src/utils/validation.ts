import { z } from 'zod';

// Bid placement schema
export const placeBidSchema = z.object({
  auctionId: z.string().min(1, 'Auction ID is required'),
  advertiserId: z.string().min(1, 'Advertiser ID is required'),
  campaignId: z.string().min(1, 'Campaign ID is required'),
  slotId: z.string().min(1, 'Slot ID is required'),
  amount: z.number().positive('Bid amount must be positive'),
  currency: z.enum(['INR']).default('INR'),
  creativeId: z.string().optional(),
  bidFloor: z.number().min(0).optional(),
});

// Auction creation schema
export const createAuctionSchema = z.object({
  slotId: z.string().min(1, 'Slot ID is required'),
  bidFloor: z.number().min(0, 'Bid floor must be non-negative').default(0),
  timeoutMs: z.number().min(50).max(5000).default(100),
  metadata: z.record(z.any()).optional(),
});

// Bid update schema (for internal use)
export const updateBidSchema = z.object({
  status: z.enum(['pending', 'won', 'lost', 'expired']),
  creativeId: z.string().optional(),
});

// Query params schema
export const queryParamsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['pending', 'won', 'lost', 'expired']).optional(),
  sortBy: z.enum(['timestamp', 'amount', 'createdAt']).default('timestamp'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Types
export type PlaceBidInput = z.infer<typeof placeBidSchema>;
export type CreateAuctionInput = z.infer<typeof createAuctionSchema>;
export type UpdateBidInput = z.infer<typeof updateBidSchema>;
export type QueryParams = z.infer<typeof queryParamsSchema>;
export type BidStatus = 'pending' | 'won' | 'lost' | 'expired';