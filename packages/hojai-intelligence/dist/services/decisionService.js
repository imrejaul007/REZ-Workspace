"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decisionService = exports.DecisionService = void 0;
const uuid_1 = require("uuid");
const index_js_1 = require("../types/index.js");
const decisionModel_js_1 = require("../models/decisionModel.js");
// ============================================================================
// DECISION SERVICE
// ============================================================================
class DecisionService {
    /**
     * Decide cashback amount for a transaction
     */
    async decideCashback(params) {
        const { tenantId, userId, amount, context } = params;
        // In production, this would use ML model
        // For now, use rule-based logic
        let cashbackPercent = 5; // Base 5%
        // Higher for larger orders
        if (amount > 5000)
            cashbackPercent = 8;
        else if (amount > 2000)
            cashbackPercent = 7;
        else if (amount > 1000)
            cashbackPercent = 6;
        const cashbackValue = (amount * cashbackPercent) / 100;
        const decision = {
            id: (0, uuid_1.v4)(),
            tenantId,
            userId,
            type: index_js_1.DecisionType.CASHBACK,
            action: 'approve_cashback',
            value: cashbackPercent,
            reason: `Standard cashback of ${cashbackPercent}% for orders above ₹${amount}`,
            factors: [
                { name: 'order_amount', weight: 0.4, value: amount },
                { name: 'base_cashback', weight: 0.3, value: 5 },
                { name: 'user_tier', weight: 0.2, value: 'regular' },
                { name: 'channel', weight: 0.1, value: context?.channel || 'app' }
            ],
            model: 'cashback-v1',
            context: {
                requestId: (0, uuid_1.v4)(),
                sessionId: context?.sessionId,
                channel: context?.channel,
                amount
            },
            risk: index_js_1.PredictionRisk.LOW,
            status: 'approved',
            createdAt: new Date()
        };
        await decisionModel_js_1.DecisionModel.create(decision);
        return decision;
    }
    /**
     * Decide offer eligibility
     */
    async decideOffer(params) {
        const { tenantId, userId, offerId } = params;
        // Simplified eligibility check
        const eligible = true;
        const score = 0.85;
        const decision = {
            id: (0, uuid_1.v4)(),
            tenantId,
            userId,
            type: index_js_1.DecisionType.OFFER,
            action: eligible ? 'approve_offer' : 'reject_offer',
            value: score,
            reason: eligible
                ? 'User meets eligibility criteria for this offer'
                : 'User does not meet offer eligibility requirements',
            factors: [
                { name: 'eligibility_score', weight: 0.5, value: score },
                { name: 'user_segment', weight: 0.3, value: 'active' },
                { name: 'offer_type', weight: 0.2, value: 'standard' }
            ],
            model: 'offer-eligibility-v1',
            context: {
                requestId: (0, uuid_1.v4)(),
                channel: 'app'
            },
            risk: index_js_1.PredictionRisk.LOW,
            status: eligible ? 'approved' : 'rejected',
            createdAt: new Date()
        };
        await decisionModel_js_1.DecisionModel.create(decision);
        return decision;
    }
    /**
     * Decide targeting for a campaign
     */
    async decideTargeting(params) {
        const { tenantId, campaignId, userId } = params;
        const targetingScore = 0.78;
        const segments = ['active', 'high_value', 'frequent_buyer'];
        const decision = {
            id: (0, uuid_1.v4)(),
            tenantId,
            userId,
            type: index_js_1.DecisionType.TARGETING,
            action: targetingScore > 0.5 ? 'include' : 'exclude',
            value: targetingScore,
            reason: `User matches ${segments.length} target segments`,
            factors: segments.map((segment, i) => ({
                name: segment,
                weight: 0.33,
                value: true
            })),
            model: 'targeting-v1',
            context: {
                requestId: (0, uuid_1.v4)(),
                campaignId
            },
            risk: index_js_1.PredictionRisk.LOW,
            status: 'approved',
            createdAt: new Date()
        };
        await decisionModel_js_1.DecisionModel.create(decision);
        return decision;
    }
    /**
     * Decide fraud risk
     */
    async decideFraud(params) {
        const { tenantId, userId, transactionData } = params;
        const { amount, velocity, riskSignals } = transactionData;
        // Calculate fraud score
        let fraudScore = 0.1; // Base 10%
        if (velocity > 5)
            fraudScore += 0.2;
        if (riskSignals.length > 2)
            fraudScore += 0.3;
        if (amount > 50000)
            fraudScore += 0.2;
        const risk = fraudScore > 0.7 ? index_js_1.PredictionRisk.HIGH :
            fraudScore > 0.4 ? index_js_1.PredictionRisk.MEDIUM :
                index_js_1.PredictionRisk.LOW;
        const decision = {
            id: (0, uuid_1.v4)(),
            tenantId,
            userId,
            type: index_js_1.DecisionType.FRAUD,
            action: fraudScore > 0.7 ? 'block' : fraudScore > 0.4 ? 'review' : 'approve',
            value: fraudScore,
            reason: fraudScore > 0.7
                ? 'High fraud risk detected - blocking transaction'
                : fraudScore > 0.4
                    ? 'Moderate fraud risk - requires manual review'
                    : 'Low fraud risk - transaction approved',
            factors: [
                { name: 'transaction_velocity', weight: 0.3, value: velocity },
                { name: 'amount', weight: 0.25, value: amount },
                { name: 'risk_signals', weight: 0.3, value: riskSignals.length },
                { name: 'historical_fraud', weight: 0.15, value: 0 }
            ],
            model: 'fraud-v1',
            context: {
                requestId: (0, uuid_1.v4)(),
                amount
            },
            risk,
            fraudScore,
            status: risk === index_js_1.PredictionRisk.HIGH ? 'rejected' :
                risk === index_js_1.PredictionRisk.MEDIUM ? 'manual_review' : 'approved',
            createdAt: new Date()
        };
        await decisionModel_js_1.DecisionModel.create(decision);
        return decision;
    }
    /**
     * Get decision by ID
     */
    async getDecision(tenantId, decisionId) {
        const decision = await decisionModel_js_1.DecisionModel.findOne({ _id: decisionId, tenantId });
        return decision ? decision.toObject() : null;
    }
    /**
     * Get decisions for a user
     */
    async getUserDecisions(params) {
        const { tenantId, userId, type, limit = 50, offset = 0 } = params;
        const query = { tenantId, userId };
        if (type)
            query.type = type;
        const [decisions, total] = await Promise.all([
            decisionModel_js_1.DecisionModel.find(query)
                .sort({ createdAt: -1 })
                .skip(offset)
                .limit(limit),
            decisionModel_js_1.DecisionModel.countDocuments(query)
        ]);
        return {
            decisions: decisions.map(d => d.toObject()),
            total
        };
    }
    /**
     * Approve/reject a decision (manual review)
     */
    async reviewDecision(params) {
        const { tenantId, decisionId, action, reviewerId } = params;
        const decision = await decisionModel_js_1.DecisionModel.findOneAndUpdate({ _id: decisionId, tenantId, status: 'manual_review' }, {
            $set: {
                status: action === 'approve' ? 'approved' : 'rejected',
                reviewedBy: reviewerId,
                reviewedAt: new Date()
            }
        }, { new: true });
        return decision ? decision.toObject() : null;
    }
    /**
     * Get pending manual reviews
     */
    async getPendingReviews(tenantId, limit = 50) {
        const decisions = await decisionModel_js_1.DecisionModel.find({
            tenantId,
            status: 'manual_review'
        })
            .sort({ createdAt: 1 })
            .limit(limit);
        return decisions.map(d => d.toObject());
    }
}
exports.DecisionService = DecisionService;
exports.decisionService = new DecisionService();
//# sourceMappingURL=decisionService.js.map