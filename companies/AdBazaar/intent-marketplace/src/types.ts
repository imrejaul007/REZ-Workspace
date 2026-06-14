// Pricing models
export type PricingModel = 'cpm' | 'cpc' | 'cpd' | 'rtb';

// Segment status
export type SegmentStatus = 'active' | 'paused' | 'archived';

// Segment types
export type SegmentType = 'active_buyers' | 'dormant_interest' | 'researchers' | 'near_purchase';

// Purchase status
export type PurchaseStatus = 'pending' | 'active' | 'completed' | 'paused';

// Bid status
export type BidStatus = 'pending' | 'winning' | 'outbid' | 'expired';

// Campaign status
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

// Delivery metrics
export interface DeliveryMetrics {
  impressions: number;
  uniqueUsersReached: number;
  ctr: number;
  conversions: number;
  attributedRevenue: number;
  roi: number;
}

// Segment listing interface
export interface ISegmentListing {
  segmentId: string;
  name: string;
  description: string;
  category: string;
  segmentType: SegmentType;
  userCount: number;
  price: number;
  pricingModel: PricingModel;
  qualityScore: number;
  avgConversionRate: number;
  attributes: string[];
  status: SegmentStatus;
  imageUrl?: string;
  demographics?: {
    ageRanges?: string[];
    locations?: string[];
    interests?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// Segment purchase interface
export interface ISegmentPurchase {
  purchaseId: string;
  segmentId: string;
  advertiserId: string;
  campaignId?: string;
  userCount: number;
  pricePerUnit: number;
  totalCost: number;
  currency: string;
  startDate: Date;
  endDate: Date;
  status: PurchaseStatus;
  deliveryMetrics?: DeliveryMetrics;
  createdAt: Date;
  updatedAt: Date;
}

// Marketplace bid interface
export interface IMarketplaceBid {
  bidId: string;
  segmentId: string;
  advertiserId: string;
  bidAmount: number;
  maxBudget: number;
  campaignId: string;
  status: BidStatus;
  currentWinningBid?: number;
  auctionEndsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Campaign interface
export interface IMarketplaceCampaign {
  campaignId: string;
  advertiserId: string;
  name: string;
  description: string;
  status: CampaignStatus;
  segments: Array<{
    segmentId: string;
    bidAmount?: number;
    budget: number;
    spent: number;
  }>;
  totalBudget: number;
  totalSpent: number;
  currency: string;
  startDate: Date;
  endDate: Date;
  deliveryMetrics?: DeliveryMetrics;
  targeting?: {
    locations?: string[];
    demographics?: {
      ageRanges?: string[];
      genders?: string[];
    };
    devices?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// API request/response types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SegmentFilterParams extends PaginationParams {
  category?: string;
  segmentType?: SegmentType;
  status?: SegmentStatus;
  minPrice?: number;
  maxPrice?: number;
  minUserCount?: number;
  minQualityScore?: number;
}

export interface BidRequest {
  segmentId: string;
  bidAmount: number;
  maxBudget: number;
  campaignId: string;
  auctionDurationMinutes?: number;
}

export interface PurchaseRequest {
  segmentId: string;
  campaignId?: string;
  durationDays: number;
  budget: number;
}

export interface CreateCampaignRequest {
  name: string;
  description: string;
  segments: Array<{
    segmentId: string;
    bidAmount?: number;
    budget: number;
  }>;
  totalBudget: number;
  startDate: string;
  endDate: string;
  targeting?: IMarketplaceCampaign['targeting'];
}

// JWT payload
export interface JWTPayload {
  userId: string;
  advertiserId?: string;
  role: 'advertiser' | 'admin' | 'internal';
  iat?: number;
  exp?: number;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Express request extension
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}
