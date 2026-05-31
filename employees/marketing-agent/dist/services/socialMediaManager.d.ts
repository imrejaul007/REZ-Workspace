import { SocialPlatform, SocialPostStatus, ISocialPost } from '../types';
export interface SocialAccount {
    platform: SocialPlatform;
    accountId: string;
    accessToken?: string;
    accountName?: string;
}
export interface SocialMediaConfig {
    accounts: SocialAccount[];
    defaultSchedulingHours: number[];
    maxPostsPerDay: number;
}
export declare class SocialMediaManagerService {
    private config;
    constructor(config?: Partial<SocialMediaConfig>);
    /**
     * Create a social media post
     */
    createPost(tenantId: string, params: {
        platform: SocialPlatform;
        content: string;
        mediaUrls?: string[];
        hashtags?: string[];
        mentions?: string[];
        scheduledFor?: string;
        title?: string;
        campaignId?: string;
    }): Promise<ISocialPost>;
    /**
     * Schedule a post for publishing
     */
    schedulePost(tenantId: string, postId: string, scheduledFor: string): Promise<ISocialPost | null>;
    /**
     * Publish a post immediately
     */
    publishPost(tenantId: string, postId: string): Promise<{
        success: boolean;
        post?: ISocialPost;
        error?: string;
    }>;
    /**
     * Publish to social platform (simulated)
     */
    private publishToPlatform;
    /**
     * Create a multi-platform social campaign
     */
    createCampaign(tenantId: string, params: {
        name: string;
        platforms: SocialPlatform[];
        posts: Array<{
            platform: SocialPlatform;
            content: string;
            mediaUrls?: string[];
            scheduledFor?: string;
        }>;
        startDate: string;
        endDate?: string;
    }): Promise<{
        campaignId: string;
        posts: ISocialPost[];
    }>;
    /**
     * Schedule posts for optimal times
     */
    scheduleOptimalTimes(tenantId: string, postIds: string[], dates: string[]): Promise<ISocialPost[]>;
    /**
     * Find optimal posting time (simplified)
     */
    private findOptimalTime;
    /**
     * Get optimal posting hours by platform
     */
    private getOptimalHours;
    /**
     * Process content (add hashtags, mentions formatting)
     */
    private processContent;
    /**
     * Get post analytics
     */
    getPostAnalytics(tenantId: string, postId: string): Promise<{
        impressions: number;
        clicks: number;
        likes: number;
        shares: number;
        comments: number;
        engagementRate: number;
    } | null>;
    /**
     * Update post engagement metrics
     */
    updateEngagement(tenantId: string, postId: string, metrics: {
        impressions?: number;
        clicks?: number;
        likes?: number;
        shares?: number;
        comments?: number;
    }): Promise<ISocialPost | null>;
    /**
     * List posts with filters
     */
    listPosts(tenantId: string, filters: {
        platform?: SocialPlatform;
        status?: SocialPostStatus;
        campaignId?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        items: ISocialPost[];
        total: number;
    }>;
    /**
     * Delete a post
     */
    deletePost(tenantId: string, postId: string): Promise<boolean>;
    /**
     * Get platform-specific content preview
     */
    getPlatformPreview(content: string, platform: SocialPlatform): {
        preview: string;
        remaining: number;
        tips: string[];
    };
    /**
     * Map document to interface
     */
    private mapToISocialPost;
}
export declare const socialMediaManager: SocialMediaManagerService;
//# sourceMappingURL=socialMediaManager.d.ts.map