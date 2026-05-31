import { GrowthConsultRequest, GrowthConsultResponse } from '../types';
/**
 * Growth Advisor Service
 * Provides comprehensive salon growth recommendations
 */
export declare class GrowthAdvisorService {
    /**
     * Generate comprehensive growth recommendations
     */
    advise(request: GrowthConsultRequest): Promise<GrowthConsultResponse>;
    /**
     * Calculate current state
     */
    private calculateCurrentState;
    /**
     * Calculate target state
     */
    private calculateTargetState;
    /**
     * Generate growth pillars
     */
    private generateGrowthPillars;
    /**
     * Generate quick wins
     */
    private generateQuickWins;
    /**
     * Generate investments
     */
    private generateInvestments;
    /**
     * Generate implementation timeline
     */
    private generateTimeline;
}
export declare const growthAdvisorService: GrowthAdvisorService;
//# sourceMappingURL=growthAdvisor.d.ts.map