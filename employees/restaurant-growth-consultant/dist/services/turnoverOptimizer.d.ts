import { TurnoverRequest, TurnoverResponse } from '../types';
/**
 * Table Turnover Optimizer Service
 * Analyzes table performance and provides recommendations to maximize revenue per seat hour
 */
export declare class TurnoverOptimizerService {
    private readonly TARGET_TURN_TIME;
    private readonly SEAT_MULTIPLIERS;
    /**
     * Analyze table turnover and provide optimization recommendations
     */
    analyze(request: TurnoverRequest): Promise<TurnoverResponse>;
    /**
     * Analyze peak hours distribution
     */
    private analyzePeakHours;
    /**
     * Calculate metrics for each table
     */
    private calculateTableMetrics;
    /**
     * Identify operational bottlenecks
     */
    private identifyBottlenecks;
    /**
     * Calculate revenue per seat hour
     */
    private calculateRevenuePerSeatHour;
    /**
     * Generate optimization recommendations
     */
    private generateRecommendations;
    /**
     * Generate schedule optimizations
     */
    private generateScheduleOptimizations;
    /**
     * Recommend automation features
     */
    private recommendAutomation;
    /**
     * Calculate optimal table layout
     */
    calculateOptimalLayout(totalSeats: number, avgPartySize: number, peakCovers: number): Promise<{
        tableConfig: {
            seats: number;
            count: number;
        }[];
        totalTables: number;
    }>;
}
export declare const turnoverOptimizerService: TurnoverOptimizerService;
//# sourceMappingURL=turnoverOptimizer.d.ts.map