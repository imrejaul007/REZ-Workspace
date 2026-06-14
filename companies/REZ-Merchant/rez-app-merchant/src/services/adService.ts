// Ad Service - Advertising campaigns and analytics for REZ Merchant App
// Provides ad campaign management, budget control, targeting, creative management, and ROI analytics

import {
  withRetry,
  withErrorHandling,
  showToast,
  showNetworkErrorToast,
  LoadingState,
  AppError,
  NetworkError,
  ServerError,
  ValidationError,
  NotFoundError,
} from './errors';

// ============================================
// Base URL Configuration
// ============================================

const AD_SERVICE_BASE_URL = 'https://rez-ads-service.onrender.com/api/v1';

// ============================================
// Type Definitions
// ============================================

// Campaign Types
export type CampaignStatus = 'draft' | 'pending' | 'active' | 'paused' | 'completed' | 'rejected';
export type CampaignObjective = 'awareness' | 'traffic' | 'engagement' | 'conversions' | 'app_installs';
export type CampaignType = 'search' | 'display' | 'video' | 'social' | 'native' | 'retargeting';
export type BudgetType = 'daily' | 'lifetime';

export interface AdCampaign {
  id: string;
  merchantId: string;
  name: string;
  status: CampaignStatus;
  objective: CampaignObjective;
  type: CampaignType;
  budgetType: BudgetType;
  budget: number;
  dailyBudget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roas: number;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  targeting?: Targeting;
  creatives?: Creative[];
}

export interface CreateCampaign {
  name: string;
  objective: CampaignObjective;
  type: CampaignType;
  budgetType?: BudgetType;
  budget?: number;
  dailyBudget?: number;
  startDate?: string;
  endDate?: string;
  targeting?: Targeting;
  merchantId?: string;
}

export interface UpdateCampaign {
  name?: string;
  status?: CampaignStatus;
  objective?: CampaignObjective;
  budgetType?: BudgetType;
  budget?: number;
  dailyBudget?: number;
  startDate?: string;
  endDate?: string;
  targeting?: Targeting;
}

// Targeting Types
export interface Targeting {
  locations?: string[];
  cities?: string[];
  ageRange?: { min: number; max: number };
  genders?: ('male' | 'female' | 'other')[];
  interests?: string[];
  devices?: ('mobile' | 'desktop' | 'tablet')[];
  platforms?: ('ios' | 'android' | 'web')[];
  behavioralTargeting?: string[];
  customAudiences?: string[];
  lookalikeAudiences?: string[];
}

export interface TargetingOptions {
  locations: Array<{ id: string; name: string; type: 'country' | 'state' | 'city' }>;
  cities: Array<{ id: string; name: string; country: string }>;
  interests: Array<{ id: string; name: string; category: string }>;
  devices: Array<{ id: string; name: string }>;
  platforms: Array<{ id: string; name: string; os: string }>;
  ageRanges: Array<{ label: string; min: number; max: number }>;
  behaviors: Array<{ id: string; name: string; description: string }>;
}

// Creative Types
export type CreativeType = 'image' | 'video' | 'carousel' | 'text' | 'story' | 'reel';

