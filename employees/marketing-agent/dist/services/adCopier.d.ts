import { AdType, SocialPlatform, IAdCopy } from '../types';
export interface AdCopierConfig {
    maxHeadlines: number;
    maxDescriptions: number;
    defaultPlatform: SocialPlatform;
}
export declare class AdCopierService {
    private config;
    constructor(config?: Partial<AdCopierConfig>);
    /**
     * Generate ad copy based on product and requirements
     */
    generateAdCopy(tenantId: string, params: {
        adType: AdType;
        productName: string;
        productDescription?: string;
        targetAudience?: string;
        headlineOptions?: number;
        descriptionOptions?: number;
        cta?: string;
        keywords?: string[];
        platform?: SocialPlatform;
    }): Promise<{
        headlines: string[];
        descriptions: string[];
        callToActions: string[];
        body?: string;
    }>;
    /**
     * Generate headlines based on ad type
     */
    private generateHeadlines;
    /**
     * Generate descriptions based on ad type and platform
     */
    private generateDescriptions;
    /**
     * Generate call-to-action variations
     */
    private generateCTAs;
    /**
     * Generate body copy
     */
    private generateBody;
    /**
     * Get ad copy by ID
     */
    getAdCopy(tenantId: string, adCopyId: string): Promise<IAdCopy | null>;
    /**
     * List ad copies
     */
    listAdCopies(tenantId: string, filters: {
        adType?: AdType;
        platform?: SocialPlatform;
        limit?: number;
        offset?: number;
    }): Promise<{
        items: IAdCopy[];
        total: number;
    }>;
    /**
     * Get A/B test variations
     */
    generateABVariations(tenantId: string, params: {
        adType: AdType;
        productName: string;
        productDescription?: string;
        targetAudience?: string;
        variations?: number;
    }): Promise<Array<{
        variationId: string;
        headlines: string[];
        descriptions: string[];
        callToActions: string[];
    }>>;
    /**
     * Get platform-specific ad copy
     */
    getPlatformAdCopy(tenantId: string, platform: SocialPlatform, adType?: AdType): Promise<IAdCopy[]>;
    /**
     * Duplicate ad copy for new platform
     */
    duplicateAdCopy(tenantId: string, adCopyId: string, newPlatform: SocialPlatform): Promise<IAdCopy | null>;
    /**
     * Shuffle array (Fisher-Yates)
     */
    private shuffleArray;
    /**
     * Map document to interface
     */
    private mapToIAdCopy;
}
export declare const adCopier: AdCopierService;
//# sourceMappingURL=adCopier.d.ts.map