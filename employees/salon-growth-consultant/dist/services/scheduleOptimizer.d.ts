import { ScheduleConsultRequest, ScheduleConsultResponse } from '../types';
/**
 * Schedule Optimizer Service
 * Optimizes staff scheduling and appointment slots
 */
export declare class ScheduleOptimizerService {
    private readonly PRIME_HOURS;
    private readonly OFF_PEAK_HOURS;
    /**
     * Optimize schedule
     */
    optimize(request: ScheduleConsultRequest): Promise<ScheduleConsultResponse>;
    /**
     * Analyze current schedule
     */
    private analyzeSchedule;
    /**
     * Calculate hourly demand
     */
    private calculateHourlyDemand;
    /**
     * Calculate average utilization
     */
    private calculateAverageUtilization;
    /**
     * Identify peak coverage
     */
    private identifyPeakCoverage;
    /**
     * Identify understaffed slots
     */
    private identifyUnderstaffedSlots;
    /**
     * Identify overstaffed slots
     */
    private identifyOverstaffedSlots;
    /**
     * Identify revenue opportunities
     */
    private identifyRevenueOpportunities;
    /**
     * Generate recommendations
     */
    private generateRecommendations;
    /**
     * Create optimal schedule
     */
    private createOptimalSchedule;
    /**
     * Generate buffer time recommendations
     */
    private generateBufferRecommendations;
    /**
     * Generate incentive recommendations
     */
    private generateIncentiveRecommendations;
}
export declare const scheduleOptimizerService: ScheduleOptimizerService;
//# sourceMappingURL=scheduleOptimizer.d.ts.map