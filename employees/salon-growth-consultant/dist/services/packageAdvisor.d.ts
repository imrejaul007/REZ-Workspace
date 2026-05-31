import { PackageConsultRequest, PackageConsultResponse } from '../types';
/**
 * Package Advisor Service
 * Creates and optimizes beauty service packages
 */
export declare class PackageAdvisorService {
    /**
     * Generate package recommendations
     */
    recommend(request: PackageConsultRequest): Promise<PackageConsultResponse>;
    /**
     * Analyze current packages
     */
    private analyzePackages;
    /**
     * Analyze potential service combinations
     */
    private analyzeServiceCombinations;
    /**
     * Analyze seasonal patterns
     */
    private analyzeSeasonalPatterns;
    /**
     * Generate package recommendations
     */
    private generateRecommendations;
    /**
     * Create new package suggestions
     */
    private createNewPackages;
    /**
     * Generate seasonal bundles
     */
    private generateSeasonalBundles;
    /**
     * Create upsell paths between packages
     */
    private createUpsellPaths;
}
export declare const packageAdvisorService: PackageAdvisorService;
//# sourceMappingURL=packageAdvisor.d.ts.map