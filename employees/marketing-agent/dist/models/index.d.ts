import mongoose, { Document, Model } from 'mongoose';
import { ContentType, ContentStatus, ContentTone, SocialPlatform, SocialPostStatus, CampaignStatus, CampaignType, CampaignObjective, EmailCampaignStatus, AdType, SEOContentType } from '../types';
export interface IContentDocument extends Document {
    _id: mongoose.Types.ObjectId;
    tenantId: string;
    title: string;
    type: ContentType;
    topic: string;
    keyPoints: string[];
    keywords: string[];
    targetAudience: string;
    tone: ContentTone;
    status: ContentStatus;
    cta?: string;
    references: string[];
    generatedContent: string;
    wordCount: number;
    seoScore?: number;
    readabilityScore?: number;
    metadata?: Record<string, unknown>;
    createdBy: string;
    publishedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface ISocialPostDocument extends Document {
    _id: mongoose.Types.ObjectId;
    tenantId: string;
    campaignId?: mongoose.Types.ObjectId;
    platform: SocialPlatform;
    title?: string;
    content: string;
    mediaUrls: string[];
    hashtags: string[];
    mentions: string[];
    status: SocialPostStatus;
    scheduledFor?: Date;
    publishedAt?: Date;
    errorMessage?: string;
    engagement?: {
        impressions: number;
        clicks: number;
        likes: number;
        shares: number;
        comments: number;
    };
    platformPostId?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
export interface ICampaignDocument extends Document {
    _id: mongoose.Types.ObjectId;
    tenantId: string;
    name: string;
    type: CampaignType;
    objective: CampaignObjective;
    description: string;
    targetAudience: {
        demographics?: {
            age?: {
                min?: number;
                max?: number;
            };
            gender?: 'male' | 'female' | 'all';
            locations?: string[];
            languages?: string[];
        };
        interests?: string[];
        behaviors?: string[];
    };
    budget?: {
        total: number;
        currency: string;
        spent: number;
    };
    startDate: Date;
    endDate?: Date;
    channels: string[];
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
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
export interface IEmailCampaignDocument extends Document {
    _id: mongoose.Types.ObjectId;
    tenantId: string;
    campaignId: mongoose.Types.ObjectId;
    subject: string;
    previewText?: string;
    htmlContent?: string;
    plainContent?: string;
    templateId?: string;
    recipientListId?: string;
    segmentId?: string;
    status: EmailCampaignStatus;
    sentCount?: number;
    deliveredCount?: number;
    openedCount?: number;
    clickedCount?: number;
    bouncedCount?: number;
    unsubscribedCount?: number;
    scheduledFor?: Date;
    sentAt?: Date;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
export interface ISEOOptimizationDocument extends Document {
    _id: mongoose.Types.ObjectId;
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
    originalContent?: string;
    optimizedContent?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
export interface IAdCopyDocument extends Document {
    _id: mongoose.Types.ObjectId;
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
    keywords: string[];
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Content: mongoose.Model<IContentDocument, {}, {}, {}, mongoose.Document<unknown, {}, IContentDocument, {}, {}> & IContentDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export declare const SocialPost: mongoose.Model<ISocialPostDocument, {}, {}, {}, mongoose.Document<unknown, {}, ISocialPostDocument, {}, {}> & ISocialPostDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export declare const Campaign: mongoose.Model<ICampaignDocument, {}, {}, {}, mongoose.Document<unknown, {}, ICampaignDocument, {}, {}> & ICampaignDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export declare const EmailCampaign: mongoose.Model<IEmailCampaignDocument, {}, {}, {}, mongoose.Document<unknown, {}, IEmailCampaignDocument, {}, {}> & IEmailCampaignDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export declare const SEOOptimization: mongoose.Model<ISEOOptimizationDocument, {}, {}, {}, mongoose.Document<unknown, {}, ISEOOptimizationDocument, {}, {}> & ISEOOptimizationDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export declare const AdCopy: mongoose.Model<IAdCopyDocument, {}, {}, {}, mongoose.Document<unknown, {}, IAdCopyDocument, {}, {}> & IAdCopyDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
export type ContentModel = Model<IContentDocument>;
export type SocialPostModel = Model<ISocialPostDocument>;
export type CampaignModel = Model<ICampaignDocument>;
export type EmailCampaignModel = Model<IEmailCampaignDocument>;
export type SEOOptimizationModel = Model<ISEOOptimizationDocument>;
export type AdCopyModel = Model<IAdCopyDocument>;
//# sourceMappingURL=index.d.ts.map