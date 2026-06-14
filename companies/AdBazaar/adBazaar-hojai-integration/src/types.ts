// Types for AdBazaar ↔ Hojai Integration

export interface AdCampaign {
  campaignId: string;
  advertiserId: string;
  name: string;
  type: 'awareness' | 'engagement' | 'conversion';
  status: 'draft' | 'active' | 'paused' | 'completed';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpa: number;
  startDate: Date;
  endDate: Date;
  targeting: {
    age?: { min: number; max: number };
    gender?: string[];
    location?: string[];
    interests?: string[];
  };
  creative: {
    type: 'image' | 'video' | 'carousel';
    url: string;
    clickUrl: string;
  };
}

export interface AdAudience {
  audienceId: string;
  name: string;
  size: number;
  segments: string[];
  demographics: {
    age: { min: number; max: number };
    gender: string[];
    locations: string[];
  };
  interests: string[];
  behaviors: string[];
}

export interface ConversionEvent {
  eventId: string;
  campaignId: string;
  adId: string;
  userId: string;
  eventType: 'view' | 'click' | 'conversion' | 'install' | 'purchase';
  value?: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface HojaiUser {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  interests: string[];
  behaviors: string[];
  location?: string;
}

export interface CampaignInsight {
  campaignId: string;
  date: Date;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  reach: number;
  frequency: number;
  ctr: number;
  cpc: number;
}
