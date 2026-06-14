/**
 * TypeScript interfaces for REZ Programmatic Bidding Service
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyDocument = Record<string, any>;

export interface IBidRequest {
  request_id: string;
  impression_id: string;
  inventory_type: string;
  placement: string;
  user_id: string;
  device: {
    os: string;
    browser: string;
    device_type: string;
  };
  location: { lat: number; lng: number };
  demographics: {
    age_range: string;
    gender: string;
    interests: string[];
  };
  floor_price: number;
  timestamp: Date;
}

export interface IBidResponse {
  response_id: string;
  request_id: string;
  advertiser_id: string;
  campaign_id: string;
  bid_amount: number;
  creative_url: string;
  creative_id: string;
  won: boolean;
  timestamp: Date;
}

export interface IAdvertiser {
  advertiser_id: string;
  _id?: string;
  name: string;
  budget: number;
  spent: number;
  bidding_strategy: 'fixed' | 'dynamic' | 'target_roas' | 'target_cpa';
  max_cpc: number;
  target_roas: number;
  status: 'active' | 'paused';
}

export interface IBidLog {
  request_id: string;
  bids_received: number;
  winning_bid: number;
  winner_id: string;
  timestamp: Date;
}

export interface IBid {
  advertiser_id: string;
  campaign_id: string;
  bid_amount: number;
}

export interface ICampaign {
  _id?: string;
  campaignId: string;
  advertiserId: string;
  status: 'active' | 'paused' | 'completed';
  name?: string;
  bidding?: {
    strategy: 'cpm' | 'cpc' | 'cpa';
    maxBid?: number;
    targetCpa?: number;
  } | null;
  targeting?: {
    geo?: string[];
    screenTypes?: string[];
    locations?: string[];
  };
}
