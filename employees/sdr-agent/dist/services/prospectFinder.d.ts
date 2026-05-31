import { IProspect } from '../types';
export interface ProspectFinderConfig {
    idealCustomerProfile: {
        industries: string[];
        companySizes: string[];
        titles: string[];
        technologies: string[];
    };
    sources: {
        linkedin: {
            enabled: boolean;
            apiKey?: string;
        };
        crunchbase: {
            enabled: boolean;
            apiKey?: string;
        };
        github: {
            enabled: boolean;
        };
        zoomInfo: {
            enabled: boolean;
            apiKey?: string;
        };
    };
}
export declare class ProspectFinderService {
    private config;
    constructor(config?: Partial<ProspectFinderConfig>);
    /**
     * Find prospects based on search criteria
     */
    findProspects(tenantId: string, search: {
        industry?: string[];
        companySize?: string[];
        location?: {
            cities?: string[];
            states?: string[];
            countries?: string[];
        };
        title?: string[];
        keywords?: string[];
        excludeKeywords?: string[];
        technologies?: string[];
        fundingStage?: string[];
        recentlyHired?: boolean;
        jobChanges?: {
            titles?: string[];
            withinDays?: number;
        };
    }, limit?: number, offset?: number): Promise<{
        prospects: IProspect[];
        total: number;
        hasMore: boolean;
    }>;
    /**
     * Generate new prospects using configured sources
     */
    generateProspects(tenantId: string, criteria: {
        industry?: string;
        companySize?: string;
        location?: string;
        title?: string;
    }, limit?: number): Promise<IProspect[]>;
    /**
     * Calculate match score based on ICP fit
     */
    private calculateMatchScore;
    /**
     * Generate mock prospects for demo purposes
     */
    private generateMockProspects;
    /**
     * Store generated prospect in database
     */
    private storeProspect;
    /**
     * Map MongoDB document to IContact interface
     */
    private mapToIContact;
    /**
     * Map MongoDB document to ICompany interface
     */
    private mapToICompany;
    /**
     * Create empty company from contact data
     */
    private createEmptyCompany;
}
export declare const prospectFinder: ProspectFinderService;
//# sourceMappingURL=prospectFinder.d.ts.map