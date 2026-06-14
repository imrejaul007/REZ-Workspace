/**
 * AdBazaar API Client
 * Connects frontend to adBazaar backend and other REZ services
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_ADBAZAAR_API_URL || 'http://localhost:4085';
const DOOH_INTEL_URL = process.env.NEXT_PUBLIC_DOOH_INTEL_URL || 'http://localhost:4080';
const PRICING_ENGINE_URL = process.env.NEXT_PUBLIC_PRICING_ENGINE_URL || 'http://localhost:4016';

// ============================================================================
// TYPES
// ============================================================================

export interface ScreenOwner {
  ownerId: string;
  businessName: string;
  stats: {
    totalScreens: number;
    activeScreens: number;
    totalEarnings: number;
    pendingPayout: number;
  };
}

export interface Screen {
  screenId: string;
  name: string;
  screenType: string;
  captivityLevel: 'personal' | 'captive_private' | 'semi_captive' | 'public';
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
  };
  coordinates: { lat: number; lng: number };
  dimensions: { width: number; height: number };
  floorPrice: { cpm: number; currency: string };
  status: 'active' | 'inactive' | 'pending_approval';
  stats: {
    totalImpressions: number;
    fillRate: number;
  };
}

export interface MarketplaceListing {
  screen: Screen;
  owner: {
    name: string;
    rating: number;
    totalListings: number;
  };
  pricing: {
    currentCPM: number;
    originalCPM: number;
    discount?: number;
  };
  availability: {
    available: boolean;
    nextAvailable?: string;
  };
}

export interface PricingQuote {
  screenId: string;
  campaignId: string;
  baseCPM: number;
  dynamicCPM: number;
  adjustments: {
    captivity: number;
    cityTier: number;
    timeSlot: number;
    seasonal: number;
    demand: number;
    audienceMatch: number;
  };
  finalCPM: number;
  totalBudget: number;
  estimatedImpressions: number;
  ownerPayout: number;
  platformFee: number;
  gst: number;
  total: number;
  validUntil: string;
}

export interface DOOHIntelligence {
  screenTypes: {
    type: string;
    captivityLevel: string;
    baseCPM: number;
    maxCPM: number;
  }[];
}

// ============================================================================
// API CLIENT
// ============================================================================

class AdBazaarAPI {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ============================================================================
  // SCREEN OWNER API
  // ============================================================================

  async registerOwner(data: {
    userId: string;
    businessName: string;
    gstin?: string;
  }): Promise<{ success: boolean; data: ScreenOwner }> {
    return this.request('/api/owners/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOwner(ownerId: string): Promise<{ success: boolean; data: ScreenOwner }> {
    return this.request(`/api/owners/${ownerId}`);
  }

  async addScreen(
    ownerId: string,
    data: {
      name: string;
      screenType: string;
      address: Screen['address'];
      coordinates: { lat: number; lng: number };
      dimensions: { width: number; height: number };
      floorPrice: { cpm: number };
    }
  ): Promise<{ success: boolean; data: Screen }> {
    return this.request(`/api/owners/${ownerId}/screens`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOwnerScreens(ownerId: string): Promise<{ success: boolean; data: Screen[] }> {
    return this.request(`/api/owners/${ownerId}/screens`);
  }

  async updateScreenPrice(
    ownerId: string,
    screenId: string,
    price: { cpm: number }
  ): Promise<{ success: boolean; data: Screen }> {
    return this.request(`/api/owners/${ownerId}/screens/${screenId}/price`, {
      method: 'PATCH',
      body: JSON.stringify(price),
    });
  }

  async getOwnerAnalytics(ownerId: string): Promise<{
    success: boolean;
    data: {
      revenue: { total: number; pending: number };
      screens: { total: number; active: number };
      impressions: { total: number; fillRate: number };
    };
  }> {
    return this.request(`/api/owners/${ownerId}/analytics`);
  }

  // ============================================================================
  // MARKETPLACE API
  // ============================================================================

  async searchScreens(params?: {
    screenTypes?: string[];
    cities?: string[];
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: { listings: MarketplaceListing[]; total: number } }> {
    const query = new URLSearchParams();
    if (params?.screenTypes) query.set('screenTypes', params.screenTypes.join(','));
    if (params?.cities) query.set('cities', params.cities.join(','));
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    return this.request(`/api/marketplace/screens?${query.toString()}`);
  }

  async getScreenDetails(screenId: string): Promise<{ success: boolean; data: Screen }> {
    return this.request(`/api/marketplace/screens/${screenId}`);
  }

  async getPricingQuote(
    campaignId: string,
    screenId: string
  ): Promise<{ success: boolean; data: PricingQuote }> {
    return this.request('/api/marketplace/quote', {
      method: 'POST',
      body: JSON.stringify({ campaignId, screenId }),
    });
  }

  // ============================================================================
  // CAMPAIGN API
  // ============================================================================

  async createCampaign(
    advertiserId: string,
    data: {
      name: string;
      budget: { total: number };
      objective: string;
      targeting: Record<string, unknown>;
    }
  ): Promise<{ success: boolean; data: { campaignId: string } }> {
    return this.request('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify({ advertiserId, ...data }),
    });
  }

  async getScreenTypes(): Promise<{
    success: boolean;
    data: Array<{
      type: string;
      captivity: string;
      description: string;
      baseCPM: number;
    }>;
  }> {
    return this.request('/api/reference/screen-types');
  }
}

// ============================================================================
// DOOH INTELLIGENCE CLIENT
// ============================================================================

class DOOHIntelligenceAPI {
  private baseURL: string;

  constructor(baseURL: string = DOOH_INTEL_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(endpoint: string): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }

  async getScreenTypes(): Promise<{
    success: boolean;
    data: { screens: DOOHIntelligence['screenTypes'] };
  }> {
    return this.request('/api/screens/types');
  }

  async calculatePrice(data: {
    screenType: string;
    location: { city: string; tier: string };
    scheduledTime: { start: string; end: string };
    campaignObjective: string;
  }): Promise<{
    success: boolean;
    data: {
      finalCPM: number;
      multipliers: Record<string, number>;
      captivityIndex: { level: string; avgDwellTime: number };
    };
  }> {
    const url = `${this.baseURL}/api/pricing/calculate`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }

  async getDemoPricing(): Promise<{
    success: boolean;
    data: Array<{
      screenType: string;
      base: number;
      metroPeak: number;
      metroNormal: number;
      tier2Peak: number;
    }>;
  }> {
    return this.request('/api/demo/pricing');
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const adbazaarAPI = new AdBazaarAPI();
export const doohIntelligenceAPI = new DOOHIntelligenceAPI();
// Types are already exported above via 'export interface'

export default AdBazaarAPI;
