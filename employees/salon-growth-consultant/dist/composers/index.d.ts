/**
 * Salon Growth Consultant - Composer Agents
 * Specialized AI agents for salon business optimization
 */
export declare const retentionAgent: {
    /**
     * Identify at-risk clients who need retention campaigns
     */
    identifyAtRiskClients(clients: {
        id: string;
        name: string;
        visitCount: number;
        lastVisit: string;
        avgSpend: number;
        lifecycleStage: string;
    }[]): {
        clientId: string;
        riskLevel: "high" | "medium" | "low";
        reason: string;
        recommendedAction: string;
    }[];
    /**
     * Calculate client lifetime value
     */
    calculateCLV(client: {
        visitCount: number;
        avgSpend: number;
        lifecycleStage: string;
    }): number;
};
export declare const upsellAgent: {
    /**
     * Generate upsell suggestions for a service
     */
    suggestUpsells(currentService: {
        id: string;
        name: string;
        category: string;
        price: number;
    }, allServices: {
        id: string;
        name: string;
        category: string;
        price: number;
        duration: number;
    }[]): {
        serviceId: string;
        name: string;
        price: number;
        reason: string;
        conversionChance: number;
    }[];
    /**
     * Calculate potential revenue from upselling
     */
    calculateUpsellPotential(monthlyClients: number, avgServiceValue: number, upsellRate: number): {
        potentialRevenue: number;
        currentRevenue: number;
        additionalRevenue: number;
    };
};
export declare const pricingAgent: {
    /**
     * Calculate optimal price for a service
     */
    calculateOptimalPrice(service: {
        name: string;
        category: string;
        cost: number;
        popularity: number;
        duration: number;
    }, competitorPrices?: {
        name: string;
        price: number;
    }[]): {
        optimalPrice: number;
        minPrice: number;
        maxPrice: number;
        strategy: string;
    };
    /**
     * Calculate price elasticity
     */
    calculatePriceElasticity(basePrice: number, currentDemand: number, proposedPrice: number): {
        elasticity: number;
        demandChange: number;
        shouldIncrease: boolean;
    };
};
export declare const campaignAgent: {
    /**
     * Generate campaign ideas for salon
     */
    generateCampaigns(goals: "acquire" | "retain" | "upsell" | "all"): {
        name: string;
        type: "acquisition" | "retention" | "upsell";
        description: string;
        targetAudience: string;
        expectedImpact: number;
        cost: number;
        duration: string;
    }[];
};
//# sourceMappingURL=index.d.ts.map