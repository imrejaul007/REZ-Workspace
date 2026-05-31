import { MembershipConsultRequest, MembershipConsultResponse } from '../types';
/**
 * Membership Manager Service
 * Designs and optimizes salon membership programs
 */
export declare class MembershipManagerService {
    private readonly DEFAULT_TIERS;
    /**
     * Design membership program
     */
    designProgram(request: MembershipConsultRequest): Promise<MembershipConsultResponse>;
    /**
     * Generate membership program structure
     */
    private generateMembershipProgram;
    /**
     * Calculate membership metrics
     */
    private calculateMetrics;
    /**
     * Generate recommendations
     */
    private generateRecommendations;
    /**
     * Generate tier strategy
     */
    private generateTierStrategy;
    /**
     * Generate membership campaigns
     */
    private generateCampaigns;
    /**
     * Project membership program impact
     */
    private projectImpact;
}
export declare const membershipManagerService: MembershipManagerService;
//# sourceMappingURL=membershipManager.d.ts.map