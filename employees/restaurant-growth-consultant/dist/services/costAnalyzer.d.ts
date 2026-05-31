import { FoodCostRequest, FoodCostResponse, FoodCostAnalysis, Ingredient } from '../types';
/**
 * Food Cost Analyzer Service
 * Comprehensive food cost optimization including vendor analysis, waste reduction, and recipe optimization
 */
export declare class CostAnalyzerService {
    private readonly IDEAL_FOOD_COST;
    /**
     * Analyze food costs and provide optimization recommendations
     */
    analyze(request: FoodCostRequest): Promise<FoodCostResponse>;
    /**
     * Analyze vendor performance
     */
    private analyzeVendors;
    /**
     * Assess vendor quality score
     */
    private assessVendorQuality;
    /**
     * Calculate potential savings from vendor optimization
     */
    private calculateVendorSavings;
    /**
     * Analyze waste patterns
     */
    private analyzeWaste;
    /**
     * Analyze individual recipe costs
     */
    private analyzeRecipes;
    /**
     * Calculate potential monthly savings
     */
    private calculateSavings;
    /**
     * Generate optimization recommendations
     */
    private generateRecommendations;
    /**
     * Calculate cost reduction breakdown by timeframe
     */
    private calculateCostReduction;
    /**
     * Calculate optimal order quantities
     */
    calculateOptimalOrder(ingredients: Ingredient[], dailyUsage: Map<string, number>, leadTimeDays: number): Promise<Map<string, {
        orderQty: number;
        reorderPoint: number;
        daysOfStock: number;
    }>>;
    /**
     * Generate purchasing report
     */
    generatePurchasingReport(request: FoodCostRequest, analysis: FoodCostAnalysis): Promise<string>;
}
export declare const costAnalyzerService: CostAnalyzerService;
//# sourceMappingURL=costAnalyzer.d.ts.map