export interface Creative {
  id: string;
  campaignId: string;
  name: string;
  type: CreativeType;
  status: 'active' | 'paused' | 'rejected' | 'pending_review';
  thumbnailUrl?: string;
  contentUrl?: string;
  headline?: string;
  description?: string;
  callToAction?: string;
  impressions: number;
  clicks: number;
  ctr: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCreative {
  name: string;
  type: CreativeType;
  thumbnailUrl?: string;
  contentUrl?: string;
  headline?: string;
  description?: string;
  callToAction?: string;
}

// Budget Types
export interface BudgetAnalytics {
  campaignId: string;
  totalBudget: number;
  dailyBudget: number;
  spent: number;
  remaining: number;
  averageDailySpend: number;
  projectedTotalSpend: number;
  budgetUtilization: number;
  pacingStatus: 'under' | 'on_track' | 'over';
  recommendations: string[];
}

// Analytics Types
export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface CampaignStats {
  campaignId: string;
  dateRange: DateRange;
  impressions: number;
  uniqueImpressions: number;
  clicks: number;
  uniqueClicks: number;
  conversions: number;
  conversionRate: number;
  ctr: number;
  cpc: number;
  cpm: number;
  spend: number;
  revenue: number;
  roas: number;
  cpa: number;
  frequency: number;
  reach: number;
  dailyStats: DailyStat[];
}

export interface DailyStat {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
}

export interface ImpressionData {
  timestamp: string;
  impressions: number;
  device?: string;
  location?: string;
  platform?: string;
  creativeId?: string;
}

export interface ClickData {
  timestamp: string;
  clicks: number;
  device?: string;
  location?: string;
  platform?: string;
  creativeId?: string;
  destinationUrl?: string;
}

export interface ConversionData {
  timestamp: string;
  conversions: number;
  value: number;
  device?: string;
  location?: string;
  platform?: string;
  creativeId?: string;
  actionType?: string;
}

// ROI Types
export interface ROIAnalytics {
  campaignId: string;
  totalSpend: number;
  totalRevenue: number;
  grossProfit: number;
  netProfit: number;
  roas: number;
  roi: number;
  cpa: number;
  ltv: number;
  revenuePerImpression: number;
  revenuePerClick: number;
  conversionValue: number;
  customerAcquisitionCost: number;
  breakEvenRoas: number;
  profitabilityStatus: 'profitable' | 'break_even' | 'unprofitable';
  projections: {
    projectedRevenue: number;
    projectedProfit: number;
    daysToBreakEven: number;
  };
}

// Pagination Types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// Mock Data (Development Mode)
// ============================================

/** FIX (security): Replaced Math.random() with crypto.randomUUID() for secure ID generation */
const generateMockId = (): string => {
  // Use crypto for secure random ID generation
  if (
    typeof globalThis !== 'undefined' &&
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return `ad_${Date.now()}_${globalThis.crypto.randomUUID().replace(/-/g, '').substring(0, 9)}`;
  }
  // Node.js fallback
  try {
    const { randomUUID } = require('crypto');
    return `ad_${Date.now()}_${randomUUID().replace(/-/g, '').substring(0, 9)}`;
  } catch {
    // Legacy fallback (only for environments without crypto)
    return `ad_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
};

const mockCampaigns: AdCampaign[] = [
  {
    id: 'camp_001',
    merchantId: 'merchant_001',
    name: 'Summer Sale 2026',
    status: 'active',
    objective: 'conversions',
    type: 'social',
    budgetType: 'daily',
    budget: 0,
    dailyBudget: 150.00,
    spent: 450.00,
    impressions: 45000,
    clicks: 1350,
    conversions: 45,
    ctr: 3.0,
    cpc: 0.33,
    cpm: 10.00,
    roas: 4.2,
    startDate: '2026-04-01',
    endDate: '2026-05-31',
    createdAt: '2026-03-28T10:00:00Z',
    updatedAt: '2026-05-05T08:30:00Z',
    targeting: {
      locations: ['US'],
      cities: ['New York', 'Los Angeles', 'Chicago'],
      ageRange: { min: 25, max: 45 },
      genders: ['male', 'female'],
      interests: ['food', 'dining', 'lifestyle'],
      devices: ['mobile', 'desktop'],
      platforms: ['ios', 'android'],
    },
  },
  {
    id: 'camp_002',
    merchantId: 'merchant_001',
    name: 'New Customer Acquisition',
    status: 'active',
    objective: 'awareness',
    type: 'display',
    budgetType: 'lifetime',
    budget: 2500.00,
    dailyBudget: 0,
    spent: 1200.00,
    impressions: 120000,
    clicks: 2400,
    conversions: 24,
    ctr: 2.0,
    cpc: 0.50,
    cpm: 10.00,
    roas: 3.1,
    startDate: '2026-03-15',
    endDate: '2026-06-15',
    createdAt: '2026-03-10T14:00:00Z',
    updatedAt: '2026-05-04T16:45:00Z',
    targeting: {
      locations: ['US'],
      ageRange: { min: 18, max: 35 },
      interests: ['technology', 'gaming', 'entertainment'],
      devices: ['mobile'],
      platforms: ['ios', 'android'],
    },
  },
  {
    id: 'camp_003',
    merchantId: 'merchant_001',
    name: 'Weekend Special Promotion',
    status: 'paused',
    objective: 'engagement',
    type: 'retargeting',
    budgetType: 'daily',
    budget: 0,
    dailyBudget: 75.00,
    spent: 225.00,
    impressions: 18000,
    clicks: 720,
    conversions: 36,
    ctr: 4.0,
    cpc: 0.31,
    cpm: 12.50,
    roas: 5.8,
    startDate: '2026-04-10',
    endDate: '2026-05-10',
    createdAt: '2026-04-05T09:00:00Z',
    updatedAt: '2026-05-01T12:00:00Z',
  },
  {
    id: 'camp_004',
    merchantId: 'merchant_001',
    name: 'Loyalty Program Launch',
    status: 'draft',
    objective: 'app_installs',
    type: 'video',
    budgetType: 'daily',
    budget: 0,
    dailyBudget: 200.00,
    spent: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    ctr: 0,
    cpc: 0,
    cpm: 0,
    roas: 0,
    startDate: '2026-06-01',
    createdAt: '2026-05-01T11:00:00Z',
    updatedAt: '2026-05-01T11:00:00Z',
  },
];

const mockCreatives: Creative[] = [
  {
    id: 'cre_001',
    campaignId: 'camp_001',
    name: 'Summer Banner 1',
    type: 'image',
    status: 'active',
    thumbnailUrl: 'https://example.com/creatives/summer1.jpg',
    contentUrl: 'https://example.com/creatives/summer1-full.jpg',
    headline: 'Summer Sale - Up to 50% Off!',
    description: 'Shop our biggest sale of the season',
    callToAction: 'Shop Now',
    impressions: 25000,
    clicks: 750,
    ctr: 3.0,
    createdAt: '2026-03-25T10:00:00Z',
    updatedAt: '2026-05-05T08:00:00Z',
  },
  {
    id: 'cre_002',
    campaignId: 'camp_001',
    name: 'Summer Video Ad',
    type: 'video',
    status: 'active',
    contentUrl: 'https://example.com/creatives/summer-video.mp4',
    headline: 'Experience Summer',
    description: 'Discover amazing deals this summer',
    callToAction: 'Learn More',
    impressions: 20000,
    clicks: 600,
    ctr: 3.0,
    createdAt: '2026-03-26T14:30:00Z',
    updatedAt: '2026-05-04T10:00:00Z',
  },
  {
    id: 'cre_003',
    campaignId: 'camp_002',
    name: 'Display Banner',
    type: 'image',
    status: 'active',
    thumbnailUrl: 'https://example.com/creatives/display1.jpg',
    headline: 'New Here? Start Shopping',
    description: 'First-time customers get exclusive deals',
    callToAction: 'Sign Up',
    impressions: 80000,
    clicks: 1600,
    ctr: 2.0,
    createdAt: '2026-03-10T15:00:00Z',
    updatedAt: '2026-05-03T09:00:00Z',
  },
];

const mockTargetingOptions: TargetingOptions = {
  locations: [
    { id: 'loc_us', name: 'United States', type: 'country' },
    { id: 'loc_ca', name: 'Canada', type: 'country' },
    { id: 'loc_uk', name: 'United Kingdom', type: 'country' },
  ],
  cities: [
    { id: 'city_nyc', name: 'New York', country: 'US' },
    { id: 'city_la', name: 'Los Angeles', country: 'US' },
    { id: 'city_chi', name: 'Chicago', country: 'US' },
    { id: 'city_sf', name: 'San Francisco', country: 'US' },
    { id: 'city_mia', name: 'Miami', country: 'US' },
    { id: 'city_tor', name: 'Toronto', country: 'CA' },
    { id: 'city_lon', name: 'London', country: 'UK' },
  ],
  interests: [
    { id: 'int_food', name: 'Food & Dining', category: 'Lifestyle' },
    { id: 'int_shopping', name: 'Shopping', category: 'Lifestyle' },
    { id: 'int_tech', name: 'Technology', category: 'Interests' },
    { id: 'int_travel', name: 'Travel', category: 'Lifestyle' },
    { id: 'int_fitness', name: 'Health & Fitness', category: 'Lifestyle' },
    { id: 'int_entertainment', name: 'Entertainment', category: 'Interests' },
    { id: 'int_beauty', name: 'Beauty & Style', category: 'Lifestyle' },
    { id: 'int_sports', name: 'Sports', category: 'Interests' },
  ],
  devices: [
    { id: 'dev_mobile', name: 'Mobile' },
    { id: 'dev_desktop', name: 'Desktop' },
    { id: 'dev_tablet', name: 'Tablet' },
  ],
  platforms: [
    { id: 'plat_ios', name: 'iOS', os: 'Apple' },
    { id: 'plat_android', name: 'Android', os: 'Google' },
    { id: 'plat_web', name: 'Web', os: 'Cross-platform' },
  ],
  ageRanges: [
    { label: '18-24', min: 18, max: 24 },
    { label: '25-34', min: 25, max: 34 },
    { label: '35-44', min: 35, max: 44 },
    { label: '45-54', min: 45, max: 54 },
    { label: '55-64', min: 55, max: 64 },
    { label: '65+', min: 65, max: 100 },
  ],
  behaviors: [
    { id: 'bhv_purchase', name: 'Purchase Intent', description: 'Users who have shown purchase intent' },
    { id: 'bhv_engaged', name: 'Engaged Shoppers', description: 'Frequently engaged with shopping content' },
    { id: 'bhv_loyal', name: 'Loyal Customers', description: 'Repeat customers with high lifetime value' },
  ],
};

// ============================================
// API Helper Functions
// ============================================

interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error: ApiError = {
      message: `API Error: ${response.status} ${response.statusText}`,
      status: response.status,
    };
    try {
      const errorData = await response.json();
      error.message = errorData.message || error.message;
      error.code = errorData.code;
    } catch {
      // Response might not be JSON
    }
    throw error;
  }
  return response.json();
};

const getAuthHeaders = (): HeadersInit => {
  // Get token from storage or state management
  // This should be adapted based on your auth implementation
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    if (token) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };
    }
  }
  return {
    'Content-Type': 'application/json',
  };
};

const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${AD_SERVICE_BASE_URL}${endpoint}`;

  return withRetry(async () => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });
    return handleResponse<T>(response);
  }, {
    retries: 3,
    retryDelay: 1000,
    retryCondition: (error) => {
      return error.name === 'NetworkError' ||
             error.name === 'TimeoutError' ||
             (error.statusCode !== undefined && error.statusCode >= 500);
    },
  });
};

