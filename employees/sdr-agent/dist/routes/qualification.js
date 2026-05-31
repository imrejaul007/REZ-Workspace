"use strict";
// ============================================
// HOJAI AI - SDR Agent Qualification Routes
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.qualificationRoutes = void 0;
const express_1 = require("express");
const qualifier_1 = require("../services/qualifier");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../utils/validation");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
exports.qualificationRoutes = router;
// Apply middleware
router.use(auth_1.extractTenant);
router.use(auth_1.requireInternalAuth);
/**
 * POST /api/prospects/qualify
 * Qualify a lead using BANT framework
 */
router.post('/qualify', async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const { leadId, qualification, notes } = req.body;
        if (!leadId) {
            return res.status(400).json((0, validation_1.errorResponse)('VALIDATION_ERROR', 'leadId is required'));
        }
        if (!qualification) {
            return res.status(400).json((0, validation_1.errorResponse)('VALIDATION_ERROR', 'qualification data is required'));
        }
        // Validate qualification structure
        const validationResult = validation_1.QualificationInputSchema.safeParse(qualification);
        if (!validationResult.success) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid qualification data',
                    details: validationResult.error.errors.map(e => ({
                        field: e.path.join('.'),
                        message: e.message
                    }))
                }
            });
        }
        const result = await qualifier_1.qualifierService.qualifyLead(tenantId, leadId, qualification, userId || 'system', notes);
        res.json((0, validation_1.successResponse)({
            qualification: result.qualification,
            lead: result.lead,
            disqualified: result.disqualified,
            disqualifyReason: result.disqualifyReason,
            summary: {
                qualified: !result.disqualified && result.qualification.status === 'qualified',
                score: result.lead.scoreValue,
                scoreLabel: result.lead.score
            }
        }, result.disqualified ? 'Lead disqualified' : result.qualification.status === 'qualified' ? 'Lead qualified' : 'Qualification in progress'));
    }
    catch (error) {
        logger_1.logger.error('Failed to qualify lead', { error, tenantId: req.tenantId });
        res.status(500).json((0, validation_1.errorResponse)('QUALIFICATION_FAILED', 'Failed to qualify lead', error instanceof Error ? error.message : undefined));
    }
});
/**
 * GET /api/prospects/qualify/:leadId
 * Get qualification status for a lead
 */
router.get('/qualify/:leadId', async (req, res) => {
    try {
        const { tenantId } = req;
        const { leadId } = req.params;
        const qualification = await qualifier_1.qualifierService.getQualification(tenantId, leadId);
        if (!qualification) {
            return res.status(404).json((0, validation_1.errorResponse)('NOT_FOUND', 'Qualification not found for this lead'));
        }
        res.json((0, validation_1.successResponse)({
            qualification
        }));
    }
    catch (error) {
        logger_1.logger.error('Failed to get qualification', { error, tenantId: req.tenantId });
        res.status(500).json((0, validation_1.errorResponse)('QUALIFICATION_GET_FAILED', 'Failed to get qualification'));
    }
});
/**
 * POST /api/prospects/qualify/:leadId/score
 * Auto-score a lead based on contact/company data
 */
router.post('/qualify/:leadId/score', async (req, res) => {
    try {
        const { tenantId } = req;
        const { leadId } = req.params;
        const scoreResult = await qualifier_1.qualifierService.autoScore(tenantId, leadId);
        res.json((0, validation_1.successResponse)({
            leadId,
            score: scoreResult.score,
            breakdown: scoreResult.scoreBreakdown,
            recommendations: scoreResult.recommendations,
            label: scoreResult.score >= 80 ? 'hot' : scoreResult.score >= 50 ? 'warm' : 'cold'
        }));
    }
    catch (error) {
        logger_1.logger.error('Failed to auto-score lead', { error, tenantId: req.tenantId });
        res.status(500).json((0, validation_1.errorResponse)('AUTO_SCORE_FAILED', 'Failed to auto-score lead', error instanceof Error ? error.message : undefined));
    }
});
/**
 * GET /api/qualification/templates
 * Get BANT qualification templates
 */
router.get('/templates', async (req, res) => {
    try {
        const templates = [
            {
                id: 'bant-full',
                name: 'BANT Full Assessment',
                description: 'Complete BANT qualification framework',
                fields: ['budget', 'authority', 'need', 'timeline']
            },
            {
                id: 'bant-budget-focused',
                name: 'Budget-Focused BANT',
                description: 'BANT with emphasis on budget and authority',
                fields: ['budget', 'authority']
            },
            {
                id: 'meddic',
                name: 'MEDDIC Qualification',
                description: 'Enterprise sales qualification framework',
                customFields: ['Metrics', 'Economic Buyer', 'Decision Criteria', 'Decision Process', 'Identify Pain', 'Champion']
            }
        ];
        res.json((0, validation_1.successResponse)({ templates }));
    }
    catch (error) {
        logger_1.logger.error('Failed to get qualification templates', { error });
        res.status(500).json((0, validation_1.errorResponse)('TEMPLATES_FAILED', 'Failed to get qualification templates'));
    }
});
//# sourceMappingURL=qualification.js.map