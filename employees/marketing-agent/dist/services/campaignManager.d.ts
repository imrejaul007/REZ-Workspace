import { CampaignStatus, CampaignType, CampaignObjective, ICampaign } from '../types';
export interface CampaignConfig {
    autoOptimize: boolean;
    defaultBudget: number;
    defaultCurrency: string;
}
export declare class CampaignManagerService {
    private config;
    constructor(config?: Partial<CampaignConfig>);
    /**
     * Create a new campaign
     */
    createCampaign(tenantId: string, userId: string, params: {
        name: string;
        type: CampaignType;
        objective: CampaignObjective;
        description?: string;
        targetAudience?: {
            demographics?: {
                age?: {
                    min?: number;
                    max?: number;
                };
                gender?: 'male' | 'female' | 'all';
                locations?: string[];
                languages?: string[];
            };
            interests?: string[];
            behaviors?: string[];
        };
        budget?: {
            total: number;
            currency?: string;
        };
        startDate: string;
        endDate?: string;
        channels?: string[];
    }): Promise<ICampaign>;
    /**
     * Get campaign by ID
     */
    getCampaign(tenantId: string, campaignId: string): Promise<ICampaign | null>;
    /**
     * List campaigns with filters
     */
    listCampaigns(tenantId: string, filters: {
        status?: CampaignStatus;
        type?: CampaignType;
        objective?: CampaignObjective;
        limit?: number;
        offset?: number;
    }): Promise<{
        items: ICampaign[];
        total: number;
    }>;
    /**
     * Launch a campaign
     */
    launchCampaign(tenantId: string, campaignId: string, immediate?: boolean, startDate?: string): Promise<{
        success: boolean;
        campaign?: ICampaign;
        error?: string;
    }>;
    /**
     * Pause a campaign
     */
    pauseCampaign(tenantId: string, campaignId: string): Promise<ICampaign | null>;
    /**
     * Resume a paused campaign
     */
    resumeCampaign(tenantId: string, campaignId: string): Promise<ICampaign | null>;
    /**
     * Complete a campaign
     */
    completeCampaign(tenantId: string, campaignId: string): Promise<ICampaign | null>;
    /**
     * Cancel a campaign
     */
    cancelCampaign(tenantId: string, campaignId: string): Promise<ICampaign | null>;
    /**
     * Update campaign
     */
    updateCampaign(tenantId: string, campaignId: string, updates: Partial<{
        name: string;
        description: string;
        budget: {
            total: number;
        };
        endDate: string;
        targetAudience: ICampaign['targetAudience'];
    }>): Promise<ICampaign | null>;
    /**
     * Update campaign metrics
     */
    updateMetrics(tenantId: string, campaignId: string, metrics: {
        impressions?: number;
        clicks?: number;
        conversions?: number;
        revenue?: number;
    }): Promise<ICampaign | null>;
    /**
     * Get campaign performance summary
     */
    getCampaignSummary(tenantId: string, campaignId: string): Promise<{
        campaign: ICampaign;
        emailStats?: {
            sent: number;
            delivered: number;
            opened: number;
            clicked: number;
            bounced: number;
            openRate: number;
            clickRate: number;
        };
        socialStats?: {
            posts: number;
            scheduled: number;
            published: number;
            totalImpressions: number;
            avgEngagement: number;
        };
    } | null>;
    /**
     * Create email campaign
     */
    private createEmailCampaign;
    /**
     * Validate campaign is ready for launch
     */
    private validateCampaign;
    /**
     * Map document to interface
     */
    private mapToICampaign;
}
export declare const campaignManager: CampaignManagerService;
//# sourceMappingURL=campaignManager.d.ts.map