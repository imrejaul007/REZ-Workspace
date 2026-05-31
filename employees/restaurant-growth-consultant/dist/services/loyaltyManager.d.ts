import { LoyaltyRequest, LoyaltyResponse, LoyaltyProgram, LoyaltyMetrics } from '../types';
/**
 * Loyalty Program Manager Service
 * Designs, implements, and optimizes restaurant loyalty programs
 */
export declare class LoyaltyManagerService {
    /**
     * Design a new loyalty program or optimize existing one
     */
    designProgram(request: LoyaltyRequest): Promise<LoyaltyResponse>;
    /**
     * Design a new loyalty program from scratch
     */
    private designNewProgram;
    /**
     * Design tier structure based on average order value
     */
    private designTiers;
    /**
     * Design reward catalog
     */
    private designRewards;
    /**
     * Optimize an existing loyalty program
     */
    private optimizeExistingProgram;
    /**
     * Calculate points rate based on average order value
     */
    private calculatePointsRate;
    /**
     * Calculate loyalty metrics (using benchmarks)
     */
    private calculateMetrics;
    /**
     * Generate program recommendations
     */
    private generateRecommendations;
    /**
     * Design tier upgrade strategy
     */
    private designTierStrategy;
    /**
     * Generate loyalty campaigns
     */
    private generateCampaigns;
    /**
     * Calculate ROI of loyalty program
     */
    calculateROI(program: LoyaltyProgram, metrics: LoyaltyMetrics, implementationCost: number): Promise<{
        monthlyCost: number;
        monthlyRevenue: number;
        roi: number;
        paybackMonths: number;
    }>;
    /**
     * Generate loyalty program report
     */
    generateReport(request: LoyaltyRequest, response: LoyaltyResponse): Promise<string>;
}
export declare const loyaltyManagerService: LoyaltyManagerService;
//# sourceMappingURL=loyaltyManager.d.ts.map