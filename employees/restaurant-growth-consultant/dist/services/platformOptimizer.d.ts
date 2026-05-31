import { PlatformOptimizationRequest, PlatformOptimizationResponse, PlatformMetrics } from '../types';
/**
 * Platform Optimizer Service
 * Optimizes restaurant presence on Zomato and Swiggy
 */
export declare class PlatformOptimizerService {
    private readonly PLATFORM_COMMISSION;
    private readonly DELIVERY_TIME_TARGETS;
    /**
     * Optimize restaurant presence on food delivery platforms
     */
    optimize(request: PlatformOptimizationRequest): Promise<PlatformOptimizationResponse>;
    /**
     * Optimize restaurant profile
     */
    private optimizeProfile;
    /**
     * Analyze photo quality based on count and variety
     */
    private analyzePhotoQuality;
    /**
     * Analyze description quality
     */
    private analyzeDescription;
    /**
     * Suggest relevant badges to pursue
     */
    private suggestBadges;
    /**
     * Optimize menu for platform success
     */
    private optimizeMenu;
    /**
     * Develop platform-specific pricing strategy
     */
    private developPricingStrategy;
    /**
     * Optimize operational aspects
     */
    private optimizeOperations;
    /**
     * Develop strategy for busy hours
     */
    private developBusyHoursStrategy;
    /**
     * Develop review strategy for platforms
     */
    private developReviewStrategy;
    /**
     * Optimize commission structure
     */
    private optimizeCommissions;
    /**
     * Generate prioritized recommendations
     */
    private generateRecommendations;
    /**
     * Compare platforms and recommend allocation
     */
    comparePlatforms(zomatoMetrics: PlatformMetrics, swiggyMetrics: PlatformMetrics): Promise<{
        recommendation: 'zomato' | 'swiggy' | 'balanced';
        rationale: string;
        allocation: {
            zomato: number;
            swiggy: number;
        };
    }>;
    /**
     * Generate platform optimization report
     */
    generateReport(request: PlatformOptimizationRequest, response: PlatformOptimizationResponse): Promise<string>;
}
export declare const platformOptimizerService: PlatformOptimizerService;
//# sourceMappingURL=platformOptimizer.d.ts.map