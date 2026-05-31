import { ILead, IQualification } from '../types';
export interface QualifierConfig {
    scoringWeights: {
        budget: number;
        authority: number;
        need: number;
        timeline: number;
    };
    minQualifiedScore: number;
    disqualifyConditions: {
        noBudget: boolean;
        noAuthority: boolean;
        noNeed: boolean;
        noTimeline: boolean;
    };
}
export declare class QualifierService {
    private config;
    constructor(config?: Partial<QualifierConfig>);
    /**
     * Qualify a lead using BANT framework
     */
    qualifyLead(tenantId: string, leadId: string, qualification: {
        budget: {
            hasBudget: boolean;
            amount?: number;
            currency?: string;
            comments?: string;
        };
        authority: {
            level: 'individual' | 'manager' | 'director' | 'vp' | 'cxo' | 'unknown';
            isDecisionMaker: boolean;
            involvesOthers?: boolean;
            comments?: string;
        };
        need: {
            painPoints: string[];
            priority: 'low' | 'medium' | 'high' | 'critical';
            businessImpact?: string;
        };
        timeline: {
            targetClose?: string;
            buyingStage: 'awareness' | 'consideration' | 'decision' | 'none';
            urgency: 'low' | 'medium' | 'high';
        };
    }, ownerId: string, notes?: string): Promise<{
        success: boolean;
        qualification: IQualification;
        lead: ILead;
        disqualified: boolean;
        disqualifyReason?: string;
    }>;
    /**
     * Get qualification status for a lead
     */
    getQualification(tenantId: string, leadId: string): Promise<IQualification | null>;
    /**
     * Calculate qualification score using BANT
     */
    private calculateScore;
    /**
     * Check if lead should be disqualified
     */
    private shouldDisqualify;
    /**
     * Auto-score a lead based on contact/company data
     */
    autoScore(tenantId: string, contactId: string): Promise<{
        score: number;
        scoreBreakdown: {
            companyFit: number;
            roleFit: number;
            engagementFit: number;
            intentFit: number;
        };
        recommendations: string[];
    }>;
    /**
     * Map MongoDB document to IQualification
     */
    private mapToIQualification;
    /**
     * Map MongoDB document to ILead
     */
    private mapToILead;
}
export declare const qualifierService: QualifierService;
//# sourceMappingURL=qualifier.d.ts.map