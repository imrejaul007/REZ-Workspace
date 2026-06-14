import { logger } from '../../shared/logger';
/**
 * RisnaEstate API Client
 *
 * TypeScript client for all RisnaEstate services.
 *
 * Usage:
 * ```typescript
 * import { RisnaEstate } from '@risna/client';
 *
 * const risna = new RisnaEstate({
 *   baseUrl: 'http://localhost:4100',
 *   apiKey: 'your-internal-token'
 * });
 *
 * const properties = await risna.property.search({ city: 'Dubai' });
 * const lead = await risna.lead.create({ name: 'John', phone: '+91...', source: 'website' });
 * ```
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// ===== TYPES =====

export interface RisnaClientConfig {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
  debug?: boolean;
}

export interface PropertyFilters {
  country?: 'IN' | 'AE';
  city?: string;
  locality?: string;
  propertyType?: string;
  listingType?: 'sale' | 'rent' | 'lease' | 'pg' | 'co_living';
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  furnished?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreatePropertyInput {
  title: string;
  description: string;
  propertyType: string;
  listingType: string;
  country: string;
  city: string;
  locality: string;
  price: { amount: number; currency: string };
  bedrooms?: number;
  bathrooms?: number;
  carpetArea?: number;
  furnishedStatus?: string;
  amenities?: string[];
  brokerId?: string;
}

export interface CreateLeadInput {
  name: string;
  phone: string;
  email?: string;
  source: 'website' | 'whatsapp' | 'referral' | 'social' | 'agent' | 'partner' | 'ad' | 'organic';
  segment?: string;
  preferences?: {
    propertyTypes?: string[];
    budget?: { min?: number; max?: number; currency: string };
    timeline?: string;
    purpose?: string;
  };
  interestedPropertyIds?: string[];
}

export interface CreateSiteVisitInput {
  leadId: string;
  propertyId: string;
  brokerId: string;
  scheduledAt: string;
  estimatedDuration?: number;
  attendees?: Array<{ name?: string; phone?: string; role?: string }>;
}

export interface CreateCampaignInput {
  name: string;
  type: string;
  budget: number;
  targeting?: {
    countries?: string[];
    cities?: string[];
    segments?: string[];
    ageMin?: number;
    ageMax?: number;
  };
  creatives: Array<{ type: string; url: string; headline?: string; cta?: string }>;
  startDate: string;
  endDate?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  meta?: {
    timestamp: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// ===== BASE CLIENT =====

class BaseClient {
  protected client: AxiosInstance;

  constructor(config: RisnaClientConfig) {
    const baseURL = config.baseUrl || 'http://localhost:4100';
    const timeout = config.timeout || 30000;

    this.client = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'X-Internal-Token': config.apiKey }),
      },
    });

    if (config.debug) {
      this.client.interceptors.request.use((req) => {
        logger.info(`[RisnaEstate] ${req.method?.toUpperCase()} ${req.url}`);
        return req;
      });
    }

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('[RisnaEstate] Error:', error.message);
        throw error;
      }
    );
  }

  protected async get<T>(path: string, params?: Record<string, any>): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(path, { params });
    return response.data.data;
  }

  protected async post<T>(path: string, data?: any): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(path, data);
    return response.data.data;
  }

  protected async put<T>(path: string, data?: any): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(path, data);
    return response.data.data;
  }

  protected async delete<T>(path: string): Promise<T> {
    const response = await this.client.delete<ApiResponse<T>>(path);
    return response.data.data;
  }
}

// ===== PROPERTY CLIENT =====

export class PropertyClient extends BaseClient {
  constructor(config: RisnaClientConfig) {
    super({ ...config, baseUrl: config.baseUrl || 'http://localhost:4100' });
  }

  async search(filters: PropertyFilters = {}): Promise<any> {
    return this.get('/api/v1/properties', filters);
  }

  async getById(id: string): Promise<any> {
    return this.get(`/api/v1/properties/${id}`);
  }

  async create(data: CreatePropertyInput): Promise<any> {
    return this.post('/api/v1/properties', data);
  }

  async update(id: string, data: Partial<CreatePropertyInput>): Promise<any> {
    return this.put(`/api/v1/properties/${id}`, data);
  }

  async delete(id: string): Promise<any> {
    return this.delete(`/api/v1/properties/${id}`);
  }

  async publish(id: string): Promise<any> {
    return this.post(`/api/v1/properties/${id}/publish`);
  }

  async trackView(id: string, userId?: string): Promise<any> {
    return this.post(`/api/v1/properties/${id}/view`, { userId });
  }

  async trackInquiry(id: string, userId?: string): Promise<any> {
    return this.post(`/api/v1/properties/${id}/inquire`, { userId });
  }

  async getFeatured(limit = 10): Promise<any[]> {
    return this.get('/api/v1/properties/featured', { limit });
  }

  async getNewLaunches(limit = 10): Promise<any[]> {
    return this.get('/api/v1/properties/new-launches', { limit });
  }

  async getAnalytics(id: string): Promise<any> {
    return this.get(`/api/v1/properties/${id}/analytics`);
  }

  async getSimilar(id: string, limit = 5): Promise<any[]> {
    return this.get(`/api/v1/properties/${id}/similar`, { limit });
  }
}

// ===== LEAD CLIENT =====

export class LeadClient extends BaseClient {
  constructor(config: RisnaClientConfig) {
    super({ ...config, baseUrl: config.baseUrl || 'http://localhost:4101' });
  }

  async search(filters: any = {}): Promise<any[]> {
    return this.get('/api/v1/leads', filters);
  }

  async getById(id: string): Promise<any> {
    return this.get(`/api/v1/leads/${id}`);
  }

  async getByPhone(phone: string): Promise<any> {
    return this.get(`/api/v1/leads/phone/${phone}`);
  }

  async create(data: CreateLeadInput): Promise<any> {
    return this.post('/api/v1/leads', data);
  }

  async update(id: string, data: Partial<CreateLeadInput>): Promise<any> {
    return this.put(`/api/v1/leads/${id}`, data);
  }

  async delete(id: string): Promise<any> {
    return this.delete(`/api/v1/leads/${id}`);
  }

  async score(id: string): Promise<any> {
    return this.post(`/api/v1/leads/${id}/score`);
  }

  async qualify(id: string, status: string, reason?: string): Promise<any> {
    return this.post(`/api/v1/leads/${id}/qualify`, { status, reason });
  }

  async assign(id: string, brokerId: string): Promise<any> {
    return this.post(`/api/v1/leads/${id}/assign`, { brokerId });
  }

  async addInteraction(id: string, interaction: any): Promise<any> {
    return this.post(`/api/v1/leads/${id}/interaction`, interaction);
  }

  async getHotLeads(limit = 50): Promise<any[]> {
    return this.get('/api/v1/leads/hot', { limit });
  }

  async getBySegment(segment: string, limit = 50): Promise<any[]> {
    return this.get(`/api/v1/leads/segments/${segment}`, { limit });
  }

  async getDashboard(brokerId?: string): Promise<any> {
    return this.get('/api/v1/leads/dashboard', { brokerId });
  }

  async getTimeline(id: string): Promise<any[]> {
    return this.get(`/api/v1/leads/${id}/timeline`);
  }
}

// ===== VISA CLIENT =====

export class VisaClient extends BaseClient {
  constructor(config: RisnaClientConfig) {
    super({ ...config, baseUrl: config.baseUrl || 'http://localhost:4102' });
  }

  async checkEligibility(input: any): Promise<any> {
    return this.post('/api/v1/visa/eligibility', input);
  }

  async createAssessment(input: any): Promise<any> {
    return this.post('/api/v1/visa/assessment', input);
  }

  async getAssessment(id: string): Promise<any> {
    return this.get(`/api/v1/visa/assessment/${id}`);
  }

  async getByUser(userId: string): Promise<any[]> {
    return this.get(`/api/v1/visa/user/${userId}`);
  }

  async getPrograms(): Promise<any[]> {
    return this.get('/api/v1/visa/programs');
  }

  async getRequirements(programType: string): Promise<any[]> {
    return this.get('/api/v1/visa/requirements', { programType });
  }

  async getStats(): Promise<any> {
    return this.get('/api/v1/visa/stats');
  }
}

// ===== REFERRAL CLIENT =====

export class ReferralClient extends BaseClient {
  constructor(config: RisnaClientConfig) {
    super({ ...config, baseUrl: config.baseUrl || 'http://localhost:4103' });
  }

  async create(data: any): Promise<any> {
    return this.post('/api/v1/referrals', data);
  }

  async validate(code: string): Promise<any> {
    return this.post('/api/v1/referrals/validate', { code });
  }

  async getMyReferrals(userId: string, page = 1, limit = 20): Promise<any[]> {
    return this.get('/api/v1/referrals/my', { userId, page, limit });
  }

  async getEarnings(userId: string, page = 1, limit = 20): Promise<any> {
    return this.get('/api/v1/referrals/earnings', { userId, page, limit });
  }

  async getLeaderboard(limit = 10): Promise<any[]> {
    return this.get('/api/v1/referrals/leaderboard', { limit });
  }

  async getPrograms(): Promise<any[]> {
    return this.get('/api/v1/referrals/programs');
  }

  async getStats(userId?: string): Promise<any> {
    return this.get('/api/v1/referrals/stats', { userId });
  }

  async register(id: string, refereeId: string, refereeName?: string): Promise<any> {
    return this.post(`/api/v1/referrals/${id}/register`, { refereeId, refereeName });
  }

  async markInterested(id: string): Promise<any> {
    return this.post(`/api/v1/referrals/${id}/interested`);
  }

  async markVisited(id: string): Promise<any> {
    return this.post(`/api/v1/referrals/${id}/visited`);
  }

  async markConverted(id: string, dealValue: number, propertyId?: string): Promise<any> {
    return this.post(`/api/v1/referrals/${id}/converted`, { dealValue, propertyId });
  }
}

// ===== BROKER CLIENT =====

export class BrokerClient extends BaseClient {
  constructor(config: RisnaClientConfig) {
    super({ ...config, baseUrl: config.baseUrl || 'http://localhost:4104' });
  }

  async register(data: any): Promise<any> {
    return this.post('/api/v1/brokers', data);
  }

  async search(filters: any = {}): Promise<any> {
    return this.get('/api/v1/brokers/search', filters);
  }

  async getById(id: string): Promise<any> {
    return this.get(`/api/v1/brokers/${id}`);
  }

  async getByUserId(userId: string): Promise<any> {
    return this.get(`/api/v1/brokers/user/${userId}`);
  }

  async update(id: string, data: any): Promise<any> {
    return this.put(`/api/v1/brokers/${id}`, data);
  }

  async verify(id: string, verifiedBy: string): Promise<any> {
    return this.post(`/api/v1/brokers/${id}/verify`, { verifiedBy });
  }

  async suspend(id: string, reason?: string): Promise<any> {
    return this.post(`/api/v1/brokers/${id}/suspend`, { reason });
  }

  async getStats(id: string): Promise<any> {
    return this.get(`/api/v1/brokers/${id}/stats`);
  }

  async calculateCommission(id: string, dealValue: number, propertyType?: string, listingType?: string): Promise<any> {
    return this.post(`/api/v1/brokers/${id}/commission/calculate`, { dealValue, propertyType, listingType });
  }

  async getDashboard(): Promise<any> {
    return this.get('/api/v1/brokers/dashboard');
  }

  async createTeam(name: string, managerId: string): Promise<any> {
    return this.post('/api/v1/brokers/teams', { name, managerId });
  }

  async getTeam(teamId: string): Promise<any> {
    return this.get(`/api/v1/brokers/teams/${teamId}`);
  }

  async getTeamMembers(teamId: string): Promise<any[]> {
    return this.get(`/api/v1/brokers/teams/${teamId}/members`);
  }
}

// ===== CRM CLIENT =====

export class CRMClient extends BaseClient {
  constructor(config: RisnaClientConfig) {
    super({ ...config, baseUrl: config.baseUrl || 'http://localhost:4105' });
  }

  // Follow-ups
  async createFollowUp(data: any): Promise<any> {
    return this.post('/api/v1/crm/follow-ups', data);
  }

  async getFollowUps(filters: any = {}): Promise<any[]> {
    return this.get('/api/v1/crm/follow-ups', filters);
  }

  async getDueFollowUps(brokerId: string): Promise<any[]> {
    return this.get('/api/v1/crm/follow-ups/due', { brokerId });
  }

  async completeFollowUp(id: string, outcome: string, notes?: string): Promise<any> {
    return this.post(`/api/v1/crm/follow-ups/${id}/complete`, { outcome, notes });
  }

  async rescheduleFollowUp(id: string, newScheduledAt: string): Promise<any> {
    return this.post(`/api/v1/crm/follow-ups/${id}/reschedule`, { newScheduledAt });
  }

  // Site Visits
  async createSiteVisit(data: CreateSiteVisitInput): Promise<any> {
    return this.post('/api/v1/crm/site-visits', data);
  }

  async getSiteVisits(filters: any = {}): Promise<any[]> {
    return this.get('/api/v1/crm/site-visits', filters);
  }

  async confirmSiteVisit(id: string): Promise<any> {
    return this.post(`/api/v1/crm/site-visits/${id}/confirm`);
  }

  async startSiteVisit(id: string): Promise<any> {
    return this.post(`/api/v1/crm/site-visits/${id}/start`);
  }

  async completeSiteVisit(id: string, feedback: any): Promise<any> {
    return this.post(`/api/v1/crm/site-visits/${id}/complete`, feedback);
  }

  async cancelSiteVisit(id: string, reason?: string): Promise<any> {
    return this.post(`/api/v1/crm/site-visits/${id}/cancel`, { reason });
  }

  // Dashboard
  async getDashboard(brokerId: string): Promise<any> {
    return this.get('/api/v1/crm/dashboard', { brokerId });
  }
}

// ===== MEDIA CLIENT =====

export class MediaClient extends BaseClient {
  constructor(config: RisnaClientConfig) {
    super({ ...config, baseUrl: config.baseUrl || 'http://localhost:4106' });
  }

  // Campaigns
  async createCampaign(data: CreateCampaignInput): Promise<any> {
    return this.post('/api/v1/media/campaigns', data);
  }

  async getCampaigns(filters: any = {}): Promise<any[]> {
    return this.get('/api/v1/media/campaigns', filters);
  }

  async getCampaign(id: string): Promise<any> {
    return this.get(`/api/v1/media/campaigns/${id}`);
  }

  async activateCampaign(id: string): Promise<any> {
    return this.post(`/api/v1/media/campaigns/${id}/activate`);
  }

  async pauseCampaign(id: string): Promise<any> {
    return this.post(`/api/v1/media/campaigns/${id}/pause`);
  }

  // Influencers
  async registerInfluencer(data: any): Promise<any> {
    return this.post('/api/v1/media/influencers', data);
  }

  async getInfluencers(filters: any = {}): Promise<any[]> {
    return this.get('/api/v1/media/influencers', filters);
  }

  // Property Ads
  async createPropertyAd(data: any): Promise<any> {
    return this.post('/api/v1/media/ads', data);
  }

  async getPropertyAds(filters: any = {}): Promise<any[]> {
    return this.get('/api/v1/media/ads', filters);
  }

  async pausePropertyAd(id: string): Promise<any> {
    return this.post(`/api/v1/media/ads/${id}/pause`);
  }

  // Analytics
  async getPropertyAnalytics(propertyId: string): Promise<any> {
    return this.get(`/api/v1/media/analytics/property/${propertyId}`);
  }

  async getROIAnalytics(brokerId: string): Promise<any> {
    return this.get('/api/v1/media/analytics/roi', { brokerId });
  }
}

// ===== UNIFIED CLIENT =====

export class RisnaEstate {
  public property: PropertyClient;
  public lead: LeadClient;
  public visa: VisaClient;
  public referral: ReferralClient;
  public broker: BrokerClient;
  public crm: CRMClient;
  public media: MediaClient;

  constructor(config: RisnaClientConfig = {}) {
    this.property = new PropertyClient(config);
    this.lead = new LeadClient(config);
    this.visa = new VisaClient(config);
    this.referral = new ReferralClient(config);
    this.broker = new BrokerClient(config);
    this.crm = new CRMClient(config);
    this.media = new MediaClient(config);
  }
}

// ===== EXPORTS =====

export {
  PropertyClient,
  LeadClient,
  VisaClient,
  ReferralClient,
  BrokerClient,
  CRMClient,
  MediaClient,
  RisnaEstate,
  RisnaClientConfig,
  PropertyFilters,
  CreatePropertyInput,
  CreateLeadInput,
  CreateSiteVisitInput,
  CreateCampaignInput,
};


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'risna-client',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Liveness probe
app.get('/health/live', (req, res) => {
  res.json({ status: 'alive' });
});

// Readiness probe
app.get('/health/ready', (req, res) => {
  res.json({ status: 'ready' });
});
