"use strict";
// ============================================
// HOJAI AI - Marketing Agent MongoDB Models
// ============================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdCopy = exports.SEOOptimization = exports.EmailCampaign = exports.Campaign = exports.SocialPost = exports.Content = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const types_1 = require("../types");
const ContentSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    title: { type: String, required: true, maxlength: 200 },
    type: {
        type: String,
        enum: Object.values(types_1.ContentType),
        required: true,
        index: true
    },
    topic: { type: String, required: true, maxlength: 1000 },
    keyPoints: { type: [String], default: [] },
    keywords: { type: [String], default: [], index: true },
    targetAudience: { type: String, required: true },
    tone: {
        type: String,
        enum: Object.values(types_1.ContentTone),
        default: types_1.ContentTone.PROFESSIONAL
    },
    status: {
        type: String,
        enum: Object.values(types_1.ContentStatus),
        default: types_1.ContentStatus.DRAFT,
        index: true
    },
    cta: { type: String, maxlength: 200 },
    references: { type: [String], default: [] },
    generatedContent: { type: String, required: true },
    wordCount: { type: Number, default: 0 },
    seoScore: { type: Number, min: 0, max: 100 },
    readabilityScore: { type: Number, min: 0, max: 100 },
    metadata: { type: mongoose_1.Schema.Types.Mixed },
    createdBy: { type: String, required: true },
    publishedAt: Date
}, {
    timestamps: true,
    collection: 'marketing_contents'
});
ContentSchema.index({ tenantId: 1, status: 1 });
ContentSchema.index({ tenantId: 1, type: 1 });
ContentSchema.index({ tenantId: 1, createdBy: 1 });
const SocialPostSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    campaignId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Campaign' },
    platform: {
        type: String,
        enum: Object.values(types_1.SocialPlatform),
        required: true,
        index: true
    },
    title: { type: String, maxlength: 200 },
    content: { type: String, required: true, maxlength: 2000 },
    mediaUrls: { type: [String], default: [] },
    hashtags: { type: [String], default: [] },
    mentions: { type: [String], default: [] },
    status: {
        type: String,
        enum: Object.values(types_1.SocialPostStatus),
        default: types_1.SocialPostStatus.DRAFT,
        index: true
    },
    scheduledFor: { type: Date, index: true },
    publishedAt: Date,
    errorMessage: String,
    engagement: {
        impressions: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        shares: { type: Number, default: 0 },
        comments: { type: Number, default: 0 }
    },
    platformPostId: String,
    metadata: { type: mongoose_1.Schema.Types.Mixed }
}, {
    timestamps: true,
    collection: 'marketing_social_posts'
});
SocialPostSchema.index({ tenantId: 1, status: 1 });
SocialPostSchema.index({ tenantId: 1, platform: 1 });
SocialPostSchema.index({ tenantId: 1, scheduledFor: 1 });
const CampaignSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true, maxlength: 200 },
    type: {
        type: String,
        enum: Object.values(types_1.CampaignType),
        required: true
    },
    objective: {
        type: String,
        enum: Object.values(types_1.CampaignObjective),
        required: true
    },
    description: { type: String, maxlength: 1000 },
    targetAudience: {
        demographics: {
            age: {
                min: Number,
                max: Number
            },
            gender: String,
            locations: [String],
            languages: [String]
        },
        interests: [String],
        behaviors: [String]
    },
    budget: {
        total: { type: Number, default: 0 },
        currency: { type: String, default: 'USD' },
        spent: { type: Number, default: 0 }
    },
    startDate: { type: Date, required: true },
    endDate: Date,
    channels: { type: [String], default: [] },
    status: {
        type: String,
        enum: Object.values(types_1.CampaignStatus),
        default: types_1.CampaignStatus.DRAFT,
        index: true
    },
    metrics: {
        impressions: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 },
        conversions: { type: Number, default: 0 },
        revenue: { type: Number, default: 0 },
        ctr: { type: Number, default: 0 },
        cpc: { type: Number, default: 0 },
        roas: { type: Number, default: 0 }
    },
    createdBy: { type: String, required: true },
    launchedAt: Date,
    completedAt: Date,
    metadata: { type: mongoose_1.Schema.Types.Mixed }
}, {
    timestamps: true,
    collection: 'marketing_campaigns'
});
CampaignSchema.index({ tenantId: 1, status: 1 });
CampaignSchema.index({ tenantId: 1, type: 1 });
CampaignSchema.index({ tenantId: 1, createdBy: 1 });
const EmailCampaignSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    campaignId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Campaign', required: true },
    subject: { type: String, required: true, maxlength: 200 },
    previewText: { type: String, maxlength: 100 },
    htmlContent: String,
    plainContent: String,
    templateId: String,
    recipientListId: String,
    segmentId: String,
    status: {
        type: String,
        enum: Object.values(types_1.EmailCampaignStatus),
        default: types_1.EmailCampaignStatus.DRAFT,
        index: true
    },
    sentCount: { type: Number, default: 0 },
    deliveredCount: { type: Number, default: 0 },
    openedCount: { type: Number, default: 0 },
    clickedCount: { type: Number, default: 0 },
    bouncedCount: { type: Number, default: 0 },
    unsubscribedCount: { type: Number, default: 0 },
    scheduledFor: { type: Date },
    sentAt: Date,
    metadata: { type: mongoose_1.Schema.Types.Mixed }
}, {
    timestamps: true,
    collection: 'marketing_email_campaigns'
});
EmailCampaignSchema.index({ tenantId: 1, status: 1 });
EmailCampaignSchema.index({ tenantId: 1, campaignId: 1 });
const SEOOptimizationSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    url: { type: String },
    type: {
        type: String,
        enum: Object.values(types_1.SEOContentType),
        required: true
    },
    targetKeywords: { type: [String], required: true, index: true },
    metaTitle: { type: String, maxlength: 60 },
    metaDescription: { type: String, maxlength: 160 },
    headings: {
        h1: { type: [String], default: [] },
        h2: { type: [String], default: [] },
        h3: { type: [String], default: [] }
    },
    contentScore: { type: Number, min: 0, max: 100 },
    keywordDensity: { type: mongoose_1.Schema.Types.Mixed },
    suggestions: { type: [String], default: [] },
    originalContent: String,
    optimizedContent: String,
    metadata: { type: mongoose_1.Schema.Types.Mixed }
}, {
    timestamps: true,
    collection: 'marketing_seo_optimizations'
});
SEOOptimizationSchema.index({ tenantId: 1, type: 1 });
SEOOptimizationSchema.index({ tenantId: 1, url: 1 }, { sparse: true });
const AdCopySchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    adType: {
        type: String,
        enum: Object.values(types_1.AdType),
        required: true,
        index: true
    },
    platform: {
        type: String,
        enum: Object.values(types_1.SocialPlatform)
    },
    productName: { type: String, required: true, maxlength: 200 },
    productDescription: { type: String, maxlength: 2000 },
    targetAudience: String,
    headlines: { type: [String], required: true, default: [] },
    descriptions: { type: [String], default: [] },
    callToActions: { type: [String], default: [] },
    body: String,
    displayUrl: String,
    keywords: { type: [String], default: [] },
    metadata: { type: mongoose_1.Schema.Types.Mixed }
}, {
    timestamps: true,
    collection: 'marketing_ad_copies'
});
AdCopySchema.index({ tenantId: 1, adType: 1 });
AdCopySchema.index({ tenantId: 1, productName: 1 });
// ============================================
// Export Models
// ============================================
exports.Content = mongoose_1.default.model('Content', ContentSchema);
exports.SocialPost = mongoose_1.default.model('SocialPost', SocialPostSchema);
exports.Campaign = mongoose_1.default.model('Campaign', CampaignSchema);
exports.EmailCampaign = mongoose_1.default.model('EmailCampaign', EmailCampaignSchema);
exports.SEOOptimization = mongoose_1.default.model('SEOOptimization', SEOOptimizationSchema);
exports.AdCopy = mongoose_1.default.model('AdCopy', AdCopySchema);
//# sourceMappingURL=index.js.map