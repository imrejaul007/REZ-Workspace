/**
 * Hojai Industry Intelligence Platform
 * Version: 1.0 | Date: May 30, 2026
 *
 * Privacy-preserving cross-tenant learning
 */
export interface IndustryPattern {
    id: string;
    industry: string;
    pattern_type: string;
    values: Record<string, number>;
    tenant_count: number;
    confidence: number;
    updated_at: string;
}
export declare class IndustryIntelligence {
    private patterns;
    contribute(tenant_id: string, industry: string, data: Record<string, number>): Promise<{
        accepted: boolean;
    }>;
    getPatterns(industry: string): Promise<IndustryPattern[]>;
}
export default IndustryIntelligence;
//# sourceMappingURL=index.d.ts.map