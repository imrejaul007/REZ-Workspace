"use strict";
// ============================================
// HOJAI AI - SDR Agent Qualifier Service
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.qualifierService = exports.QualifierService = void 0;
const models_1 = require("../models");
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
class QualifierService {
    config;
    constructor(config) {
        this.config = {
            scoringWeights: config?.scoringWeights || {
                budget: 25,
                authority: 25,
                need: 30,
                timeline: 20
            },
            minQualifiedScore: config?.minQualifiedScore || 60,
            disqualifyConditions: config?.disqualifyConditions || {
                noBudget: true,
                noAuthority: true,
                noNeed: true,
                noTimeline: true
            }
        };
    }
    /**
     * Qualify a lead using BANT framework
     */
    async qualifyLead(tenantId, leadId, qualification, ownerId, notes) {
        logger_1.logger.info('Qualifying lead', { tenantId, leadId });
        // Get lead
        const lead = await models_1.Lead.findOne({ _id: leadId, tenantId });
        if (!lead) {
            throw new Error('Lead not found');
        }
        // Calculate score
        const { score, disqualifyReason, breakdown } = this.calculateScore(qualification);
        const isQualified = score >= this.config.minQualifiedScore;
        const isDisqualified = this.shouldDisqualify(qualification);
        // Update or create qualification record
        const qualificationRecord = await models_1.Qualification.findOneAndUpdate({ leadId: lead._id, tenantId }, {
            tenantId,
            leadId: lead._id,
            status: isDisqualified
                ? types_1.QualificationStatus.DISQUALIFIED
                : isQualified
                    ? types_1.QualificationStatus.QUALIFIED
                    : types_1.QualificationStatus.IN_PROGRESS,
            bant: qualification,
            notes: notes || '',
            disqualifyReason: isDisqualified ? disqualifyReason : undefined
        }, { upsert: true, new: true });
        // Update lead
        const newStage = isDisqualified
            ? types_1.LeadStage.CLOSED_LOST
            : isQualified
                ? types_1.LeadStage.QUALIFIED
                : lead.stage;
        const newScore = isDisqualified
            ? types_1.LeadScore.UNQUALIFIED
            : score >= 80
                ? types_1.LeadScore.HOT
                : score >= 50
                    ? types_1.LeadScore.WARM
                    : types_1.LeadScore.COLD;
        await models_1.Lead.findByIdAndUpdate(lead._id, {
            stage: newStage,
            score: newScore,
            scoreValue: score,
            assignedTo: isQualified ? lead.assignedTo : null
        });
        // Log activity
        await models_1.Activity.create({
            tenantId,
            leadId: lead._id,
            type: 'stage_change',
            description: isDisqualified
                ? `Disqualified: ${disqualifyReason}`
                : isQualified
                    ? 'Qualified successfully'
                    : 'Qualification in progress',
            metadata: { score, breakdown, qualification },
            createdBy: ownerId
        });
        const updatedLead = await models_1.Lead.findById(lead._id);
        logger_1.logger.info('Lead qualified', {
            tenantId,
            leadId,
            score,
            qualified: isQualified,
            disqualified: isDisqualified
        });
        return {
            success: true,
            qualification: this.mapToIQualification(qualificationRecord),
            lead: this.mapToILead(updatedLead),
            disqualified: isDisqualified,
            disqualifyReason
        };
    }
    /**
     * Get qualification status for a lead
     */
    async getQualification(tenantId, leadId) {
        const qualification = await models_1.Qualification.findOne({
            leadId,
            tenantId
        }).populate('leadId');
        return qualification ? this.mapToIQualification(qualification) : null;
    }
    /**
     * Calculate qualification score using BANT
     */
    calculateScore(qualification) {
        const breakdown = {};
        // Budget Score (0-100)
        let budgetScore = 0;
        if (qualification.budget.hasBudget) {
            if (qualification.budget.amount && qualification.budget.amount > 10000) {
                budgetScore = 100;
            }
            else if (qualification.budget.amount && qualification.budget.amount > 5000) {
                budgetScore = 75;
            }
            else if (qualification.budget.amount && qualification.budget.amount > 1000) {
                budgetScore = 50;
            }
            else {
                budgetScore = 25;
            }
        }
        breakdown.budget = Math.round(budgetScore * (this.config.scoringWeights.budget / 100));
        // Authority Score (0-100)
        let authorityScore = 0;
        if (qualification.authority.isDecisionMaker) {
            switch (qualification.authority.level) {
                case 'cxo':
                    authorityScore = 100;
                    break;
                case 'vp':
                    authorityScore = 85;
                    break;
                case 'director':
                    authorityScore = 70;
                    break;
                case 'manager':
                    authorityScore = 50;
                    break;
                default:
                    authorityScore = 25;
            }
        }
        breakdown.authority = Math.round(authorityScore * (this.config.scoringWeights.authority / 100));
        // Need Score (0-100)
        let needScore = 0;
        const painPointsCount = qualification.need.painPoints.length;
        needScore = Math.min(painPointsCount * 20, 100);
        // Priority multiplier
        switch (qualification.need.priority) {
            case 'critical':
                needScore = Math.max(needScore, 90);
                break;
            case 'high':
                needScore = Math.max(needScore, 70);
                break;
            case 'medium':
                needScore = Math.max(needScore, 50);
                break;
            default:
                needScore = Math.max(needScore, 20);
        }
        breakdown.need = Math.round(needScore * (this.config.scoringWeights.need / 100));
        // Timeline Score (0-100)
        let timelineScore = 0;
        if (qualification.timeline.buyingStage === 'decision') {
            timelineScore = 100;
        }
        else if (qualification.timeline.buyingStage === 'consideration') {
            timelineScore = 60;
        }
        else if (qualification.timeline.buyingStage === 'awareness') {
            timelineScore = 30;
        }
        // Urgency multiplier
        switch (qualification.timeline.urgency) {
            case 'high':
                timelineScore = Math.min(timelineScore * 1.3, 100);
                break;
            case 'medium':
                timelineScore = timelineScore * 1;
                break;
            default:
                timelineScore = timelineScore * 0.7;
        }
        breakdown.timeline = Math.round(timelineScore * (this.config.scoringWeights.timeline / 100));
        const totalScore = breakdown.budget + breakdown.authority + breakdown.need + breakdown.timeline;
        return {
            score: Math.min(Math.round(totalScore), 100),
            breakdown
        };
    }
    /**
     * Check if lead should be disqualified
     */
    shouldDisqualify(qualification) {
        const reasons = [];
        if (this.config.disqualifyConditions.noBudget && !qualification.budget.hasBudget) {
            reasons.push('No budget');
        }
        if (this.config.disqualifyConditions.noAuthority) {
            if (qualification.authority.level === 'unknown' && !qualification.authority.isDecisionMaker) {
                reasons.push('No authority contact');
            }
        }
        if (this.config.disqualifyConditions.noNeed && qualification.need.painPoints.length === 0) {
            reasons.push('No identified needs');
        }
        if (this.config.disqualifyConditions.noTimeline && qualification.timeline.buyingStage === 'none') {
            reasons.push('No timeline for purchase');
        }
        return reasons.length > 0;
    }
    /**
     * Auto-score a lead based on contact/company data
     */
    async autoScore(tenantId, contactId) {
        const contact = await models_1.Contact.findOne({ _id: contactId, tenantId });
        if (!contact) {
            throw new Error('Contact not found');
        }
        const company = contact.companyId
            ? await models_1.Company.findById(contact.companyId)
            : null;
        const breakdown = {
            companyFit: 0,
            roleFit: 0,
            engagementFit: 0,
            intentFit: 0
        };
        const recommendations = [];
        // Company Fit Scoring
        const targetIndustries = ['SaaS', 'Technology', 'Fintech', 'E-commerce', 'Healthcare'];
        if (contact.industry && targetIndustries.includes(contact.industry)) {
            breakdown.companyFit += 30;
        }
        const targetSizes = ['51-200', '201-500', '501-1000'];
        if (contact.companySize && targetSizes.includes(contact.companySize)) {
            breakdown.companyFit += 20;
        }
        // Role Fit Scoring
        const targetTitles = ['CEO', 'CTO', 'VP', 'Director', 'Head', 'Chief'];
        if (contact.title && targetTitles.some(t => contact.title.includes(t))) {
            breakdown.roleFit += 40;
        }
        // LinkedIn presence indicates higher engagement likelihood
        if (contact.linkedinUrl) {
            breakdown.roleFit += 10;
        }
        // Engagement Fit (placeholder for actual engagement data)
        const metadata = contact.metadata;
        if (metadata?.emailOpens) {
            breakdown.engagementFit = Math.min(metadata.emailOpens * 5, 25);
        }
        if (metadata?.websiteVisits) {
            breakdown.engagementFit += Math.min(metadata.websiteVisits * 3, 25);
        }
        // Intent Fit (placeholder for intent data)
        if (metadata?.searches) {
            breakdown.intentFit = Math.min(metadata.searches * 2, 20);
        }
        if (metadata?.pricingPageViews) {
            breakdown.intentFit += 10;
        }
        if (metadata?.demoRequested) {
            breakdown.intentFit += 20;
        }
        const totalScore = breakdown.companyFit +
            breakdown.roleFit +
            breakdown.engagementFit +
            breakdown.intentFit;
        // Generate recommendations
        if (breakdown.companyFit < 40) {
            recommendations.push('Consider if this company matches your ICP');
        }
        if (breakdown.roleFit < 30) {
            recommendations.push('Target may not have decision-making authority');
        }
        if (breakdown.engagementFit < 20) {
            recommendations.push('Increase engagement before outreach');
        }
        if (breakdown.intentFit < 30) {
            recommendations.push('Lead may need more nurturing');
        }
        return {
            score: Math.min(totalScore, 100),
            scoreBreakdown: breakdown,
            recommendations
        };
    }
    /**
     * Map MongoDB document to IQualification
     */
    mapToIQualification(doc) {
        const obj = doc.toObject();
        return {
            id: obj._id.toString(),
            tenantId: obj.tenantId,
            leadId: obj.leadId.toString(),
            status: obj.status,
            bant: obj.bant,
            notes: obj.notes,
            disqualifyReason: obj.disqualifyReason,
            createdAt: obj.createdAt,
            updatedAt: obj.updatedAt
        };
    }
    /**
     * Map MongoDB document to ILead
     */
    mapToILead(doc) {
        return {
            id: doc._id.toString(),
            tenantId: doc.tenantId,
            contactId: doc.contactId.toString(),
            companyId: doc.companyId.toString(),
            stage: doc.stage,
            source: doc.source,
            score: doc.score,
            scoreValue: doc.scoreValue,
            ownerId: doc.ownerId,
            assignedTo: doc.assignedTo,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            lastContactedAt: doc.lastContactedAt,
            nextFollowupAt: doc.nextFollowupAt
        };
    }
}
exports.QualifierService = QualifierService;
exports.qualifierService = new QualifierService();
//# sourceMappingURL=qualifier.js.map