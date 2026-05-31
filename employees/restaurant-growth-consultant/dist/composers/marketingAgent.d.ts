interface MarketingChannel {
    id: string;
    name: string;
    type: 'social' | 'email' | 'sms' | 'push' | 'influencer' | 'offline';
    reach: number;
    engagement: number;
    conversionRate: number;
    cost: number;
    roi: number;
}
interface MarketingCampaign {
    id: string;
    name: string;
    channels: string[];
    targetAudience: string;
    objective: 'awareness' | 'acquisition' | 'retention' | 'revenue';
    budget: number;
    expectedReach: number;
    expectedConversions: number;
    timeline: string;
}
/**
 * Restaurant Marketing Agent
 * Composed by Restaurant Growth Consultant
 * Handles marketing campaigns, channel optimization, and promotional strategies
 */
export declare class MarketingAgent {
    private readonly CHANNEL_BENCHMARKS;
    /**
     * Analyze marketing channels and recommend allocation
     */
    analyzeChannels(currentSpend: Map<string, number>, performance: Map<string, {
        impressions: number;
        conversions: number;
        revenue: number;
    }>): Promise<MarketingChannel[]>;
    /**
     * Get channel type
     */
    private getChannelType;
    /**
     * Recommend marketing budget allocation
     */
    recommendAllocation(totalBudget: number, objectives: ('awareness' | 'acquisition' | 'retention' | 'revenue')[]): Promise<{
        channel: string;
        budget: number;
        percent: number;
        rationale: string;
    }[]>;
    /**
     * Create marketing campaigns
     */
    createCampaigns(restaurantProfile: {
        name: string;
        cuisine: string[];
        priceRange: string;
        location: string;
    }, objectives: ('awareness' | 'acquisition' | 'retention' | 'revenue')[]): Promise<MarketingCampaign[]>;
    /**
     * Generate content calendar
     */
    generateContentCalendar(restaurantProfile: {
        name: string;
        cuisine: string[];
    }, weeks?: number): Promise<{
        week: number;
        theme: string;
        content: {
            day: string;
            type: string;
            message: string;
        }[];
    }[]>;
    /**
     * Calculate campaign effectiveness
     */
    calculateCampaignEffectiveness(campaign: MarketingCampaign, actuals: {
        reach: number;
        conversions: number;
        revenue: number;
    }): {
        reachScore: number;
        conversionScore: number;
        revenueScore: number;
        overall: number;
    };
    /**
     * Optimize for next campaign
     */
    optimizeNextCampaign(previousCampaigns: {
        name: string;
        channels: string[];
        reach: number;
        conversions: number;
        revenue: number;
    }[]): Promise<{
        channel: string;
        adjustment: 'increase' | 'decrease' | 'maintain';
        reason: string;
    }[]>;
}
export declare const marketingAgent: MarketingAgent;
export {};
//# sourceMappingURL=marketingAgent.d.ts.map