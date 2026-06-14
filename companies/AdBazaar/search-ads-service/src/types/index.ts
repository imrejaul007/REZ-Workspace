import mongoose, { Schema, Document } from 'mongoose';

// Search Campaign Types
export type NetworkType = 'google' | 'bing' | 'yahoo' | 'all';
export type CampaignStatus = 'active' | 'paused' | 'ended' | 'pending';
export type MatchType = 'exact' | 'phrase' | 'broad' | 'modified_broad';

export interface ISearchCampaign extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  advertiserId: string;
  budget: {
    daily: number;
    total: number;
    spent: number;
  };
  network: NetworkType;
  status: CampaignStatus;
  targeting: {
    locations: string[];
    languages: string[];
    devices: string[];
    ageRanges: string[];
  };
  bidding: {
    strategy: 'cpc' | 'cpm' | 'target_roas' | 'max_conversions';
    defaultCpc: number;
    targetRoas?: number;
  };
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISearchAd extends Document {
  _id: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  headline: string;
  description: string;
  description2?: string;
  url: string;
  displayUrl: string;
  finalUrl: string;
  status: 'active' | 'paused' | 'ended' | 'pending';
  adRank?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISearchKeyword extends Document {
  _id: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  adGroupId?: mongoose.Types.ObjectId;
  term: string;
  matchType: MatchType;
  bid: number;
  qualityScore: number;
  estimatedCpc: number;
  status: 'active' | 'paused' | 'pending';
  searchVolume?: number;
  competition?: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

export interface ISearchPerformance extends Document {
  _id: mongoose.Types.ObjectId;
  campaignId: mongoose.Types.ObjectId;
  date: Date;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  spend: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  roas: number;
  qualityScore: number;
  avgPosition: number;
  createdAt: Date;
  updatedAt: Date;
}

// Request/Response Types
export interface CreateCampaignRequest {
  name: string;
  advertiserId: string;
  budget: {
    daily: number;
    total: number;
  };
  network?: NetworkType;
  targeting?: {
    locations?: string[];
    languages?: string[];
    devices?: string[];
    ageRanges?: string[];
  };
  bidding?: {
    strategy?: 'cpc' | 'cpm' | 'target_roas' | 'max_conversions';
    defaultCpc?: number;
    targetRoas?: number;
  };
  startDate?: Date;
  endDate?: Date;
}

export interface CreateAdRequest {
  headline: string;
  description: string;
  description2?: string;
  url: string;
  displayUrl: string;
  finalUrl?: string;
}

export interface AddKeywordRequest {
  term: string;
  matchType: MatchType;
  bid: number;
}

export interface OptimizeRequest {
  strategy: 'aggressive' | 'moderate' | 'conservative';
  targetCpc?: number;
  targetRoas?: number;
  minQualityScore?: number;
}

export interface CampaignPerformance {
  campaignId: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    impressions: number;
    clicks: number;
    ctr: number;
    cpc: number;
    spend: number;
    conversions: number;
    conversionRate: number;
    revenue: number;
    roas: number;
  };
  trend: 'up' | 'down' | 'stable';
  recommendations: string[];
}

export interface QualityScoreResponse {
  keywordId: string;
  term: string;
  qualityScore: number;
  factors: {
    landingPageExperience: number;
    adRelevance: number;
    expectedCtr: number;
  };
  estimatedCpc: number;
  suggestions: string[];
}
