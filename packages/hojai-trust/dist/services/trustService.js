"use strict";
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
exports.trustService = exports.TrustService = exports.BadgeModel = exports.TrustEdgeModel = exports.ReviewModel = exports.VerificationModel = exports.TrustScoreModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const uuid_1 = require("uuid");
const index_js_1 = require("../types/index.js");
const TrustScoreSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    entityType: { type: String, enum: Object.values(index_js_1.EntityType), required: true },
    entityId: { type: String, required: true },
    overallScore: { type: Number, default: 50 },
    reliabilityScore: { type: Number, default: 50 },
    qualityScore: { type: Number, default: 50 },
    responsivenessScore: { type: Number, default: 50 },
    deliveryScore: { type: Number, default: 50 },
    trustLevel: { type: String, enum: Object.values(index_js_1.TrustLevel), default: index_js_1.TrustLevel.UNVERIFIED },
    factors: {
        positiveReviews: { type: Number, default: 0 },
        negativeReviews: { type: Number, default: 0 },
        totalTransactions: { type: Number, default: 0 },
        avgRating: { type: Number, default: 0 },
        responseRate: { type: Number, default: 0 },
        deliveryRate: { type: Number, default: 0 },
        disputeRate: { type: Number, default: 0 },
        verifiedBadges: [String],
        tenure: { type: Number, default: 0 },
        volumeScore: { type: Number, default: 0 }
    },
    scoreHistory: [{
            date: Date,
            score: Number
        }],
    lastUpdated: Date
}, { timestamps: true });
TrustScoreSchema.index({ tenantId: 1, entityType: 1, entityId: 1 }, { unique: true });
TrustScoreSchema.index({ tenantId: 1, trustLevel: 1 });
const VerificationSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    entityType: { type: String, enum: Object.values(index_js_1.EntityType), required: true },
    entityId: { type: String, required: true },
    type: { type: String, required: true },
    status: { type: String, enum: ['pending', 'verified', 'rejected', 'expired'], default: 'pending' },
    level: { type: String, enum: ['basic', 'standard', 'enhanced', 'premium'] },
    provider: String,
    externalId: String,
    verifiedAt: Date,
    expiresAt: Date,
    metadata: { type: Map, of: mongoose_1.Schema.Types.Mixed }
}, { timestamps: true });
VerificationSchema.index({ tenantId: 1, entityId: 1, status: 1 });
const ReviewSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    reviewerId: { type: String, required: true },
    reviewerType: { type: String, enum: Object.values(index_js_1.EntityType), required: true },
    entityId: { type: String, required: true },
    entityType: { type: String, enum: Object.values(index_js_1.EntityType), required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: String,
    content: String,
    categories: { type: Map, of: Number },
    isVerified: { type: Boolean, default: false },
    isAnonymous: { type: Boolean, default: false },
    orderId: String,
    transactionValue: Number,
    helpful: { type: Number, default: 0 },
    unhelpful: { type: Number, default: 0 },
    response: {
        content: String,
        respondedAt: Date,
        respondedBy: String
    },
    status: { type: String, enum: ['published', 'hidden', 'flagged', 'disputed'], default: 'published' }
}, { timestamps: true });
ReviewSchema.index({ tenantId: 1, entityId: 1, status: 1 });
ReviewSchema.index({ tenantId: 1, reviewerId: 1 });
const TrustEdgeSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    sourceType: { type: String, enum: Object.values(index_js_1.EntityType), required: true },
    sourceId: { type: String, required: true },
    targetType: { type: String, enum: Object.values(index_js_1.EntityType), required: true },
    targetId: { type: String, required: true },
    relationship: { type: String, required: true },
    strength: { type: Number, default: 0.5 },
    isVerified: { type: Boolean, default: false },
    verifiedAt: Date,
    lastInteraction: Date,
    interactionCount: { type: Number, default: 0 }
}, { timestamps: true });
TrustEdgeSchema.index({ tenantId: 1, sourceId: 1, targetId: 1 }, { unique: true });
TrustEdgeSchema.index({ tenantId: 1, sourceId: 1, relationship: 1 });
const BadgeSchema = new mongoose_1.Schema({
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: String,
    icon: String,
    color: String,
    criteria: {
        minTransactions: Number,
        minRating: Number,
        minTrustScore: Number,
        requiredVerifications: [String],
        maxDisputeRate: Number
    },
    tier: { type: String, enum: ['bronze', 'silver', 'gold', 'platinum'] },
    active: { type: Boolean, default: true }
}, { timestamps: true });
exports.TrustScoreModel = mongoose_1.default.model('TrustScore', TrustScoreSchema);
exports.VerificationModel = mongoose_1.default.model('Verification', VerificationSchema);
exports.ReviewModel = mongoose_1.default.model('Review', ReviewSchema);
exports.TrustEdgeModel = mongoose_1.default.model('TrustEdge', TrustEdgeSchema);
exports.BadgeModel = mongoose_1.default.model('Badge', BadgeSchema);
class TrustService {
    /**
     * Calculate trust score
     */
    async calculateScore(params) {
        const { tenantId, entityType, entityId } = params;
        // Get factors
        const factors = await this.getFactors(tenantId, entityType, entityId);
        // Calculate scores
        const reliabilityScore = this.calcReliabilityScore(factors);
        const qualityScore = this.calcQualityScore(factors);
        const responsivenessScore = this.calcResponsivenessScore(factors);
        const deliveryScore = this.calcDeliveryScore(factors);
        // Weighted overall
        const overallScore = Math.round(reliabilityScore * 0.3 +
            qualityScore * 0.25 +
            responsivenessScore * 0.2 +
            deliveryScore * 0.25);
        // Determine trust level
        const trustLevel = this.getTrustLevel(overallScore, factors);
        // Get existing score for history
        const existing = await exports.TrustScoreModel.findOne({ tenantId, entityType, entityId });
        const scoreData = {
            tenantId,
            entityType,
            entityId,
            overallScore,
            reliabilityScore,
            qualityScore,
            responsivenessScore,
            deliveryScore,
            trustLevel,
            factors,
            lastUpdated: new Date(),
            scoreHistory: existing?.scoreHistory || []
        };
        // Add to history
        scoreData.scoreHistory.push({ date: new Date(), score: overallScore });
        if (scoreData.scoreHistory.length > 30) {
            scoreData.scoreHistory = scoreData.scoreHistory.slice(-30);
        }
        const score = await exports.TrustScoreModel.findOneAndUpdate({ tenantId, entityType, entityId }, scoreData, { upsert: true, new: true });
        return score.toObject();
    }
    async getFactors(tenantId, entityType, entityId) {
        // Get basic counts
        const [reviews, verifications, edges] = await Promise.all([
            exports.ReviewModel.countDocuments({ tenantId, entityId, status: 'published' }),
            exports.VerificationModel.countDocuments({ tenantId, entityId, status: 'verified' }),
            exports.TrustEdgeModel.countDocuments({ tenantId, targetId: entityId, relationship: 'customer_of' })
        ]);
        // Calculate negative reviews (rating < 3)
        const negativeReviews = await exports.ReviewModel.countDocuments({
            tenantId,
            entityId,
            status: 'published',
            rating: { $lt: 3 }
        });
        // Calculate average rating
        const avgRatingResult = await exports.ReviewModel.aggregate([
            { $match: { tenantId, entityId, status: 'published' } },
            { $group: { _id: null, avg: { $avg: '$rating' } } }
        ]);
        // Calculate response rate from entity's message responsiveness
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const messagesSent = await this.countMessages(tenantId, entityId, thirtyDaysAgo);
        const messagesResponded = await this.countMessagesResponded(tenantId, entityId, thirtyDaysAgo);
        const responseRate = messagesSent > 0 ? Math.round((messagesResponded / messagesSent) * 100) : 80;
        // Calculate delivery rate from transactions
        const deliveredTransactions = await this.countDeliveredTransactions(tenantId, entityId);
        const deliveryRate = edges > 0 ? Math.round((deliveredTransactions / edges) * 100) : 95;
        // Calculate dispute rate from disputes/claims
        const disputes = await this.countDisputes(tenantId, entityId);
        const disputeRate = edges > 0 ? Math.round((disputes / edges) * 100) : 0;
        // Calculate tenure from entity creation
        const entity = await TrustEntityModel.findOne({ tenantId, entityId });
        const tenure = entity?.createdAt
            ? Math.floor((Date.now() - entity.createdAt.getTime()) / (24 * 60 * 60 * 1000))
            : 0;
        return {
            positiveReviews: reviews,
            negativeReviews,
            totalTransactions: edges,
            avgRating: avgRatingResult[0]?.avg || 0,
            responseRate,
            deliveryRate,
            disputeRate,
            verifiedBadges: verifications > 0 ? ['verified'] : [],
            tenure,
            volumeScore: Math.min(edges * 2, 100)
        };
    }
    async countMessages(tenantId, entityId, since) {
        // Count messages sent by entity (implement based on your message model)
        const MessageModel = mongoose_1.default.model('Message') || mongoose_1.default.model('TrustMessage', new mongoose_1.default.Schema({
            tenantId: String,
            senderId: String,
            createdAt: Date
        }));
        return MessageModel.countDocuments({ tenantId, senderId: entityId, createdAt: { $gte: since } });
    }
    async countMessagesResponded(tenantId, entityId, since) {
        // Count messages that received a response
        const MessageModel = mongoose_1.default.model('Message') || mongoose_1.default.model('TrustMessage', new mongoose_1.default.Schema({
            tenantId: String,
            senderId: String,
            respondedAt: Date,
            createdAt: Date
        }));
        return MessageModel.countDocuments({
            tenantId,
            senderId: entityId,
            respondedAt: { $exists: true, $ne: null },
            createdAt: { $gte: since }
        });
    }
    async countDeliveredTransactions(tenantId, entityId) {
        // Count delivered/completed transactions
        const TransactionModel = mongoose_1.default.model('Transaction') || mongoose_1.default.model('TrustTransaction', new mongoose_1.default.Schema({
            tenantId: String,
            entityId: String,
            status: String
        }));
        return TransactionModel.countDocuments({
            tenantId,
            entityId,
            status: { $in: ['delivered', 'completed', 'success'] }
        });
    }
    async countDisputes(tenantId, entityId) {
        // Count disputes/claims
        const DisputeModel = mongoose_1.default.model('Dispute') || mongoose_1.default.model('TrustDispute', new mongoose_1.default.Schema({
            tenantId: String,
            entityId: String,
            status: String
        }));
        return DisputeModel.countDocuments({
            tenantId,
            entityId,
            status: { $in: ['open', 'pending', 'escalated'] }
        });
    }
    calcReliabilityScore(f) {
        const factors = [
            f.tenure > 30 ? 30 : f.tenure,
            f.verifiedBadges.length * 15,
            f.disputeRate < 5 ? 25 : Math.max(0, 25 - f.disputeRate * 5)
        ];
        return Math.min(Math.round(factors.reduce((a, b) => a + b, 0)), 100);
    }
    calcQualityScore(f) {
        const ratingScore = (f.avgRating / 5) * 60;
        const volumeBonus = Math.min(f.volumeScore, 40);
        return Math.round(ratingScore + volumeBonus);
    }
    calcResponsivenessScore(f) {
        return Math.round(f.responseRate);
    }
    calcDeliveryScore(f) {
        return Math.round(f.deliveryRate);
    }
    getTrustLevel(score, factors) {
        if (score >= 90 && factors.verifiedBadges.length >= 2)
            return index_js_1.TrustLevel.ELITE;
        if (score >= 75)
            return index_js_1.TrustLevel.TRUSTED;
        if (score >= 50)
            return index_js_1.TrustLevel.VERIFIED;
        if (score >= 25)
            return index_js_1.TrustLevel.BASIC;
        return index_js_1.TrustLevel.UNVERIFIED;
    }
    /**
     * Get trust score
     */
    async getScore(params) {
        const score = await exports.TrustScoreModel.findOne(params);
        return score ? score.toObject() : null;
    }
    /**
     * Create review
     */
    async createReview(review) {
        const doc = await exports.ReviewModel.create({ ...review, id: (0, uuid_1.v4)() });
        // Recalculate trust score
        await this.calculateScore({
            tenantId: review.tenantId,
            entityType: review.entityType,
            entityId: review.entityId
        });
        return doc.toObject();
    }
    /**
     * Get reviews
     */
    async getReviews(params) {
        const reviews = await exports.ReviewModel.find({
            tenantId: params.tenantId,
            entityId: params.entityId,
            status: 'published'
        }).sort({ createdAt: -1 }).limit(params.limit || 20);
        return reviews.map(r => r.toObject());
    }
    /**
     * Add verification
     */
    async addVerification(verification) {
        const doc = await exports.VerificationModel.create({ ...verification, id: (0, uuid_1.v4)() });
        // Recalculate trust score
        await this.calculateScore({
            tenantId: verification.tenantId,
            entityType: verification.entityType,
            entityId: verification.entityId
        });
        return doc.toObject();
    }
    /**
     * Get trust graph connections
     */
    async getConnections(params) {
        const edges = await exports.TrustEdgeModel.find({
            tenantId: params.tenantId,
            sourceId: params.entityId,
            ...(params.relationship ? { relationship: params.relationship } : {})
        });
        return edges.map(e => e.toObject());
    }
    /**
     * Add trust edge
     */
    async addEdge(edge) {
        const doc = await exports.TrustEdgeModel.findOneAndUpdate({ tenantId: edge.tenantId, sourceId: edge.sourceId, targetId: edge.targetId }, { ...edge, id: (0, uuid_1.v4)() }, { upsert: true, new: true });
        return doc.toObject();
    }
    /**
     * Get top merchants by trust
     */
    async getTopMerchants(tenantId, limit = 10) {
        const scores = await exports.TrustScoreModel.find({
            tenantId,
            entityType: index_js_1.EntityType.MERCHANT,
            trustLevel: { $in: [index_js_1.TrustLevel.TRUSTED, index_js_1.TrustLevel.ELITE] }
        }).sort({ overallScore: -1 }).limit(limit);
        return scores.map(s => s.toObject());
    }
}
exports.TrustService = TrustService;
exports.trustService = new TrustService();
