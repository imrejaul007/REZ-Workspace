import { BookingConsultRequest, BookingConsultResponse } from '../types';
/**
 * Booking Optimizer Service
 * Analyzes booking patterns and provides optimization recommendations
 */
export declare class BookingOptimizerService {
    private readonly PRIME_HOURS;
    private readonly OFF_PEAK_HOURS;
    /**
     * Analyze booking data and provide optimization recommendations
     */
    analyze(request: BookingConsultRequest): Promise<BookingConsultResponse>;
    /**
     * Perform comprehensive booking analysis
     */
    private performAnalysis;
    /**
     * Calculate booking trends over time
     */
    private calculateTrends;
    /**
     * Get the Monday of the week for a given date
     */
    private getWeekStart;
    /**
     * Analyze service mix
     */
    private analyzeServiceMix;
    /**
     * Identify peak booking slots
     */
    private identifyPeakSlots;
    /**
     * Identify low-utilization slots
     */
    private identifyLowSlots;
    /**
     * Calculate repeat customer rate
     */
    private calculateRepeatRate;
    /**
     * Generate recommendations
     */
    private generateRecommendations;
    /**
     * Find upsell opportunities
     */
    private findUpsellOpportunities;
    /**
     * Generate retention strategies
     */
    private generateRetentionStrategies;
}
export declare const bookingOptimizerService: BookingOptimizerService;
//# sourceMappingURL=bookingOptimizer.d.ts.map