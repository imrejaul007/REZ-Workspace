export interface Screen {
  id: string;
  airport: string;
  terminal: string;
  location: string;
  type: 'led' | 'lcd' | 'projection';
  size: { width: number; height: number };
  orientation: 'landscape' | 'portrait';
  resolution: string;
  available: boolean;
  pricePerDay: { amount: number; currency: string };
}

export interface Campaign {
  id: string;
  name: string;
  advertiserId: string;
  screens: string[];
  startDate: string;
  endDate: string;
  totalBudget: number;
  spent: number;
  impressions: number;
  status: 'draft' | 'active' | 'paused' | 'completed';
  targeting: { airports?: string[]; terminals?: string[]; timeSlots?: string[] };
  createdAt: Date;
}

export interface CampaignAnalytics {
  campaignId: string;
  date: string;
  impressions: number;
  reach: number;
  ctr: number;
  views: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  meta?: { requestId: string; timestamp: number };
}