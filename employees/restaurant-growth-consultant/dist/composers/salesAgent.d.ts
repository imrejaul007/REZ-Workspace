interface SalesOpportunity {
    id: string;
    type: 'upsell' | 'cross_sell' | 'bundle' | 'promotion';
    trigger: string;
    customerSegment: string;
    offer: string;
    expectedValue: number;
    conversionLikelihood: number;
}
interface SalesCampaign {
    id: string;
    name: string;
    type: 'limited_time' | 'repeat_customer' | 'high_value' | 'reactivation';
    targetCustomers: number;
    offer: string;
    expectedRevenue: number;
    roi: number;
}
/**
 * Restaurant Sales Agent
 * Composed by Restaurant Growth Consultant
 * Handles upselling, cross-selling, and sales campaigns
 */
export declare class SalesAgent {
    /**
     * Generate upselling recommendations for a customer order
     */
    generateUpsellSuggestions(currentOrder: {
        items: string[];
        total: number;
        customerId?: string;
    }, menuItems: {
        id: string;
        name: string;
        price: number;
        category: string;
        margin: number;
    }[]): Promise<{
        itemId: string;
        name: string;
        price: number;
        reason: string;
        expectedLift: number;
    }[]>;
    /**
     * Find potential upgrades for current items
     */
    private findUpgrades;
    /**
     * Generate bundle opportunities
     */
    generateBundleOpportunities(menuItems: {
        id: string;
        name: string;
        price: number;
        category: string;
        margin: number;
    }[], targetMargin?: number): Promise<{
        name: string;
        items: string[];
        originalPrice: number;
        bundlePrice: number;
        margin: number;
        savings: number;
    }[]>;
    /**
     * Identify sales opportunities
     */
    identifyOpportunities(customers: {
        id: string;
        avgOrderValue: number;
        visitFrequency: number;
        lastVisit: string;
        preferences: string[];
    }[], menuItems: {
        id: string;
        name: string;
        price: number;
        category: string;
    }[]): Promise<SalesOpportunity[]>;
    /**
     * Find related category for cross-selling
     */
    private findRelatedCategory;
    /**
     * Create sales campaigns
     */
    createCampaigns(opportunities: SalesOpportunity[], targetRevenue: number): Promise<SalesCampaign[]>;
    /**
     * Calculate campaign ROI
     */
    calculateCampaignROI(campaign: SalesCampaign, costPerCustomer?: number): {
        totalCost: number;
        expectedRevenue: number;
        roi: number;
        payback: number;
    };
}
export declare const salesAgent: SalesAgent;
export {};
//# sourceMappingURL=salesAgent.d.ts.map