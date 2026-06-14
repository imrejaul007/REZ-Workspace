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
import { AxiosInstance } from 'axios';
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
    price: {
        amount: number;
        currency: string;
    };
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
        budget?: {
            min?: number;
            max?: number;
            currency: string;
        };
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
    attendees?: Array<{
        name?: string;
        phone?: string;
        role?: string;
    }>;
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
    creatives: Array<{
        type: string;
        url: string;
        headline?: string;
        cta?: string;
    }>;
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
declare class BaseClient {
    protected client: AxiosInstance;
    constructor(config: RisnaClientConfig);
    protected get<T>(path: string, params?: Record<string, any>): Promise<T>;
    protected post<T>(path: string, data?: any): Promise<T>;
    protected put<T>(path: string, data?: any): Promise<T>;
    protected delete<T>(path: string): Promise<T>;
}
export declare class PropertyClient extends BaseClient {
    constructor(config: RisnaClientConfig);
    search(filters?: PropertyFilters): Promise<any>;
    getById(id: string): Promise<any>;
    create(data: CreatePropertyInput): Promise<any>;
    update(id: string, data: Partial<CreatePropertyInput>): Promise<any>;
    delete(id: string): Promise<any>;
    publish(id: string): Promise<any>;
    trackView(id: string, userId?: string): Promise<any>;
    trackInquiry(id: string, userId?: string): Promise<any>;
    getFeatured(limit?: number): Promise<any[]>;
    getNewLaunches(limit?: number): Promise<any[]>;
    getAnalytics(id: string): Promise<any>;
    getSimilar(id: string, limit?: number): Promise<any[]>;
}
export declare class LeadClient extends BaseClient {
    constructor(config: RisnaClientConfig);
    search(filters?: any): Promise<any[]>;
    getById(id: string): Promise<any>;
    getByPhone(phone: string): Promise<any>;
    create(data: CreateLeadInput): Promise<any>;
    update(id: string, data: Partial<CreateLeadInput>): Promise<any>;
    delete(id: string): Promise<any>;
    score(id: string): Promise<any>;
    qualify(id: string, status: string, reason?: string): Promise<any>;
    assign(id: string, brokerId: string): Promise<any>;
    addInteraction(id: string, interaction: any): Promise<any>;
    getHotLeads(limit?: number): Promise<any[]>;
    getBySegment(segment: string, limit?: number): Promise<any[]>;
    getDashboard(brokerId?: string): Promise<any>;
    getTimeline(id: string): Promise<any[]>;
}
export declare class VisaClient extends BaseClient {
    constructor(config: RisnaClientConfig);
    checkEligibility(input: any): Promise<any>;
    createAssessment(input: any): Promise<any>;
    getAssessment(id: string): Promise<any>;
    getByUser(userId: string): Promise<any[]>;
    getPrograms(): Promise<any[]>;
    getRequirements(programType: string): Promise<any[]>;
    getStats(): Promise<any>;
}
export declare class ReferralClient extends BaseClient {
    constructor(config: RisnaClientConfig);
    create(data: any): Promise<any>;
    validate(code: string): Promise<any>;
    getMyReferrals(userId: string, page?: number, limit?: number): Promise<any[]>;
    getEarnings(userId: string, page?: number, limit?: number): Promise<any>;
    getLeaderboard(limit?: number): Promise<any[]>;
    getPrograms(): Promise<any[]>;
    getStats(userId?: string): Promise<any>;
    register(id: string, refereeId: string, refereeName?: string): Promise<any>;
    markInterested(id: string): Promise<any>;
    markVisited(id: string): Promise<any>;
    markConverted(id: string, dealValue: number, propertyId?: string): Promise<any>;
}
export declare class BrokerClient extends BaseClient {
    constructor(config: RisnaClientConfig);
    register(data: any): Promise<any>;
    search(filters?: any): Promise<any>;
    getById(id: string): Promise<any>;
    getByUserId(userId: string): Promise<any>;
    update(id: string, data: any): Promise<any>;
    verify(id: string, verifiedBy: string): Promise<any>;
    suspend(id: string, reason?: string): Promise<any>;
    getStats(id: string): Promise<any>;
    calculateCommission(id: string, dealValue: number, propertyType?: string, listingType?: string): Promise<any>;
    getDashboard(): Promise<any>;
    createTeam(name: string, managerId: string): Promise<any>;
    getTeam(teamId: string): Promise<any>;
    getTeamMembers(teamId: string): Promise<any[]>;
}
export declare class CRMClient extends BaseClient {
    constructor(config: RisnaClientConfig);
    createFollowUp(data: any): Promise<any>;
    getFollowUps(filters?: any): Promise<any[]>;
    getDueFollowUps(brokerId: string): Promise<any[]>;
    completeFollowUp(id: string, outcome: string, notes?: string): Promise<any>;
    rescheduleFollowUp(id: string, newScheduledAt: string): Promise<any>;
    createSiteVisit(data: CreateSiteVisitInput): Promise<any>;
    getSiteVisits(filters?: any): Promise<any[]>;
    confirmSiteVisit(id: string): Promise<any>;
    startSiteVisit(id: string): Promise<any>;
    completeSiteVisit(id: string, feedback: any): Promise<any>;
    cancelSiteVisit(id: string, reason?: string): Promise<any>;
    getDashboard(brokerId: string): Promise<any>;
}
export declare class MediaClient extends BaseClient {
    constructor(config: RisnaClientConfig);
    createCampaign(data: CreateCampaignInput): Promise<any>;
    getCampaigns(filters?: any): Promise<any[]>;
    getCampaign(id: string): Promise<any>;
    activateCampaign(id: string): Promise<any>;
    pauseCampaign(id: string): Promise<any>;
    registerInfluencer(data: any): Promise<any>;
    getInfluencers(filters?: any): Promise<any[]>;
    createPropertyAd(data: any): Promise<any>;
    getPropertyAds(filters?: any): Promise<any[]>;
    pausePropertyAd(id: string): Promise<any>;
    getPropertyAnalytics(propertyId: string): Promise<any>;
    getROIAnalytics(brokerId: string): Promise<any>;
}
export declare class RisnaEstate {
    property: PropertyClient;
    lead: LeadClient;
    visa: VisaClient;
    referral: ReferralClient;
    broker: BrokerClient;
    crm: CRMClient;
    media: MediaClient;
    constructor(config?: RisnaClientConfig);
}
export { PropertyClient, LeadClient, VisaClient, ReferralClient, BrokerClient, CRMClient, MediaClient, RisnaEstate, RisnaClientConfig, PropertyFilters, CreatePropertyInput, CreateLeadInput, CreateSiteVisitInput, CreateCampaignInput, };
