"use strict";
// ============================================
// HOJAI AI - Campaign Manager Service
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.campaignManager = exports.CampaignManagerService = void 0;
const models_1 = require("../models");
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
class CampaignManagerService {
    config;
    constructor(config) {
        this.config = {
            autoOptimize: config?.autoOptimize ?? false,
            defaultBudget: config?.defaultBudget || 1000,
            defaultCurrency: config?.defaultCurrency || 'USD'
        };
    }
    /**
     * Create a new campaign
     */
    async createCampaign(tenantId, userId, params) {
        logger_1.logger.info('Creating campaign', { tenantId, name: params.name });
        const doc = await models_1.Campaign.create({
            tenantId,
            name: params.name,
            type: params.type,
            objective: params.objective,
            description: params.description || '',
            targetAudience: params.targetAudience || {},
            budget: {
                total: params.budget?.total || this.config.defaultBudget,
                currency: params.budget?.currency || this.config.defaultCurrency,
                spent: 0
            },
            startDate: new Date(params.startDate),
            endDate: params.endDate ? new Date(params.endDate) : undefined,
            channels: params.channels || [],
            status: types_1.CampaignStatus.DRAFT,
            createdBy: userId
        });
        logger_1.logger.info('Campaign created', { tenantId, campaignId: doc._id });
        return this.mapToICampaign(doc);
    }
    /**
     * Get campaign by ID
     */
    async getCampaign(tenantId, campaignId) {
        const doc = await models_1.Campaign.findOne({ _id: campaignId, tenantId });
        if (!doc)
            return null;
        return this.mapToICampaign(doc);
    }
    /**
     * List campaigns with filters
     */
    async listCampaigns(tenantId, filters) {
        const query = { tenantId };
        if (filters.status)
            query.status = filters.status;
        if (filters.type)
            query.type = filters.type;
        if (filters.objective)
            query.objective = filters.objective;
        const [docs, total] = await Promise.all([
            models_1.Campaign.find(query)
                .sort({ createdAt: -1 })
                .skip(filters.offset || 0)
                .limit(filters.limit || 20)
                .lean(),
            models_1.Campaign.countDocuments(query)
        ]);
        return {
            items: docs.map(doc => this.mapToICampaign(doc)),
            total
        };
    }
    /**
     * Launch a campaign
     */
    async launchCampaign(tenantId, campaignId, immediate = true, startDate) {
        logger_1.logger.info('Launching campaign', { tenantId, campaignId, immediate });
        const doc = await models_1.Campaign.findOne({ _id: campaignId, tenantId });
        if (!doc) {
            return { success: false, error: 'Campaign not found' };
        }
        if (doc.status === types_1.CampaignStatus.LAUNCHED) {
            return { success: false, error: 'Campaign already launched' };
        }
        if (doc.status === types_1.CampaignStatus.COMPLETED) {
            return { success: false, error: 'Campaign has been completed' };
        }
        if (doc.status === types_1.CampaignStatus.CANCELLED) {
            return { success: false, error: 'Campaign has been cancelled' };
        }
        // Validate campaign is ready
        const validation = this.validateCampaign(doc);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }
        // Update campaign status
        const launchDate = immediate
            ? new Date()
            : (startDate ? new Date(startDate) : new Date());
        doc.status = types_1.CampaignStatus.LAUNCHED;
        doc.launchedAt = launchDate;
        await doc.save();
        // Create email campaign if email is a channel
        if (doc.channels.includes('email')) {
            await this.createEmailCampaign(tenantId, campaignId);
        }
        logger_1.logger.info('Campaign launched', { tenantId, campaignId, launchedAt: launchDate });
        return { success: true, campaign: this.mapToICampaign(doc) };
    }
    /**
     * Pause a campaign
     */
    async pauseCampaign(tenantId, campaignId) {
        const doc = await models_1.Campaign.findOneAndUpdate({ _id: campaignId, tenantId, status: types_1.CampaignStatus.LAUNCHED }, { status: types_1.CampaignStatus.PAUSED }, { new: true });
        if (!doc)
            return null;
        logger_1.logger.info('Campaign paused', { tenantId, campaignId });
        return this.mapToICampaign(doc);
    }
    /**
     * Resume a paused campaign
     */
    async resumeCampaign(tenantId, campaignId) {
        const doc = await models_1.Campaign.findOneAndUpdate({ _id: campaignId, tenantId, status: types_1.CampaignStatus.PAUSED }, { status: types_1.CampaignStatus.LAUNCHED }, { new: true });
        if (!doc)
            return null;
        logger_1.logger.info('Campaign resumed', { tenantId, campaignId });
        return this.mapToICampaign(doc);
    }
    /**
     * Complete a campaign
     */
    async completeCampaign(tenantId, campaignId) {
        const doc = await models_1.Campaign.findOneAndUpdate({ _id: campaignId, tenantId, status: types_1.CampaignStatus.LAUNCHED }, {
            status: types_1.CampaignStatus.COMPLETED,
            completedAt: new Date()
        }, { new: true });
        if (!doc)
            return null;
        logger_1.logger.info('Campaign completed', { tenantId, campaignId });
        return this.mapToICampaign(doc);
    }
    /**
     * Cancel a campaign
     */
    async cancelCampaign(tenantId, campaignId) {
        const doc = await models_1.Campaign.findOneAndUpdate({ _id: campaignId, tenantId }, { status: types_1.CampaignStatus.CANCELLED }, { new: true });
        if (!doc)
            return null;
        logger_1.logger.info('Campaign cancelled', { tenantId, campaignId });
        return this.mapToICampaign(doc);
    }
    /**
     * Update campaign
     */
    async updateCampaign(tenantId, campaignId, updates) {
        const updateObj = {};
        if (updates.name)
            updateObj.name = updates.name;
        if (updates.description)
            updateObj.description = updates.description;
        if (updates.budget)
            updateObj.budget = updates.budget;
        if (updates.endDate)
            updateObj.endDate = new Date(updates.endDate);
        if (updates.targetAudience)
            updateObj.targetAudience = updates.targetAudience;
        const doc = await models_1.Campaign.findOneAndUpdate({ _id: campaignId, tenantId, status: types_1.CampaignStatus.DRAFT }, updateObj, { new: true });
        if (!doc)
            return null;
        return this.mapToICampaign(doc);
    }
    /**
     * Update campaign metrics
     */
    async updateMetrics(tenantId, campaignId, metrics) {
        const doc = await models_1.Campaign.findOne({ _id: campaignId, tenantId });
        if (!doc)
            return null;
        // Initialize metrics object if needed
        if (!doc.metrics) {
            doc.metrics = {
                impressions: 0,
                clicks: 0,
                conversions: 0,
                revenue: 0,
                ctr: 0,
                cpc: 0,
                roas: 0
            };
        }
        if (metrics.impressions !== undefined) {
            doc.metrics.impressions = metrics.impressions;
        }
        if (metrics.clicks !== undefined) {
            doc.metrics.clicks = metrics.clicks;
            if (doc.metrics.impressions && doc.metrics.impressions > 0) {
                doc.metrics.ctr = (metrics.clicks / doc.metrics.impressions) * 100;
            }
        }
        if (metrics.conversions !== undefined) {
            doc.metrics.conversions = metrics.conversions;
        }
        if (metrics.revenue !== undefined) {
            doc.metrics.revenue = metrics.revenue;
            if (doc.budget?.total && doc.budget.total > 0) {
                doc.metrics.roas = metrics.revenue / doc.budget.total;
            }
        }
        await doc.save();
        return this.mapToICampaign(doc);
    }
    /**
     * Get campaign performance summary
     */
    async getCampaignSummary(tenantId, campaignId) {
        const campaign = await this.getCampaign(tenantId, campaignId);
        if (!campaign)
            return null;
        const result = { campaign };
        // Get email campaign stats if email is a channel
        if (campaign.channels?.includes('email')) {
            const emailCampaigns = await models_1.EmailCampaign.find({
                tenantId,
                campaignId: campaignId
            }).lean();
            if (emailCampaigns.length > 0) {
                const sent = emailCampaigns.reduce((sum, ec) => sum + (ec.sentCount || 0), 0);
                const delivered = emailCampaigns.reduce((sum, ec) => sum + (ec.deliveredCount || 0), 0);
                const opened = emailCampaigns.reduce((sum, ec) => sum + (ec.openedCount || 0), 0);
                const clicked = emailCampaigns.reduce((sum, ec) => sum + (ec.clickedCount || 0), 0);
                const bounced = emailCampaigns.reduce((sum, ec) => sum + (ec.bouncedCount || 0), 0);
                result.emailStats = {
                    sent,
                    delivered,
                    opened,
                    clicked,
                    bounced,
                    openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
                    clickRate: delivered > 0 ? (clicked / delivered) * 100 : 0
                };
            }
        }
        // Get social stats if social is a channel
        if (campaign.channels?.includes('social')) {
            const socialPosts = await models_1.SocialPost.find({ tenantId }).lean();
            const campaignPosts = socialPosts.filter(p => p.campaignId?.toString() === campaignId);
            if (campaignPosts.length > 0) {
                const publishedPosts = campaignPosts.filter(p => p.status === 'published');
                const scheduledPosts = campaignPosts.filter(p => p.status === 'scheduled');
                const totalImpressions = publishedPosts.reduce((sum, p) => sum + (p.engagement?.impressions || 0), 0);
                const totalEngagement = publishedPosts.reduce((sum, p) => sum +
                    (p.engagement?.likes || 0) +
                    (p.engagement?.comments || 0) +
                    (p.engagement?.shares || 0), 0);
                result.socialStats = {
                    posts: campaignPosts.length,
                    scheduled: scheduledPosts.length,
                    published: publishedPosts.length,
                    totalImpressions,
                    avgEngagement: publishedPosts.length > 0
                        ? totalEngagement / publishedPosts.length
                        : 0
                };
            }
        }
        return result;
    }
    /**
     * Create email campaign
     */
    async createEmailCampaign(tenantId, campaignId) {
        const emailCampaign = await models_1.EmailCampaign.create({
            tenantId,
            campaignId,
            subject: 'Your email subject here',
            status: types_1.EmailCampaignStatus.DRAFT
        });
        return emailCampaign;
    }
    /**
     * Validate campaign is ready for launch
     */
    validateCampaign(doc) {
        if (!doc.name || doc.name.trim().length === 0) {
            return { valid: false, error: 'Campaign name is required' };
        }
        if (!doc.type) {
            return { valid: false, error: 'Campaign type is required' };
        }
        if (!doc.objective) {
            return { valid: false, error: 'Campaign objective is required' };
        }
        return { valid: true };
    }
    /**
     * Map document to interface
     */
    mapToICampaign(doc) {
        return {
            id: doc._id?.toString() || '',
            tenantId: doc.tenantId || '',
            name: doc.name || '',
            type: doc.type || types_1.CampaignType.CONTENT,
            objective: doc.objective || types_1.CampaignObjective.ENGAGEMENT,
            description: doc.description || '',
            targetAudience: doc.targetAudience || {},
            budget: doc.budget || { total: 0, currency: 'USD', spent: 0 },
            startDate: doc.startDate || new Date(),
            endDate: doc.endDate,
            channels: doc.channels || [],
            status: doc.status || types_1.CampaignStatus.DRAFT,
            metrics: doc.metrics || { impressions: 0, clicks: 0, conversions: 0, revenue: 0, ctr: 0, cpc: 0, roas: 0 },
            createdBy: doc.createdBy || '',
            launchedAt: doc.launchedAt,
            completedAt: doc.completedAt,
            createdAt: doc.createdAt || new Date(),
            updatedAt: doc.updatedAt || new Date()
        };
    }
}
exports.CampaignManagerService = CampaignManagerService;
// Export singleton instance
exports.campaignManager = new CampaignManagerService();
//# sourceMappingURL=campaignManager.js.map