// Video Types
export interface IVideo {
  _id?: string;
  title: string;
  description?: string;
  url: string;
  thumbnail?: string;
  duration: number; // in seconds
  format: string;
  resolution?: string;
  fileSize?: number;
  status: 'draft' | 'active' | 'paused' | 'archived';
  visibility: 'public' | 'private' | 'unlisted';
  category?: string;
  tags?: string[];
  sponsors: string[];
  advertiserId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Sponsor Types
export interface ISponsor {
  _id?: string;
  videoId: string;
  advertiserId: string;
  placement: 'pre_roll' | 'mid_roll' | 'post_roll' | 'overlay' | 'banner';
  bid: {
    amount: number;
    currency: string;
    type: 'cpm' | 'cpc' | 'cpv';
  };
  impressions: number;
  clicks: number;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'paused' | 'completed' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

// Campaign Types
export interface ICampaign {
  _id?: string;
  name: string;
  advertiserId: string;
  videoId: string;
  targeting: {
    demographics?: {
      ageRange?: { min: number; max: number };
      gender?: string[];
      location?: string[];
      interests?: string[];
    };
    devices?: string[];
    platforms?: string[];
    timeSlots?: { start: string; end: string }[];
    customRules?: Record<string, any>;
  };
  budget: {
    total: number;
    spent: number;
    daily?: number;
    currency: string;
  };
  schedule: {
    startDate: Date;
    endDate?: Date;
    frequency?: number;
  };
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics Types
export interface IVideoAnalytics {
  _id?: string;
  videoId: string;
  campaignId?: string;
  date: Date;
  views: number;
  uniqueViews: number;
  watchTime: {
    total: number;
    average: number;
    completionRate: number;
  };
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    saves: number;
  };
  ctr: {
    impressions: number;
    clicks: number;
    rate: number;
  };
  retention: {
    average: number;
    dropOffPoints: number[];
  };
  deviceBreakdown?: Record<string, number>;
  geoBreakdown?: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

// API Request/Response Types
export interface CreateVideoRequest {
  title: string;
  description?: string;
  url: string;
  thumbnail?: string;
  duration: number;
  format?: string;
  resolution?: string;
  fileSize?: number;
  visibility?: 'public' | 'private' | 'unlisted';
  category?: string;
  tags?: string[];
  createdBy: string;
}

export interface UpdateVideoRequest {
  title?: string;
  description?: string;
  url?: string;
  thumbnail?: string;
  status?: 'draft' | 'active' | 'paused' | 'archived';
  visibility?: 'public' | 'private' | 'unlisted';
  category?: string;
  tags?: string[];
}

export interface AddSponsorRequest {
  advertiserId: string;
  placement: 'pre_roll' | 'mid_roll' | 'post_roll' | 'overlay' | 'banner';
  bid: {
    amount: number;
    currency: string;
    type: 'cpm' | 'cpc' | 'cpv';
  };
  startDate: Date;
  endDate?: Date;
}

export interface CreateCampaignRequest {
  name: string;
  advertiserId: string;
  videoId: string;
  targeting?: {
    demographics?: {
      ageRange?: { min: number; max: number };
      gender?: string[];
      location?: string[];
      interests?: string[];
    };
    devices?: string[];
    platforms?: string[];
    timeSlots?: { start: string; end: string }[];
    customRules?: Record<string, any>;
  };
  budget: {
    total: number;
    daily?: number;
    currency: string;
  };
  schedule?: {
    startDate: Date;
    endDate?: Date;
    frequency?: number;
  };
  priority?: number;
}

export interface SetTargetingRequest {
  demographics?: {
    ageRange?: { min: number; max: number };
    gender?: string[];
    location?: string[];
    interests?: string[];
  };
  devices?: string[];
  platforms?: string[];
  timeSlots?: { start: string; end: string }[];
  customRules?: Record<string, any>;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    requestId: string;
    timestamp: string;
  };
}