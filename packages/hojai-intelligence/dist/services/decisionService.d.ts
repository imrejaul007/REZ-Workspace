import { Decision, DecisionType } from '../types/index.js';
export declare class DecisionService {
    /**
     * Decide cashback amount for a transaction
     */
    decideCashback(params: {
        tenantId: string;
        userId: string;
        amount: number;
        context?: {
            sessionId?: string;
            channel?: string;
        };
    }): Promise<Decision>;
    /**
     * Decide offer eligibility
     */
    decideOffer(params: {
        tenantId: string;
        userId: string;
        offerId: string;
        context?: Record<string, unknown>;
    }): Promise<Decision>;
    /**
     * Decide targeting for a campaign
     */
    decideTargeting(params: {
        tenantId: string;
        campaignId: string;
        userId: string;
        context?: Record<string, unknown>;
    }): Promise<Decision>;
    /**
     * Decide fraud risk
     */
    decideFraud(params: {
        tenantId: string;
        userId: string;
        transactionData: {
            amount: number;
            velocity: number;
            riskSignals: string[];
        };
    }): Promise<Decision>;
    /**
     * Get decision by ID
     */
    getDecision(tenantId: string, decisionId: string): Promise<Decision | null>;
    /**
     * Get decisions for a user
     */
    getUserDecisions(params: {
        tenantId: string;
        userId: string;
        type?: DecisionType;
        limit?: number;
        offset?: number;
    }): Promise<{
        decisions: Decision[];
        total: number;
    }>;
    /**
     * Approve/reject a decision (manual review)
     */
    reviewDecision(params: {
        tenantId: string;
        decisionId: string;
        action: 'approve' | 'reject';
        reviewerId: string;
        notes?: string;
    }): Promise<Decision | null>;
    /**
     * Get pending manual reviews
     */
    getPendingReviews(tenantId: string, limit?: number): Promise<Decision[]>;
}
export declare const decisionService: DecisionService;
//# sourceMappingURL=decisionService.d.ts.map