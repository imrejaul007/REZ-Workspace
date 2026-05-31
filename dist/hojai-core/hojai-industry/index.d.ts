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
export interface HojaiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: string;
}
export declare class IndustryIntelligence {
    private patterns;
    contribute(tenant_id: string, industry: string, data: Record<string, number>): Promise<{
        accepted: boolean;
    }>;
    getPatterns(industry: string): Promise<IndustryPattern[]>;
}
export declare function createIndustryRoutes(platform: IndustryIntelligence): import("express-serve-static-core").Router;
export declare function bootstrap(port?: number): Promise<{
    platform: IndustryIntelligence;
    app: import("express-serve-static-core").Express;
}>;
declare const _default: {
    IndustryIntelligence: typeof IndustryIntelligence;
    createIndustryRoutes: typeof createIndustryRoutes;
    bootstrap: typeof bootstrap;
};
export default _default;
//# sourceMappingURL=index.d.ts.map