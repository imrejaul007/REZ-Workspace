import { z } from 'zod';
export declare enum ContentType {
    BLOG_POST = "blog_post",
    SOCIAL_MEDIA = "social_media",
    EMAIL = "email",
    AD_COPY = "ad_copy",
    LANDING_PAGE = "landing_page",
    PRODUCT_DESCRIPTION = "product_description",
    VIDEO_SCRIPT = "video_script",
    NEWSLETTER = "newsletter",
    CASE_STUDY = "case_study",
    WHITE_PAPER = "white_paper"
}
export declare enum ContentStatus {
    DRAFT = "draft",
    REVIEW = "review",
    APPROVED = "approved",
    PUBLISHED = "published",
    ARCHIVED = "archived"
}
export declare enum ContentTone {
    PROFESSIONAL = "professional",
    CASUAL = "casual",
    HUMOROUS = "humorous",
    INSPIRATIONAL = "inspirational",
    EDUCATIONAL = "educational",
    PERSUASIVE = "persuasive",
    FORMAL = "formal",
    FRIENDLY = "friendly"
}
export declare enum SocialPlatform {
    TWITTER = "twitter",
    LINKEDIN = "linkedin",
    FACEBOOK = "facebook",
    INSTAGRAM = "instagram",
    YOUTUBE = "youtube",
    TIKTOK = "tiktok",
    THREADS = "threads",
    REDDIT = "reddit"
}
export declare enum SocialPostStatus {
    DRAFT = "draft",
    SCHEDULED = "scheduled",
    PUBLISHED = "published",
    FAILED = "failed"
}
export declare enum CampaignStatus {
    DRAFT = "draft",
    READY = "ready",
    LAUNCHED = "launched",
    PAUSED = "paused",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare enum CampaignType {
    EMAIL = "email",
    SOCIAL = "social",
    AD = "ad",
    CONTENT = "content",
    MULTI_CHANNEL = "multi_channel"
}
export declare enum CampaignObjective {
    AWARENESS = "awareness",
    CONSIDERATION = "consideration",
    CONVERSION = "conversion",
    RETENTION = "retention",
    ENGAGEMENT = "engagement"
}
export declare enum EmailCampaignStatus {
    DRAFT = "draft",
    SCHEDULED = "scheduled",
    SENDING = "sending",
    SENT = "sent",
    FAILED = "failed"
}
export declare enum AdType {
    SEARCH = "search",
    DISPLAY = "display",
    SOCIAL = "social",
    VIDEO = "video",
    NATIVE = "native",
    SEARCH_GENERATION = "search_generation"
}
export declare enum AdCopyType {
    HEADLINE = "headline",
    DESCRIPTION = "description",
    CALL_TO_ACTION = "call_to_action",
    BODY = "body",
    DISPLAY_URL = "display_url"
}
export declare enum SEOContentType {
    BLOG = "blog",
    LANDING_PAGE = "landing_page",
    PRODUCT_PAGE = "product_page",
    CATEGORY_PAGE = "category_page",
    FAQ = "faq"
}
export declare const GenerateContentSchema: z.ZodObject<{
    type: z.ZodNativeEnum<typeof ContentType>;
    topic: z.ZodString;
    keywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    targetAudience: z.ZodOptional<z.ZodString>;
    tone: z.ZodDefault<z.ZodNativeEnum<typeof ContentTone>>;
    length: z.ZodDefault<z.ZodEnum<["short", "medium", "long"]>>;
    brandVoice: z.ZodOptional<z.ZodString>;
    cta: z.ZodOptional<z.ZodString>;
    additionalContext: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    length?: "short" | "medium" | "long";
    type?: ContentType;
    topic?: string;
    keywords?: string[];
    targetAudience?: string;
    tone?: ContentTone;
    brandVoice?: string;
    cta?: string;
    additionalContext?: string;
}, {
    length?: "short" | "medium" | "long";
    type?: ContentType;
    topic?: string;
    keywords?: string[];
    targetAudience?: string;
    tone?: ContentTone;
    brandVoice?: string;
    cta?: string;
    additionalContext?: string;
}>;
export declare const ContentBriefSchema: z.ZodObject<{
    title: z.ZodString;
    type: z.ZodNativeEnum<typeof ContentType>;
    topic: z.ZodString;
    keyPoints: z.ZodArray<z.ZodString, "many">;
    keywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    targetAudience: z.ZodString;
    tone: z.ZodNativeEnum<typeof ContentTone>;
    cta: z.ZodOptional<z.ZodString>;
    references: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    type?: ContentType;
    topic?: string;
    keywords?: string[];
    targetAudience?: string;
    tone?: ContentTone;
    cta?: string;
    title?: string;
    keyPoints?: string[];
    references?: string[];
}, {
    type?: ContentType;
    topic?: string;
    keywords?: string[];
    targetAudience?: string;
    tone?: ContentTone;
    cta?: string;
    title?: string;
    keyPoints?: string[];
    references?: string[];
}>;
export declare const SocialPostSchema: z.ZodObject<{
    platform: z.ZodNativeEnum<typeof SocialPlatform>;
    content: z.ZodString;
    mediaUrls: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    hashtags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    mentions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    scheduledFor: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    content?: string;
    title?: string;
    platform?: SocialPlatform;
    mediaUrls?: string[];
    hashtags?: string[];
    mentions?: string[];
    scheduledFor?: string;
}, {
    content?: string;
    title?: string;
    platform?: SocialPlatform;
    mediaUrls?: string[];
    hashtags?: string[];
    mentions?: string[];
    scheduledFor?: string;
}>;
export declare const SocialCampaignSchema: z.ZodObject<{
    name: z.ZodString;
    platforms: z.ZodArray<z.ZodNativeEnum<typeof SocialPlatform>, "many">;
    content: z.ZodArray<z.ZodObject<{
        platform: z.ZodNativeEnum<typeof SocialPlatform>;
        content: z.ZodString;
        mediaUrls: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        scheduledFor: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        content?: string;
        platform?: SocialPlatform;
        mediaUrls?: string[];
        scheduledFor?: string;
    }, {
        content?: string;
        platform?: SocialPlatform;
        mediaUrls?: string[];
        scheduledFor?: string;
    }>, "many">;
    startDate: z.ZodString;
    endDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    content?: {
        content?: string;
        platform?: SocialPlatform;
        mediaUrls?: string[];
        scheduledFor?: string;
    }[];
    name?: string;
    platforms?: SocialPlatform[];
    startDate?: string;
    endDate?: string;
}, {
    content?: {
        content?: string;
        platform?: SocialPlatform;
        mediaUrls?: string[];
        scheduledFor?: string;
    }[];
    name?: string;
    platforms?: SocialPlatform[];
    startDate?: string;
    endDate?: string;
}>;
export declare const CreateCampaignSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodNativeEnum<typeof CampaignType>;
    objective: z.ZodNativeEnum<typeof CampaignObjective>;
    description: z.ZodString;
    targetAudience: z.ZodOptional<z.ZodObject<{
        demographics: z.ZodOptional<z.ZodObject<{
            age: z.ZodOptional<z.ZodObject<{
                min: z.ZodOptional<z.ZodNumber>;
                max: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                min?: number;
                max?: number;
            }, {
                min?: number;
                max?: number;
            }>>;
            gender: z.ZodOptional<z.ZodEnum<["male", "female", "all"]>>;
            locations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            languages: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            age?: {
                min?: number;
                max?: number;
            };
            gender?: "male" | "female" | "all";
            locations?: string[];
            languages?: string[];
        }, {
            age?: {
                min?: number;
                max?: number;
            };
            gender?: "male" | "female" | "all";
            locations?: string[];
            languages?: string[];
        }>>;
        interests: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        behaviors: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        demographics?: {
            age?: {
                min?: number;
                max?: number;
            };
            gender?: "male" | "female" | "all";
            locations?: string[];
            languages?: string[];
        };
        interests?: string[];
        behaviors?: string[];
    }, {
        demographics?: {
            age?: {
                min?: number;
                max?: number;
            };
            gender?: "male" | "female" | "all";
            locations?: string[];
            languages?: string[];
        };
        interests?: string[];
        behaviors?: string[];
    }>>;
    budget: z.ZodOptional<z.ZodObject<{
        total: z.ZodNumber;
        currency: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        total?: number;
        currency?: string;
    }, {
        total?: number;
        currency?: string;
    }>>;
    startDate: z.ZodString;
    endDate: z.ZodOptional<z.ZodString>;
    channels: z.ZodOptional<z.ZodArray<z.ZodEnum<["email", "social", "ad", "content"]>, "many">>;
}, "strip", z.ZodTypeAny, {
    description?: string;
    type?: CampaignType;
    targetAudience?: {
        demographics?: {
            age?: {
                min?: number;
                max?: number;
            };
            gender?: "male" | "female" | "all";
            locations?: string[];
            languages?: string[];
        };
        interests?: string[];
        behaviors?: string[];
    };
    name?: string;
    startDate?: string;
    endDate?: string;
    objective?: CampaignObjective;
    budget?: {
        total?: number;
        currency?: string;
    };
    channels?: ("email" | "social" | "ad" | "content")[];
}, {
    description?: string;
    type?: CampaignType;
    targetAudience?: {
        demographics?: {
            age?: {
                min?: number;
                max?: number;
            };
            gender?: "male" | "female" | "all";
            locations?: string[];
            languages?: string[];
        };
        interests?: string[];
        behaviors?: string[];
    };
    name?: string;
    startDate?: string;
    endDate?: string;
    objective?: CampaignObjective;
    budget?: {
        total?: number;
        currency?: string;
    };
    channels?: ("email" | "social" | "ad" | "content")[];
}>;
export declare const LaunchCampaignSchema: z.ZodObject<{
    campaignId: z.ZodString;
    schedule: z.ZodOptional<z.ZodObject<{
        immediate: z.ZodDefault<z.ZodBoolean>;
        startDate: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        startDate?: string;
        immediate?: boolean;
    }, {
        startDate?: string;
        immediate?: boolean;
    }>>;
}, "strip", z.ZodTypeAny, {
    campaignId?: string;
    schedule?: {
        startDate?: string;
        immediate?: boolean;
    };
}, {
    campaignId?: string;
    schedule?: {
        startDate?: string;
        immediate?: boolean;
    };
}>;
export declare const EmailCampaignSchema: z.ZodObject<{
    campaignId: z.ZodString;
    subject: z.ZodString;
    previewText: z.ZodOptional<z.ZodString>;
    htmlContent: z.ZodOptional<z.ZodString>;
    plainContent: z.ZodOptional<z.ZodString>;
    templateId: z.ZodOptional<z.ZodString>;
    recipientListId: z.ZodOptional<z.ZodString>;
    segmentId: z.ZodOptional<z.ZodString>;
    schedule: z.ZodOptional<z.ZodObject<{
        sendNow: z.ZodDefault<z.ZodBoolean>;
        scheduledFor: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        scheduledFor?: string;
        sendNow?: boolean;
    }, {
        scheduledFor?: string;
        sendNow?: boolean;
    }>>;
}, "strip", z.ZodTypeAny, {
    campaignId?: string;
    schedule?: {
        scheduledFor?: string;
        sendNow?: boolean;
    };
    subject?: string;
    previewText?: string;
    htmlContent?: string;
    plainContent?: string;
    templateId?: string;
    recipientListId?: string;
    segmentId?: string;
}, {
    campaignId?: string;
    schedule?: {
        scheduledFor?: string;
        sendNow?: boolean;
    };
    subject?: string;
    previewText?: string;
    htmlContent?: string;
    plainContent?: string;
    templateId?: string;
    recipientListId?: string;
    segmentId?: string;
}>;
export declare const SEOOptimizeSchema: z.ZodObject<{
    url: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    type: z.ZodDefault<z.ZodNativeEnum<typeof SEOContentType>>;
    targetKeywords: z.ZodArray<z.ZodString, "many">;
    competitorUrls: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    metaTitle: z.ZodOptional<z.ZodString>;
    metaDescription: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    content?: string;
    type?: SEOContentType;
    url?: string;
    targetKeywords?: string[];
    competitorUrls?: string[];
    metaTitle?: string;
    metaDescription?: string;
}, {
    content?: string;
    type?: SEOContentType;
    url?: string;
    targetKeywords?: string[];
    competitorUrls?: string[];
    metaTitle?: string;
    metaDescription?: string;
}>;
export declare const GenerateAdCopySchema: z.ZodObject<{
    adType: z.ZodNativeEnum<typeof AdType>;
    productName: z.ZodString;
    productDescription: z.ZodOptional<z.ZodString>;
    targetAudience: z.ZodOptional<z.ZodString>;
    headlineOptions: z.ZodDefault<z.ZodNumber>;
    descriptionOptions: z.ZodDefault<z.ZodNumber>;
    cta: z.ZodOptional<z.ZodString>;
    keywords: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    platform: z.ZodOptional<z.ZodNativeEnum<typeof SocialPlatform>>;
}, "strip", z.ZodTypeAny, {
    keywords?: string[];
    targetAudience?: string;
    cta?: string;
    platform?: SocialPlatform;
    adType?: AdType;
    productName?: string;
    productDescription?: string;
    headlineOptions?: number;
    descriptionOptions?: number;
}, {
    keywords?: string[];
    targetAudience?: string;
    cta?: string;
    platform?: SocialPlatform;
    adType?: AdType;
    productName?: string;
    productDescription?: string;
    headlineOptions?: number;
    descriptionOptions?: number;
}>;
export interface IContent extends z.infer<typeof ContentBriefSchema> {
    id: string;
    tenantId: string;
    status: ContentStatus;
    generatedContent: string;
    seoScore?: number;
    readabilityScore?: number;
    wordCount: number;
    metadata?: Record<string, unknown>;
    createdBy: string;
    publishedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface ISocialPost extends z.infer<typeof SocialPostSchema> {
    id: string;
    tenantId: string;
    campaignId?: string;
    status: SocialPostStatus;
    publishedAt?: Date;
    engagement?: {
        impressions: number;
        clicks: number;
        likes: number;
        shares: number;
        comments: number;
    };
    errorMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface ICampaign extends z.infer<typeof CreateCampaignSchema> {
    id: string;
    tenantId: string;
    status: CampaignStatus;
    metrics?: {
        impressions: number;
        clicks: number;
        conversions: number;
        revenue: number;
        ctr: number;
        cpc: number;
        roas: number;
    };
    createdBy: string;
    launchedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface IEmailCampaign extends z.infer<typeof EmailCampaignSchema> {
    id: string;
    tenantId: string;
    campaignId: string;
    status: EmailCampaignStatus;
    sentCount?: number;
    deliveredCount?: number;
    openedCount?: number;
    clickedCount?: number;
    bouncedCount?: number;
    unsubscribedCount?: number;
    sentAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface ISEOOptimization {
    id: string;
    tenantId: string;
    url?: string;
    type: SEOContentType;
    targetKeywords: string[];
    metaTitle?: string;
    metaDescription?: string;
    headings?: {
        h1: string[];
        h2: string[];
        h3: string[];
    };
    contentScore?: number;
    keywordDensity?: Record<string, number>;
    suggestions?: string[];
    optimizedContent?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface IAdCopy {
    id: string;
    tenantId: string;
    adType: AdType;
    platform?: SocialPlatform;
    productName: string;
    productDescription?: string;
    targetAudience?: string;
    headlines: string[];
    descriptions: string[];
    callToActions: string[];
    body?: string;
    displayUrl?: string;
    keywords?: string[];
    createdAt: Date;
    updatedAt: Date;
}
export interface GenerateContentRequest {
    content: z.infer<typeof GenerateContentSchema>;
}
export interface GenerateContentResponse {
    success: boolean;
    data?: {
        content: string;
        metadata: {
            wordCount: number;
            readabilityScore: number;
            seoScore: number;
            suggestedKeywords: string[];
            hashtags: string[];
        };
    };
    error?: {
        code: string;
        message: string;
    };
}
export interface SocialPostRequest {
    post: z.infer<typeof SocialPostSchema>;
}
export interface SocialPostResponse {
    success: boolean;
    data?: {
        post: ISocialPost;
        platformResponse?: Record<string, unknown>;
    };
    error?: {
        code: string;
        message: string;
    };
}
export interface CreateCampaignRequest {
    campaign: z.infer<typeof CreateCampaignSchema>;
}
export interface LaunchCampaignRequest {
    campaignId: string;
    immediate?: boolean;
    startDate?: string;
}
export interface LaunchCampaignResponse {
    success: boolean;
    data?: {
        campaignId: string;
        status: CampaignStatus;
        launchedAt: Date;
    };
    error?: {
        code: string;
        message: string;
    };
}
export interface SEOOptimizeRequest {
    seo: z.infer<typeof SEOOptimizeSchema>;
}
export interface SEOOptimizeResponse {
    success: boolean;
    data?: {
        metaTitle: string;
        metaDescription: string;
        suggestions: string[];
        contentScore: number;
        keywordDensity: Record<string, number>;
        optimizedContent?: string;
    };
    error?: {
        code: string;
        message: string;
    };
}
export interface GenerateAdCopyRequest {
    ad: z.infer<typeof GenerateAdCopySchema>;
}
export interface GenerateAdCopyResponse {
    success: boolean;
    data?: {
        headlines: string[];
        descriptions: string[];
        callToActions: string[];
        body?: string;
    };
    error?: {
        code: string;
        message: string;
    };
}
export interface TenantContext {
    tenantId: string;
    userId?: string;
    roles?: string[];
}
export interface MarketingAgentConfig {
    tenantId: string;
    ownerId: string;
    defaultTone: ContentTone;
    socialAccounts: {
        platform: SocialPlatform;
        accessToken?: string;
        accountId?: string;
    }[];
    emailProvider?: {
        provider: 'sendgrid' | 'mailgun' | 'ses' | 'smtp';
        apiKey?: string;
        fromEmail: string;
        fromName: string;
    };
    adPlatforms?: {
        platform: 'google' | 'facebook' | 'linkedin' | 'twitter';
        accountId: string;
        accessToken?: string;
    }[];
    aiModel?: string;
    maxContentLength?: number;
}
export interface ContentGenerationContext {
    industry?: string;
    productType?: string;
    competitors?: string[];
    trendingTopics?: string[];
    targetKeywords?: string[];
}
export interface CampaignMetrics {
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    ctr: number;
    cpc: number;
    cpm: number;
    roas: number;
    conversionRate: number;
}
export interface SocialAnalytics {
    platform: SocialPlatform;
    followers: number;
    engagement: {
        likes: number;
        comments: number;
        shares: number;
        saves: number;
    };
    reach: number;
    impressions: number;
    avgEngagementRate: number;
}
//# sourceMappingURL=index.d.ts.map