// ============================================
// Ad Service Class
// ============================================

class AdService {
  // Track if we should use mock data (for development)
  private useMockData: boolean;

  constructor() {
    // Enable mock data in development or when API is unavailable
    this.useMockData = process.env.NODE_ENV === 'development' ||
                       process.env.NEXT_PUBLIC_USE_MOCK_ADS === 'true';
  }

  // ============================================
  // Campaign Management
  // ============================================

  /**
   * Get all campaigns for a merchant
   */
  async getCampaigns(merchantId: string): Promise<AdCampaign[]> {
    if (this.useMockData) {
      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockCampaigns.filter((c) => c.merchantId === merchantId);
    }

    return apiRequest<AdCampaign[]>(`/campaigns?merchantId=${merchantId}`);
  }

  /**
   * Get a single campaign by ID
   */
  async getCampaignById(id: string): Promise<AdCampaign> {
    if (this.useMockData) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const campaign = mockCampaigns.find((c) => c.id === id);
      if (!campaign) {
        throw new NotFoundError('Campaign');
      }
      return campaign;
    }

    return apiRequest<AdCampaign>(`/campaigns/${id}`);
  }

  /**
   * Create a new campaign
   */
  async createCampaign(data: CreateCampaign): Promise<AdCampaign> {
    if (this.useMockData) {
      await new Promise((resolve) => setTimeout(resolve, 600));

      const newCampaign: AdCampaign = {
        id: generateMockId(),
        merchantId: data.merchantId || 'current_merchant',
        name: data.name,
        status: 'draft',
        objective: data.objective,
        type: data.type,
        budgetType: data.budgetType || 'daily',
        budget: data.budget || 0,
        dailyBudget: data.dailyBudget || 0,
        spent: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        roas: 0,
        startDate: data.startDate || new Date().toISOString().split('T')[0],
        endDate: data.endDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        targeting: data.targeting,
        creatives: [],
      };

      mockCampaigns.push(newCampaign);
      return newCampaign;
    }

    return apiRequest<AdCampaign>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update an existing campaign
   */
  async updateCampaign(id: string, data: UpdateCampaign): Promise<AdCampaign> {
    if (this.useMockData) {
      await new Promise((resolve) => setTimeout(resolve, 400));

      const index = mockCampaigns.findIndex((c) => c.id === id);
      if (index === -1) {
        throw new NotFoundError('Campaign');
      }

      const updatedCampaign = {
        ...mockCampaigns[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };

      mockCampaigns[index] = updatedCampaign;
      return updatedCampaign;
    }

    return apiRequest<AdCampaign>(`/campaigns/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Pause a campaign
   */
  async pauseCampaign(id: string): Promise<void> {
    if (this.useMockData) {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const index = mockCampaigns.findIndex((c) => c.id === id);
      if (index === -1) {
        throw new NotFoundError('Campaign');
      }

      if (mockCampaigns[index].status !== 'active') {
        throw new ValidationError('Campaign is not active');
      }

      mockCampaigns[index].status = 'paused';
      mockCampaigns[index].updatedAt = new Date().toISOString();
      return;
    }

    await apiRequest<void>(`/campaigns/${id}/pause`, {
      method: 'POST',
    });
  }

  /**
   * Resume a paused campaign
   */
  async resumeCampaign(id: string): Promise<void> {
    if (this.useMockData) {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const index = mockCampaigns.findIndex((c) => c.id === id);
      if (index === -1) {
        throw new NotFoundError('Campaign');
      }

      if (mockCampaigns[index].status !== 'paused') {
        throw new ValidationError('Campaign is not paused');
      }

      mockCampaigns[index].status = 'active';
      mockCampaigns[index].updatedAt = new Date().toISOString();
      return;
    }

    await apiRequest<void>(`/campaigns/${id}/resume`, {
      method: 'POST',
    });
  }

  /**
   * Delete a campaign
   */
  async deleteCampaign(id: string): Promise<void> {
    if (this.useMockData) {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const index = mockCampaigns.findIndex((c) => c.id === id);
      if (index === -1) {
        throw new NotFoundError('Campaign');
      }

      mockCampaigns.splice(index, 1);
      return;
    }

    await apiRequest<void>(`/campaigns/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // Budget Management
  // ============================================

  /**
   * Set campaign budget (lifetime or daily based on budgetType)
   */
  async setBudget(campaignId: string, budget: number): Promise<AdCampaign> {
    if (this.useMockData) {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const index = mockCampaigns.findIndex((c) => c.id === campaignId);
      if (index === -1) {
        throw new NotFoundError('Campaign');
      }

      const campaign = mockCampaigns[index];

      if (campaign.budgetType === 'lifetime') {
        campaign.budget = budget;
      } else {
        campaign.dailyBudget = budget;
      }

      campaign.updatedAt = new Date().toISOString();
      return campaign;
    }

    return apiRequest<AdCampaign>(`/campaigns/${campaignId}/budget`, {
      method: 'PUT',
      body: JSON.stringify({ budget }),
    });
  }

  /**
   * Set daily budget for a campaign
   */
  async setDailyBudget(campaignId: string, dailyBudget: number): Promise<void> {
    if (this.useMockData) {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const index = mockCampaigns.findIndex((c) => c.id === campaignId);
      if (index === -1) {
        throw new NotFoundError('Campaign');
      }

      mockCampaigns[index].dailyBudget = dailyBudget;
      mockCampaigns[index].updatedAt = new Date().toISOString();
      return;
    }

    await apiRequest<void>(`/campaigns/${campaignId}/daily-budget`, {
      method: 'PUT',
      body: JSON.stringify({ dailyBudget }),
    });
  }

  /**
   * Get budget analytics for a campaign
   */
  async getBudgetAnalytics(campaignId: string): Promise<BudgetAnalytics> {
    if (this.useMockData) {
      await new Promise((resolve) => setTimeout(resolve, 400));

      const campaign = mockCampaigns.find((c) => c.id === campaignId);
      if (!campaign) {
        throw new NotFoundError('Campaign');
      }

      const totalBudget = campaign.budgetType === 'lifetime' ? campaign.budget : campaign.dailyBudget * 30;
      const spent = campaign.spent;
      const remaining = Math.max(0, totalBudget - spent);
      const averageDailySpend = campaign.spent / Math.max(1, new Date().getDate());
      const projectedTotalSpend = averageDailySpend * 30;
      const budgetUtilization = totalBudget > 0 ? (spent / totalBudget) * 100 : 0;

      // Determine pacing status
      let pacingStatus: 'under' | 'on_track' | 'over' = 'on_track';
      const expectedUtilization = (new Date().getDate() / 30) * 100;

      if (budgetUtilization < expectedUtilization - 10) {
        pacingStatus = 'under';
      } else if (budgetUtilization > expectedUtilization + 10) {
        pacingStatus = 'over';
      }

      const recommendations: string[] = [];
      if (pacingStatus === 'under') {
        recommendations.push('Your campaign is under-spending. Consider increasing your budget or adjusting targeting to reach more users.');
      } else if (pacingStatus === 'over') {
        recommendations.push('Your campaign is spending faster than expected. Consider increasing your budget to meet your goals.');
      }
      if (remaining < totalBudget * 0.1) {
        recommendations.push('Budget is running low. Consider adding more budget to avoid campaign pause.');
      }

      return {
        campaignId,
        totalBudget,
        dailyBudget: campaign.dailyBudget,
        spent,
        remaining,
        averageDailySpend,
        projectedTotalSpend,
        budgetUtilization,
        pacingStatus,
        recommendations,
      };
    }

    return apiRequest<BudgetAnalytics>(`/campaigns/${campaignId}/budget-analytics`);
  }

  // ============================================
  // Targeting
  // ============================================

  /**
   * Set targeting options for a campaign
   */
  async setTargeting(campaignId: string, targeting: Targeting): Promise<void> {
    if (this.useMockData) {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const index = mockCampaigns.findIndex((c) => c.id === campaignId);
      if (index === -1) {
        throw new NotFoundError('Campaign');
      }

      mockCampaigns[index].targeting = targeting;
      mockCampaigns[index].updatedAt = new Date().toISOString();
      return;
    }

    await apiRequest<void>(`/campaigns/${campaignId}/targeting`, {
      method: 'PUT',
      body: JSON.stringify({ targeting }),
    });
  }

  /**
   * Get available targeting options
   */
  async getTargetingOptions(): Promise<TargetingOptions> {
    if (this.useMockData) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return mockTargetingOptions;
    }

    return apiRequest<TargetingOptions>('/targeting/options');
  }

  // ============================================
  // Creative Management
  // ============================================

  /**
   * Get all creatives for a campaign
   */
  async getCreatives(campaignId: string): Promise<Creative[]> {
    if (this.useMockData) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return mockCreatives.filter((c) => c.campaignId === campaignId);
    }

    return apiRequest<Creative[]>(`/campaigns/${campaignId}/creatives`);
  }

  /**
   * Upload a new creative
   */
  async uploadCreative(campaignId: string, data: CreateCreative): Promise<Creative> {
    if (this.useMockData) {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const newCreative: Creative = {
        id: generateMockId(),
        campaignId,
        name: data.name,
        type: data.type,
        status: 'pending_review',
        thumbnailUrl: data.thumbnailUrl,
        contentUrl: data.contentUrl,
        headline: data.headline,
        description: data.description,
        callToAction: data.callToAction,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockCreatives.push(newCreative);
      return newCreative;
    }

    return apiRequest<Creative>(`/campaigns/${campaignId}/creatives`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a creative
   */
  async deleteCreative(id: string): Promise<void> {
    if (this.useMockData) {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const index = mockCreatives.findIndex((c) => c.id === id);
      if (index === -1) {
        throw new NotFoundError('Creative');
      }

      mockCreatives.splice(index, 1);
      return;
    }

    await apiRequest<void>(`/creatives/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // Analytics
  // ============================================

  /**
   * Get comprehensive campaign statistics
   */
  async getCampaignStats(campaignId: string, dateRange: DateRange): Promise<CampaignStats> {
    if (this.useMockData) {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const campaign = mockCampaigns.find((c) => c.id === campaignId);
      if (!campaign) {
        throw new NotFoundError('Campaign');
      }

      // Generate mock daily stats
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const dailyStats: DailyStat[] = [];
      let totalSpend = 0;

      for (let i = 0; i < dayCount; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);

        const impressions = Math.floor(Math.random() * 2000) + 500;
        const clicks = Math.floor(impressions * (campaign.ctr / 100));
        const conversions = Math.floor(clicks * 0.03);
        const spend = parseFloat((Math.random() * 50 + 20).toFixed(2));
        const revenue = parseFloat((spend * campaign.roas).toFixed(2));

        totalSpend += spend;

        dailyStats.push({
          date: date.toISOString().split('T')[0],
          impressions,
          clicks,
          conversions,
          spend,
          revenue,
        });
      }

      const totalImpressions = dailyStats.reduce((sum, d) => sum + d.impressions, 0);
      const totalClicks = dailyStats.reduce((sum, d) => sum + d.clicks, 0);
      const totalConversions = dailyStats.reduce((sum, d) => sum + d.conversions, 0);
      const totalRevenue = dailyStats.reduce((sum, d) => sum + d.revenue, 0);

      return {
        campaignId,
        dateRange,
        impressions: totalImpressions,
        uniqueImpressions: Math.floor(totalImpressions * 0.85),
        clicks: totalClicks,
        uniqueClicks: Math.floor(totalClicks * 0.92),
        conversions: totalConversions,
        conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
        ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
        cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
        spend: totalSpend,
        revenue: totalRevenue,
        roas: totalSpend > 0 ? totalRevenue / totalSpend : 0,
        cpa: totalConversions > 0 ? totalSpend / totalConversions : 0,
        frequency: dailyStats.length > 0 ? totalImpressions / (totalImpressions * 0.85) : 0,
        reach: Math.floor(totalImpressions * 0.85),
        dailyStats,
      };
    }

    return apiRequest<CampaignStats>(
      `/campaigns/${campaignId}/stats?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
    );
  }

  /**
   * Get impression data for a campaign
   */
  async getImpressions(campaignId: string): Promise<ImpressionData[]> {
    if (this.useMockData) {
      await new Promise((resolve) => setTimeout(resolve, 400));

      const campaign = mockCampaigns.find((c) => c.id === campaignId);
      if (!campaign) {
        throw new NotFoundError('Campaign');
      }

      // Generate mock impression data
      const impressionData: ImpressionData[] = [];
      const now = Date.now();

      for (let i = 0; i < 100; i++) {
        const timestamp = new Date(now - i * 3600000).toISOString();
        impressionData.push({
          timestamp,
          impressions: Math.floor(Math.random() * 100) + 10,
          device: ['mobile', 'desktop', 'tablet'][Math.floor(Math.random() * 3)],
          location: ['New York', 'Los Angeles', 'Chicago', 'Miami', 'San Francisco'][Math.floor(Math.random() * 5)],
          platform: ['ios', 'android', 'web'][Math.floor(Math.random() * 3)],
          creativeId: mockCreatives.find((c) => c.campaignId === campaignId)?.id,
        });
      }

      return impressionData;
    }

    return apiRequest<ImpressionData[]>(`/campaigns/${campaignId}/impressions`);
  }

  /**
   * Get click data for a campaign
   */
  async getClicks(campaignId: string): Promise<ClickData[]> {
    if (this.useMockData) {
      await new Promise((resolve) => setTimeout(resolve, 400));

      const campaign = mockCampaigns.find((c) => c.id === campaignId);
      if (!campaign) {
        throw new NotFoundError('Campaign');
      }

      // Generate mock click data
      const clickData: ClickData[] = [];
      const now = Date.now();

      for (let i = 0; i < 50; i++) {
        const timestamp = new Date(now - i * 7200000).toISOString();
        clickData.push({
          timestamp,
          clicks: Math.floor(Math.random() * 20) + 1,
          device: ['mobile', 'desktop', 'tablet'][Math.floor(Math.random() * 3)],
          location: ['New York', 'Los Angeles', 'Chicago', 'Miami', 'San Francisco'][Math.floor(Math.random() * 5)],
          platform: ['ios', 'android', 'web'][Math.floor(Math.random() * 3)],
          creativeId: mockCreatives.find((c) => c.campaignId === campaignId)?.id,
          destinationUrl: 'https://example.com/landing',
        });
      }

      return clickData;
    }

    return apiRequest<ClickData[]>(`/campaigns/${campaignId}/clicks`);
  }

  /**
   * Get conversion data for a campaign
   */
  async getConversions(campaignId: string): Promise<ConversionData[]> {
    if (this.useMockData) {
      await new Promise((resolve) => setTimeout(resolve, 400));

      const campaign = mockCampaigns.find((c) => c.id === campaignId);
      if (!campaign) {
        throw new NotFoundError('Campaign');
      }

      // Generate mock conversion data
      const conversionData: ConversionData[] = [];
      const now = Date.now();

      for (let i = 0; i < 30; i++) {
        const timestamp = new Date(now - i * 14400000).toISOString();
        const conversions = Math.floor(Math.random() * 5);
        conversionData.push({
          timestamp,
          conversions,
          value: conversions * (Math.random() * 50 + 20),
          device: ['mobile', 'desktop', 'tablet'][Math.floor(Math.random() * 3)],
          location: ['New York', 'Los Angeles', 'Chicago', 'Miami', 'San Francisco'][Math.floor(Math.random() * 5)],
          platform: ['ios', 'android', 'web'][Math.floor(Math.random() * 3)],
          creativeId: mockCreatives.find((c) => c.campaignId === campaignId)?.id,
          actionType: ['purchase', 'signup', 'add_to_cart', 'view_page'][Math.floor(Math.random() * 4)],
        });
      }

      return conversionData;
    }

    return apiRequest<ConversionData[]>(`/campaigns/${campaignId}/conversions`);
  }

  // ============================================
  // ROI Analytics
  // ============================================

  /**
   * Get ROI analytics for a campaign
   */
  async getROI(campaignId: string): Promise<ROIAnalytics> {
    if (this.useMockData) {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const campaign = mockCampaigns.find((c) => c.id === campaignId);
      if (!campaign) {
        throw new NotFoundError('Campaign');
      }

      const totalSpend = campaign.spent;
      const totalRevenue = totalSpend * campaign.roas;
      const grossProfit = totalRevenue - totalSpend;
      const netProfit = grossProfit * 0.7; // Assuming 30% cost of goods
      const roi = totalSpend > 0 ? (netProfit / totalSpend) * 100 : 0;
      const cpa = campaign.conversions > 0 ? totalSpend / campaign.conversions : 0;
      const ltv = cpa * 3.5; // Estimated LTV multiplier
      const revenuePerImpression = campaign.impressions > 0 ? totalRevenue / campaign.impressions : 0;
      const revenuePerClick = campaign.clicks > 0 ? totalRevenue / campaign.clicks : 0;
      const conversionValue = campaign.conversions > 0 ? totalRevenue / campaign.conversions : 0;
      const customerAcquisitionCost = cpa;
      const breakEvenRoas = 1.0 + (0.3 / 0.7); // Based on margin

      // Determine profitability
      let profitabilityStatus: 'profitable' | 'break_even' | 'unprofitable';
      if (campaign.roas >= breakEvenRoas * 1.1) {
        profitabilityStatus = 'profitable';
      } else if (campaign.roas >= breakEvenRoas * 0.9) {
        profitabilityStatus = 'break_even';
      } else {
        profitabilityStatus = 'unprofitable';
      }

      // Projections
      const dailyRevenue = totalRevenue / Math.max(1, new Date().getDate());
      const projectedRevenue = dailyRevenue * 30;
      const projectedProfit = projectedRevenue * 0.7 - totalSpend;
      const daysToBreakEven = dailyRevenue > 0 ? Math.ceil(totalSpend / dailyRevenue) : 0;

      return {
        campaignId,
        totalSpend,
        totalRevenue,
        grossProfit,
        netProfit,
        roas: campaign.roas,
        roi,
        cpa,
        ltv,
        revenuePerImpression,
        revenuePerClick,
        conversionValue,
        customerAcquisitionCost,
        breakEvenRoas,
        profitabilityStatus,
        projections: {
          projectedRevenue,
          projectedProfit,
          daysToBreakEven,
        },
      };
    }

    return apiRequest<ROIAnalytics>(`/campaigns/${campaignId}/roi`);
  }
}

// ============================================
// Export Singleton Instance
// ============================================

export const adService = new AdService();
export default adService;
