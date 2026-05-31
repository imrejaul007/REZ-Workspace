"use strict";
// ============================================
// HOJAI AI - Marketing Agent Type Definitions
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateAdCopySchema = exports.SEOOptimizeSchema = exports.EmailCampaignSchema = exports.LaunchCampaignSchema = exports.CreateCampaignSchema = exports.SocialCampaignSchema = exports.SocialPostSchema = exports.ContentBriefSchema = exports.GenerateContentSchema = exports.SEOContentType = exports.AdCopyType = exports.AdType = exports.EmailCampaignStatus = exports.CampaignObjective = exports.CampaignType = exports.CampaignStatus = exports.SocialPostStatus = exports.SocialPlatform = exports.ContentTone = exports.ContentStatus = exports.ContentType = void 0;
const zod_1 = require("zod");
// ============================================
// Enums
// ============================================
var ContentType;
(function (ContentType) {
    ContentType["BLOG_POST"] = "blog_post";
    ContentType["SOCIAL_MEDIA"] = "social_media";
    ContentType["EMAIL"] = "email";
    ContentType["AD_COPY"] = "ad_copy";
    ContentType["LANDING_PAGE"] = "landing_page";
    ContentType["PRODUCT_DESCRIPTION"] = "product_description";
    ContentType["VIDEO_SCRIPT"] = "video_script";
    ContentType["NEWSLETTER"] = "newsletter";
    ContentType["CASE_STUDY"] = "case_study";
    ContentType["WHITE_PAPER"] = "white_paper";
})(ContentType || (exports.ContentType = ContentType = {}));
var ContentStatus;
(function (ContentStatus) {
    ContentStatus["DRAFT"] = "draft";
    ContentStatus["REVIEW"] = "review";
    ContentStatus["APPROVED"] = "approved";
    ContentStatus["PUBLISHED"] = "published";
    ContentStatus["ARCHIVED"] = "archived";
})(ContentStatus || (exports.ContentStatus = ContentStatus = {}));
var ContentTone;
(function (ContentTone) {
    ContentTone["PROFESSIONAL"] = "professional";
    ContentTone["CASUAL"] = "casual";
    ContentTone["HUMOROUS"] = "humorous";
    ContentTone["INSPIRATIONAL"] = "inspirational";
    ContentTone["EDUCATIONAL"] = "educational";
    ContentTone["PERSUASIVE"] = "persuasive";
    ContentTone["FORMAL"] = "formal";
    ContentTone["FRIENDLY"] = "friendly";
})(ContentTone || (exports.ContentTone = ContentTone = {}));
var SocialPlatform;
(function (SocialPlatform) {
    SocialPlatform["TWITTER"] = "twitter";
    SocialPlatform["LINKEDIN"] = "linkedin";
    SocialPlatform["FACEBOOK"] = "facebook";
    SocialPlatform["INSTAGRAM"] = "instagram";
    SocialPlatform["YOUTUBE"] = "youtube";
    SocialPlatform["TIKTOK"] = "tiktok";
    SocialPlatform["THREADS"] = "threads";
    SocialPlatform["REDDIT"] = "reddit";
})(SocialPlatform || (exports.SocialPlatform = SocialPlatform = {}));
var SocialPostStatus;
(function (SocialPostStatus) {
    SocialPostStatus["DRAFT"] = "draft";
    SocialPostStatus["SCHEDULED"] = "scheduled";
    SocialPostStatus["PUBLISHED"] = "published";
    SocialPostStatus["FAILED"] = "failed";
})(SocialPostStatus || (exports.SocialPostStatus = SocialPostStatus = {}));
var CampaignStatus;
(function (CampaignStatus) {
    CampaignStatus["DRAFT"] = "draft";
    CampaignStatus["READY"] = "ready";
    CampaignStatus["LAUNCHED"] = "launched";
    CampaignStatus["PAUSED"] = "paused";
    CampaignStatus["COMPLETED"] = "completed";
    CampaignStatus["CANCELLED"] = "cancelled";
})(CampaignStatus || (exports.CampaignStatus = CampaignStatus = {}));
var CampaignType;
(function (CampaignType) {
    CampaignType["EMAIL"] = "email";
    CampaignType["SOCIAL"] = "social";
    CampaignType["AD"] = "ad";
    CampaignType["CONTENT"] = "content";
    CampaignType["MULTI_CHANNEL"] = "multi_channel";
})(CampaignType || (exports.CampaignType = CampaignType = {}));
var CampaignObjective;
(function (CampaignObjective) {
    CampaignObjective["AWARENESS"] = "awareness";
    CampaignObjective["CONSIDERATION"] = "consideration";
    CampaignObjective["CONVERSION"] = "conversion";
    CampaignObjective["RETENTION"] = "retention";
    CampaignObjective["ENGAGEMENT"] = "engagement";
})(CampaignObjective || (exports.CampaignObjective = CampaignObjective = {}));
var EmailCampaignStatus;
(function (EmailCampaignStatus) {
    EmailCampaignStatus["DRAFT"] = "draft";
    EmailCampaignStatus["SCHEDULED"] = "scheduled";
    EmailCampaignStatus["SENDING"] = "sending";
    EmailCampaignStatus["SENT"] = "sent";
    EmailCampaignStatus["FAILED"] = "failed";
})(EmailCampaignStatus || (exports.EmailCampaignStatus = EmailCampaignStatus = {}));
var AdType;
(function (AdType) {
    AdType["SEARCH"] = "search";
    AdType["DISPLAY"] = "display";
    AdType["SOCIAL"] = "social";
    AdType["VIDEO"] = "video";
    AdType["NATIVE"] = "native";
    AdType["SEARCH_GENERATION"] = "search_generation";
})(AdType || (exports.AdType = AdType = {}));
var AdCopyType;
(function (AdCopyType) {
    AdCopyType["HEADLINE"] = "headline";
    AdCopyType["DESCRIPTION"] = "description";
    AdCopyType["CALL_TO_ACTION"] = "call_to_action";
    AdCopyType["BODY"] = "body";
    AdCopyType["DISPLAY_URL"] = "display_url";
})(AdCopyType || (exports.AdCopyType = AdCopyType = {}));
var SEOContentType;
(function (SEOContentType) {
    SEOContentType["BLOG"] = "blog";
    SEOContentType["LANDING_PAGE"] = "landing_page";
    SEOContentType["PRODUCT_PAGE"] = "product_page";
    SEOContentType["CATEGORY_PAGE"] = "category_page";
    SEOContentType["FAQ"] = "faq";
})(SEOContentType || (exports.SEOContentType = SEOContentType = {}));
// ============================================
// Zod Schemas for Validation
// ============================================
// Content Generation Schemas
exports.GenerateContentSchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(ContentType),
    topic: zod_1.z.string().min(1).max(500),
    keywords: zod_1.z.array(zod_1.z.string()).optional(),
    targetAudience: zod_1.z.string().optional(),
    tone: zod_1.z.nativeEnum(ContentTone).default(ContentTone.PROFESSIONAL),
    length: zod_1.z.enum(['short', 'medium', 'long']).default('medium'),
    brandVoice: zod_1.z.string().max(200).optional(),
    cta: zod_1.z.string().max(200).optional(),
    additionalContext: zod_1.z.string().max(2000).optional()
});
exports.ContentBriefSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    type: zod_1.z.nativeEnum(ContentType),
    topic: zod_1.z.string().min(1).max(1000),
    keyPoints: zod_1.z.array(zod_1.z.string()),
    keywords: zod_1.z.array(zod_1.z.string()).optional(),
    targetAudience: zod_1.z.string(),
    tone: zod_1.z.nativeEnum(ContentTone),
    cta: zod_1.z.string().optional(),
    references: zod_1.z.array(zod_1.z.string()).optional()
});
// Social Media Schemas
exports.SocialPostSchema = zod_1.z.object({
    platform: zod_1.z.nativeEnum(SocialPlatform),
    content: zod_1.z.string().min(1).max(2000),
    mediaUrls: zod_1.z.array(zod_1.z.string().url()).optional(),
    hashtags: zod_1.z.array(zod_1.z.string().max(30)).optional(),
    mentions: zod_1.z.array(zod_1.z.string()).optional(),
    scheduledFor: zod_1.z.string().datetime().optional(),
    title: zod_1.z.string().max(200).optional()
});
exports.SocialCampaignSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    platforms: zod_1.z.array(zod_1.z.nativeEnum(SocialPlatform)).min(1),
    content: zod_1.z.array(zod_1.z.object({
        platform: zod_1.z.nativeEnum(SocialPlatform),
        content: zod_1.z.string().min(1).max(2000),
        mediaUrls: zod_1.z.array(zod_1.z.string().url()).optional(),
        scheduledFor: zod_1.z.string().datetime().optional()
    })).min(1),
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime().optional()
});
// Campaign Schemas
exports.CreateCampaignSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    type: zod_1.z.nativeEnum(CampaignType),
    objective: zod_1.z.nativeEnum(CampaignObjective),
    description: zod_1.z.string().max(1000),
    targetAudience: zod_1.z.object({
        demographics: zod_1.z.object({
            age: zod_1.z.object({
                min: zod_1.z.number().min(13).optional(),
                max: zod_1.z.number().max(120).optional()
            }).optional(),
            gender: zod_1.z.enum(['male', 'female', 'all']).optional(),
            locations: zod_1.z.array(zod_1.z.string()).optional(),
            languages: zod_1.z.array(zod_1.z.string()).optional()
        }).optional(),
        interests: zod_1.z.array(zod_1.z.string()).optional(),
        behaviors: zod_1.z.array(zod_1.z.string()).optional()
    }).optional(),
    budget: zod_1.z.object({
        total: zod_1.z.number().min(0),
        currency: zod_1.z.string().default('USD')
    }).optional(),
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime().optional(),
    channels: zod_1.z.array(zod_1.z.enum(['email', 'social', 'ad', 'content'])).optional()
});
exports.LaunchCampaignSchema = zod_1.z.object({
    campaignId: zod_1.z.string().uuid(),
    schedule: zod_1.z.object({
        immediate: zod_1.z.boolean().default(false),
        startDate: zod_1.z.string().datetime().optional()
    }).optional()
});
// Email Campaign Schemas
exports.EmailCampaignSchema = zod_1.z.object({
    campaignId: zod_1.z.string().uuid(),
    subject: zod_1.z.string().min(1).max(200),
    previewText: zod_1.z.string().max(100).optional(),
    htmlContent: zod_1.z.string().optional(),
    plainContent: zod_1.z.string().optional(),
    templateId: zod_1.z.string().optional(),
    recipientListId: zod_1.z.string().optional(),
    segmentId: zod_1.z.string().optional(),
    schedule: zod_1.z.object({
        sendNow: zod_1.z.boolean().default(true),
        scheduledFor: zod_1.z.string().datetime().optional()
    }).optional()
});
// SEO Schemas
exports.SEOOptimizeSchema = zod_1.z.object({
    url: zod_1.z.string().url().optional(),
    content: zod_1.z.string().min(1).max(50000).optional(),
    type: zod_1.z.nativeEnum(SEOContentType).default(SEOContentType.BLOG),
    targetKeywords: zod_1.z.array(zod_1.z.string()).min(1),
    competitorUrls: zod_1.z.array(zod_1.z.string().url()).optional(),
    metaTitle: zod_1.z.string().max(60).optional(),
    metaDescription: zod_1.z.string().max(160).optional()
});
// Ad Copy Schemas
exports.GenerateAdCopySchema = zod_1.z.object({
    adType: zod_1.z.nativeEnum(AdType),
    productName: zod_1.z.string().min(1).max(200),
    productDescription: zod_1.z.string().max(2000).optional(),
    targetAudience: zod_1.z.string().optional(),
    headlineOptions: zod_1.z.number().min(1).max(10).default(3),
    descriptionOptions: zod_1.z.number().min(1).max(5).default(2),
    cta: zod_1.z.string().max(30).optional(),
    keywords: zod_1.z.array(zod_1.z.string()).optional(),
    platform: zod_1.z.nativeEnum(SocialPlatform).optional()
});
//# sourceMappingURL=index.js.map