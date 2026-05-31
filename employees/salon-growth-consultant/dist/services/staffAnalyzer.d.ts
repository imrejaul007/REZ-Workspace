import { StaffConsultRequest, StaffConsultResponse } from '../types';
/**
 * Staff Analyzer Service
 * Analyzes staff utilization, performance, and provides optimization recommendations
 */
export declare class StaffAnalyzerService {
    private readonly TARGET_UTILIZATION;
    private readonly PRIME_HOURS;
    /**
     * Analyze staff utilization and provide recommendations
     */
    analyzeStaff(request: StaffConsultRequest): Promise<StaffConsultResponse>;
    /**
     * Calculate utilization metrics for each staff member
     */
    private calculateUtilization;
    /**
     * Calculate peak hours utilization
     */
    private calculatePeakHours;
    /**
     * Calculate utilization trend based on performance
     */
    private calculateTrend;
    /**
     * Perform comprehensive analysis
     */
    private performAnalysis;
    /**
     * Identify capacity gaps
     */
    private identifyCapacityGaps;
    /**
     * Generate actionable recommendations
     */
    private generateRecommendations;
    /**
     * Generate rebooking campaigns
     */
    private generateRebookingCampaigns;
    /**
     * Identify training needs
     */
    private identifyTrainingNeeds;
}
export declare const staffAnalyzerService: StaffAnalyzerService;
//# sourceMappingURL=staffAnalyzer.d.ts.map