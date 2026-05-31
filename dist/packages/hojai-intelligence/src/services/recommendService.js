import { v4 as uuid } from 'uuid';
import { RecommendationType } from '../types/index.js';
import { RecommendationModel } from '../models/recommendModel.js';
// ============================================================================
// RECOMMENDATION SERVICE
// ============================================================================
export class RecommendService {
    /**
     * Get personalized recommendations for a user
     */
    async getRecommendations(params) {
        const { tenantId, userId, type, limit = 10, context } = params;
        // Build query
        const query = {
            tenantId,
            userId,
            validUntil: { $gt: new Date() }
        };
        if (type) {
            query.type = type;
        }
        const recommendations = await RecommendationModel.find(query)
            .sort({ score: -1 })
            .limit(limit);
        return recommendations.map(r => r.toObject());
    }
    /**
     * Get similar items to a given product
     */
    async getSimilarItems(params) {
        const { tenantId, userId, productId, limit = 5 } = params;
        // Find similar products based on category, tags, etc.
        // In production, this would use vector similarity
        const recommendations = await RecommendationModel.find({
            tenantId,
            userId,
            type: RecommendationType.PRODUCT,
            category: 'similar',
            'context.sourceEntityId': productId,
            validUntil: { $gt: new Date() }
        })
            .sort({ score: -1 })
            .limit(limit);
        return recommendations.map(r => r.toObject());
    }
    /**
     * Get frequently bought together items
     */
    async getFrequentlyBoughtTogether(params) {
        const { tenantId, userId, productIds, limit = 5 } = params;
        const recommendations = await RecommendationModel.find({
            tenantId,
            userId,
            type: RecommendationType.PRODUCT,
            category: 'frequently_bought',
            'context.sourceEntityId': { $in: productIds },
            validUntil: { $gt: new Date() }
        })
            .sort({ score: -1 })
            .limit(limit);
        return recommendations.map(r => r.toObject());
    }
    /**
     * Get trending items
     */
    async getTrending(params) {
        const { tenantId, userId, category, limit = 10 } = params;
        const query = {
            tenantId,
            userId,
            type: RecommendationType.PRODUCT,
            category: 'trending',
            validUntil: { $gt: new Date() }
        };
        if (category) {
            query['metadata.category'] = category;
        }
        const recommendations = await RecommendationModel.find(query)
            .sort({ score: -1 })
            .limit(limit);
        return recommendations.map(r => r.toObject());
    }
    /**
     * Get personalized offers
     */
    async getOffers(params) {
        const { tenantId, userId, limit = 5 } = params;
        const recommendations = await RecommendationModel.find({
            tenantId,
            userId,
            type: RecommendationType.OFFER,
            validUntil: { $gt: new Date() }
        })
            .sort({ score: -1 })
            .limit(limit);
        return recommendations.map(r => r.toObject());
    }
    /**
     * Get next best actions
     */
    async getNextBestActions(params) {
        const { tenantId, userId, context } = params;
        const recommendations = await RecommendationModel.find({
            tenantId,
            userId,
            type: RecommendationType.NEXT_BEST_ACTION,
            validUntil: { $gt: new Date() }
        })
            .sort({ score: -1 })
            .limit(5);
        return recommendations.map(r => r.toObject());
    }
    /**
     * Track recommendation impression
     */
    async trackImpression(params) {
        await RecommendationModel.findByIdAndUpdate(params.recommendationId, { $inc: { impressions: 1 } });
    }
    /**
     * Track recommendation click
     */
    async trackClick(params) {
        await RecommendationModel.findByIdAndUpdate(params.recommendationId, { $inc: { clicks: 1 } });
    }
    /**
     * Track recommendation conversion
     */
    async trackConversion(params) {
        await RecommendationModel.findByIdAndUpdate(params.recommendationId, { $inc: { conversions: 1 } });
    }
    /**
     * Create a recommendation
     */
    async createRecommendation(params) {
        const recommendation = {
            id: uuid(),
            tenantId: params.tenantId,
            userId: params.userId,
            type: params.type,
            category: params.category,
            title: params.title,
            description: params.description,
            entityType: params.entityType,
            entityId: params.entityId,
            score: params.score,
            confidence: params.confidence || params.score,
            reason: params.reason,
            context: params.context,
            display: params.display,
            metadata: params.metadata,
            validUntil: params.validUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            impressions: 0,
            clicks: 0,
            conversions: 0,
            createdAt: new Date()
        };
        await RecommendationModel.create(recommendation);
        return recommendation;
    }
    /**
     * Get recommendation performance stats
     */
    async getPerformanceStats(params) {
        const { tenantId, startDate, endDate } = params;
        const stats = await RecommendationModel.aggregate([
            {
                $match: {
                    tenantId,
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalImpressions: { $sum: '$impressions' },
                    totalClicks: { $sum: '$clicks' },
                    totalConversions: { $sum: '$conversions' }
                }
            }
        ]);
        const topPerforming = await RecommendationModel.find({
            tenantId,
            createdAt: { $gte: startDate, $lte: endDate }
        })
            .sort({ conversions: -1 })
            .limit(10);
        const result = stats[0] || { totalImpressions: 0, totalClicks: 0, totalConversions: 0 };
        return {
            totalImpressions: result.totalImpressions,
            totalClicks: result.totalClicks,
            totalConversions: result.totalConversions,
            clickThroughRate: result.totalImpressions > 0
                ? result.totalClicks / result.totalImpressions
                : 0,
            conversionRate: result.totalClicks > 0
                ? result.totalConversions / result.totalClicks
                : 0,
            topPerforming: topPerforming.map(r => r.toObject())
        };
    }
}
export const recommendService = new RecommendService();
//# sourceMappingURL=recommendService.js.map