interface LoyaltyMember {
    id: string;
    name: string;
    tier: string;
    points: number;
    lifetimeVisits: number;
    lifetimeValue: number;
    lastVisit: string;
    birthday?: string;
    preferences: string[];
}
interface LoyaltyCampaign {
    id: string;
    name: string;
    type: 'welcome' | 'birthday' | 'tier_upgrade' | 'reactivation' | 'referral';
    targetSegment: string;
    offer: string;
    expectedResponse: number;
    expectedRevenue: number;
    roi: number;
}
/**
 * Restaurant Loyalty Agent
 * Composed by Restaurant Growth Consultant
 * Handles loyalty program operations, member engagement, and retention campaigns
 */
export declare class LoyaltyAgent {
    /**
     * Calculate member health score
     */
    calculateMemberHealth(member: LoyaltyMember): {
        score: number;
        status: 'active' | 'at_risk' | 'lapsing' | 'churned';
        factors: string[];
    };
    /**
     * Identify members needing attention
     */
    identifyAtRiskMembers(members: LoyaltyMember[]): Promise<{
        atRisk: LoyaltyMember[];
        lapsing: LoyaltyMember[];
        churned: LoyaltyMember[];
    }>;
    /**
     * Generate retention offers
     */
    generateRetentionOffers(member: LoyaltyMember, health: {
        score: number;
        status: string;
        factors: string[];
    }): {
        offer: string;
        pointsCost: number;
        revenueImpact: number;
        priority: 'urgent' | 'high' | 'medium';
    };
    /**
     * Create loyalty campaigns
     */
    createCampaigns(members: LoyaltyMember[], segments: {
        atRisk: LoyaltyMember[];
        lapsing: LoyaltyMember[];
        churned: LoyaltyMember[];
        birthdays: LoyaltyMember[];
        tierUpgrade: LoyaltyMember[];
    }): Promise<LoyaltyCampaign[]>;
    /**
     * Calculate program health metrics
     */
    calculateProgramHealth(members: LoyaltyMember[], totalRevenue: number): {
        totalMembers: number;
        activeMembers: number;
        activeRate: number;
        avgLifetimeValue: number;
        avgVisitsPerMonth: number;
        redemptionRate: number;
        memberROI: number;
        tierDistribution: Record<string, number>;
    };
    /**
     * Identify tier upgrade candidates
     */
    identifyUpgradeCandidates(members: LoyaltyMember[]): {
        nearSilver: LoyaltyMember[];
        nearGold: LoyaltyMember[];
        nearPlatinum: LoyaltyMember[];
    };
    /**
     * Generate engagement sequence
     */
    generateEngagementSequence(member: LoyaltyMember, daysAhead?: number): {
        day: number;
        action: string;
        channel: string;
        message: string;
    }[];
    /**
     * Calculate loyalty program ROI
     */
    calculateProgramROI(programCost: number, incrementalRevenue: number, memberCount: number): {
        totalCost: number;
        incrementalRevenue: number;
        roi: number;
        costPerMember: number;
        revenuePerMember: number;
    };
}
export declare const loyaltyAgent: LoyaltyAgent;
export {};
//# sourceMappingURL=loyaltyAgent.d.ts.map