/**
 * Influencer Marketing Types
 * Types for the influencer marketplace and campaign management
 */

// Influencer profile types
export interface Influencer {
  id: string;
  userId?: string;
  name: string;
  username: string;
  email?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  niche: InfluencerNiche[];
  platforms: InfluencerPlatform[];
  followerCount: number;
  followingCount?: number;
  engagementRate: number;
  averageLikes?: number;
  averageComments?: number;
  averageViews?: number;
  totalPosts?: number;
  location?: string;
  language?: string[];
  verified: boolean;
  rating: number;
  totalCampaigns: number;
  completedCampaigns: number;
  isActive: boolean;
  isAvailable: boolean;
  minPricePerPost: number;
  maxPricePerPost: number;
  createdAt: string;
  updatedAt: string;
}

export type InfluencerNiche =
  | 'fashion'
  | 'beauty'
  | 'food'
  | 'travel'
  | 'fitness'
  | 'tech'
  | 'gaming'
  | 'lifestyle'
  | 'parenting'
  | 'business'
  | 'entertainment'
  | 'sports'
  | 'music'
  | 'art'
  | 'photography'
  | 'health'
  | 'finance'
  | 'education'
  | 'pets'
  | 'other';

export type InfluencerPlatform =
  | 'instagram'
  | 'youtube'
  | 'tiktok'
  | 'twitter'
  | 'facebook'
  | 'linkedin'
  | 'pinterest'
  | 'snapchat';

// Campaign types
export interface Campaign {
  id: string;
  merchantId: string;
  name: string;
  description: string;
  objectives: CampaignObjective[];
  niche: InfluencerNiche[];
  platforms: InfluencerPlatform[];
  targetInfluencers: number;
  budget: CampaignBudget;
  deliverables: Deliverable[];
  requirements: CampaignRequirement[];
  timeline: CampaignTimeline;
  terms: string;
  status: CampaignStatus;
  applications: CampaignApplication[];
  acceptedInfluencers: Influencer[];
  metrics?: CampaignMetrics;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  startedAt?: string;
  endedAt?: string;
}

export type CampaignObjective =
  | 'brand_awareness'
  | 'product_launch'
  | 'sales'
  | 'engagement'
  | 'followers'
  | 'app_installs'
  | 'website_traffic'
  | 'lead_generation';

export type CampaignStatus =
  | 'draft'
  | 'pending_approval'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export interface CampaignBudget {
  total: number;
  perInfluencer: number;
  currency: string;
  spendingType: 'fixed' | 'per_deliverable' | 'negotiable';
}

export interface Deliverable {
  id: string;
  type: DeliverableType;
  title: string;
  description: string;
  quantity: number;
  platforms: InfluencerPlatform[];
  specifications?: string;
  isRequired: boolean;
  price: number;
}

export type DeliverableType =
  | 'story'
  | 'post'
  | 'reel'
  | 'video'
  | 'story_series'
  | 'carousel'
  | 'live_session'
  | 'short_video'
  | 'blog_post'
  | 'review';

export interface CampaignRequirement {
  id: string;
  type: RequirementType;
  value: string;
  isMandatory: boolean;
}

export type RequirementType =
  | 'min_followers'
  | 'min_engagement_rate'
  | 'niche_match'
  | 'location'
  | 'age_group'
  | 'verified_only'
  | 'previous_collaboration'
  | 'content_approval';

export interface CampaignTimeline {
  startDate: string;
  endDate: string;
  applicationDeadline?: string;
  influencerSelectionDeadline?: string;
  contentSubmissionDeadline?: string;
  reviewPeriod: number; // in days
}

// Application types
export interface CampaignApplication {
  id: string;
  campaignId: string;
  influencerId: string;
  influencer?: Influencer;
  message?: string;
  proposedPrice: number;
  proposedTimeline: string;
  portfolio?: string[];
  status: ApplicationStatus;
  deliverables: DeliverableProposal[];
  appliedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  negotiationNotes?: string;
}

export type ApplicationStatus =
  | 'pending'
  | 'under_review'
  | 'accepted'
  | 'rejected'
  | 'negotiating'
  | 'withdrawn'
  | 'expired';

export interface DeliverableProposal {
  deliverableId: string;
  proposedPrice: number;
  proposedQuantity: number;
  notes?: string;
}

// Campaign metrics
export interface CampaignMetrics {
  impressions: number;
  reach: number;
  engagement: number;
  clicks: number;
  conversions: number;
  revenue: number;
  roi: number;
  costPerEngagement: number;
  costPerClick: number;
  costPerConversion: number;
  averageEngagementRate: number;
  topPerformingInfluencers: string[];
}

// Filter types
export interface InfluencerFilters {
  search?: string;
  niche?: InfluencerNiche[];
  platform?: InfluencerPlatform[];
  minFollowers?: number;
  maxFollowers?: number;
  minEngagementRate?: number;
  location?: string;
  language?: string[];
  verified?: boolean;
  available?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'followers' | 'engagement_rate' | 'rating' | 'price_low' | 'price_high' | 'newest';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CampaignFilters {
  search?: string;
  status?: CampaignStatus[];
  niche?: InfluencerNiche[];
  platform?: InfluencerPlatform[];
  minBudget?: number;
  maxBudget?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: 'created' | 'budget' | 'status' | 'start_date';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// API response types
export interface InfluencerListResponse {
  items: Influencer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

export interface CampaignListResponse {
  items: Campaign[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

// Analytics types
export interface InfluencerAnalytics {
  totalEarnings: number;
  activeCampaigns: number;
  completedCampaigns: number;
  averageRating: number;
  totalReach: number;
  totalEngagement: number;
  topCategories: Array<{
    niche: InfluencerNiche;
    count: number;
    revenue: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    campaigns: number;
    earnings: number;
    reach: number;
  }>;
}

// Form types for campaign creation
export interface CreateCampaignPayload {
  name: string;
  description: string;
  objectives: CampaignObjective[];
  niche: InfluencerNiche[];
  platforms: InfluencerPlatform[];
  targetInfluencers: number;
  budget: CampaignBudget;
  deliverables: Omit<Deliverable, 'id'>[];
  requirements: Omit<CampaignRequirement, 'id'>[];
  timeline: Omit<CampaignTimeline, 'applicationDeadline' | 'influencerSelectionDeadline' | 'contentSubmissionDeadline'> & {
    applicationDeadline?: string;
    influencerSelectionDeadline?: string;
    contentSubmissionDeadline?: string;
  };
  terms: string;
}

export interface UpdateCampaignPayload extends Partial<CreateCampaignPayload> {
  status?: CampaignStatus;
}

export interface ApplicationDecisionPayload {
  decision: 'accept' | 'reject';
  proposedPrice?: number;
  message?: string;
  rejectionReason?: string;
}

// Notification types
export interface InfluencerNotification {
  id: string;
  type: 'new_application' | 'application_accepted' | 'application_rejected' | 'campaign_update' | 'payment' | 'deadline';
  title: string;
  message: string;
  campaignId?: string;
  applicationId?: string;
  read: boolean;
  createdAt: string;
}
