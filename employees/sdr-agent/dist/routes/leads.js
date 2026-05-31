"use strict";
// ============================================
// HOJAI AI - SDR Agent Lead Routes
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadRoutes = void 0;
const express_1 = require("express");
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../utils/validation");
const logger_1 = require("../utils/logger");
const types_1 = require("../types");
const router = (0, express_1.Router)();
exports.leadRoutes = router;
// Apply middleware
router.use(auth_1.extractTenant);
router.use(auth_1.requireInternalAuth);
/**
 * GET /api/leads
 * List leads with filtering and pagination
 */
router.get('/', async (req, res) => {
    try {
        const { tenantId } = req;
        // Parse query parameters
        const filters = {
            stage: req.query.stage,
            source: req.query.source,
            score: req.query.score,
            assignedTo: req.query.assignedTo
        };
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const offset = parseInt(req.query.offset) || 0;
        // Build query
        const query = { tenantId };
        if (filters.stage)
            query.stage = filters.stage;
        if (filters.source)
            query.source = filters.source;
        if (filters.score)
            query.score = filters.score;
        if (filters.assignedTo)
            query.assignedTo = filters.assignedTo;
        // Get total count
        const total = await models_1.Lead.countDocuments(query);
        // Get leads with populated contact and company
        const leads = await models_1.Lead.find(query)
            .sort({ updatedAt: -1 })
            .skip(offset)
            .limit(limit)
            .populate('contactId')
            .populate('companyId')
            .lean();
        // Transform to response format
        const transformedLeads = leads.map(lead => ({
            id: lead._id.toString(),
            tenantId: lead.tenantId,
            contact: lead.contactId,
            company: lead.companyId,
            stage: lead.stage,
            source: lead.source,
            score: lead.score,
            scoreValue: lead.scoreValue,
            ownerId: lead.ownerId,
            assignedTo: lead.assignedTo,
            lastContactedAt: lead.lastContactedAt,
            nextFollowupAt: lead.nextFollowupAt,
            createdAt: lead.createdAt,
            updatedAt: lead.updatedAt
        }));
        res.json((0, validation_1.paginatedResponse)(transformedLeads, total, limit, offset));
    }
    catch (error) {
        logger_1.logger.error('Failed to list leads', { error, tenantId: req.tenantId });
        res.status(500).json((0, validation_1.errorResponse)('LEADS_LIST_FAILED', 'Failed to list leads'));
    }
});
/**
 * GET /api/leads/:id
 * Get a specific lead with full details
 */
router.get('/:id', async (req, res) => {
    try {
        const { tenantId } = req;
        const { id } = req.params;
        const lead = await models_1.Lead.findOne({ _id: id, tenantId })
            .populate('contactId')
            .populate('companyId')
            .lean();
        if (!lead) {
            return res.status(404).json((0, validation_1.errorResponse)('NOT_FOUND', 'Lead not found'));
        }
        // Get qualification
        const qualification = await models_1.Qualification.findOne({ leadId: lead._id }).lean();
        // Get recent activities
        const activities = await models_1.Activity.find({ leadId: lead._id })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();
        res.json((0, validation_1.successResponse)({
            lead: {
                id: lead._id.toString(),
                tenantId: lead.tenantId,
                contact: lead.contactId,
                company: lead.companyId,
                stage: lead.stage,
                source: lead.source,
                score: lead.score,
                scoreValue: lead.scoreValue,
                ownerId: lead.ownerId,
                assignedTo: lead.assignedTo,
                lastContactedAt: lead.lastContactedAt,
                nextFollowupAt: lead.nextFollowupAt,
                createdAt: lead.createdAt,
                updatedAt: lead.updatedAt
            },
            qualification,
            activities: activities.map(a => ({
                id: a._id.toString(),
                type: a.type,
                description: a.description,
                metadata: a.metadata,
                createdBy: a.createdBy,
                createdAt: a.createdAt
            }))
        }));
    }
    catch (error) {
        logger_1.logger.error('Failed to get lead', { error, tenantId: req.tenantId });
        res.status(500).json((0, validation_1.errorResponse)('LEAD_GET_FAILED', 'Failed to get lead'));
    }
});
/**
 * POST /api/leads
 * Create a new lead
 */
router.post('/', async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const { contactId, companyId, source, ownerId } = req.body;
        // Validate required fields
        if (!contactId || !companyId) {
            return res.status(400).json((0, validation_1.errorResponse)('VALIDATION_ERROR', 'contactId and companyId are required'));
        }
        // Verify contact and company exist
        const contact = await models_1.Contact.findOne({ _id: contactId, tenantId });
        const company = await models_1.Company.findOne({ _id: companyId, tenantId });
        if (!contact) {
            return res.status(400).json((0, validation_1.errorResponse)('NOT_FOUND', 'Contact not found'));
        }
        if (!company) {
            return res.status(400).json((0, validation_1.errorResponse)('NOT_FOUND', 'Company not found'));
        }
        // Create lead
        const lead = await models_1.Lead.create({
            tenantId,
            contactId,
            companyId,
            source: source || types_1.LeadSource.COLD_OUTREACH,
            ownerId: ownerId || userId || 'system',
            stage: types_1.LeadStage.NEW,
            score: types_1.LeadScore.COLD,
            scoreValue: 0
        });
        // Log activity
        await models_1.Activity.create({
            tenantId,
            leadId: lead._id,
            type: 'stage_change',
            description: 'Lead created',
            metadata: { source },
            createdBy: userId || 'system'
        });
        logger_1.logger.info('Lead created', { tenantId, leadId: lead._id });
        res.status(201).json((0, validation_1.successResponse)({
            id: lead._id.toString(),
            tenantId: lead.tenantId,
            contactId: lead.contactId.toString(),
            companyId: lead.companyId.toString(),
            stage: lead.stage,
            source: lead.source,
            score: lead.score,
            scoreValue: lead.scoreValue,
            ownerId: lead.ownerId,
            createdAt: lead.createdAt
        }, 'Lead created successfully'));
    }
    catch (error) {
        logger_1.logger.error('Failed to create lead', { error, tenantId: req.tenantId });
        res.status(500).json((0, validation_1.errorResponse)('LEAD_CREATE_FAILED', 'Failed to create lead'));
    }
});
/**
 * PUT /api/leads/:id/stage
 * Update lead stage
 */
router.put('/:id/stage', async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const { id } = req.params;
        const { stage, notes } = req.body;
        const lead = await models_1.Lead.findOne({ _id: id, tenantId });
        if (!lead) {
            return res.status(404).json((0, validation_1.errorResponse)('NOT_FOUND', 'Lead not found'));
        }
        const oldStage = lead.stage;
        lead.stage = stage;
        // Update score based on stage
        if (stage === types_1.LeadStage.CLOSED_WON) {
            lead.score = types_1.LeadScore.HOT;
            lead.scoreValue = 100;
        }
        else if (stage === types_1.LeadStage.CLOSED_LOST) {
            lead.score = types_1.LeadScore.UNQUALIFIED;
            lead.scoreValue = 0;
        }
        await lead.save();
        // Log activity
        await models_1.Activity.create({
            tenantId,
            leadId: lead._id,
            type: 'stage_change',
            description: notes || `Stage changed from ${oldStage} to ${stage}`,
            metadata: { oldStage, newStage: stage },
            createdBy: userId || 'system'
        });
        logger_1.logger.info('Lead stage updated', { tenantId, leadId: id, oldStage, newStage: stage });
        res.json((0, validation_1.successResponse)({
            id: lead._id.toString(),
            stage: lead.stage,
            score: lead.score,
            scoreValue: lead.scoreValue,
            previousStage: oldStage
        }, 'Lead stage updated'));
    }
    catch (error) {
        logger_1.logger.error('Failed to update lead stage', { error, tenantId: req.tenantId });
        res.status(500).json((0, validation_1.errorResponse)('LEAD_STAGE_UPDATE_FAILED', 'Failed to update lead stage'));
    }
});
/**
 * PATCH /api/leads/:id
 * Update lead details
 */
router.patch('/:id', async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const { id } = req.params;
        const updates = req.body;
        const allowedUpdates = ['assignedTo', 'ownerId', 'nextFollowupAt', 'metadata'];
        const updateData = {};
        for (const key of allowedUpdates) {
            if (updates[key] !== undefined) {
                updateData[key] = updates[key];
            }
        }
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json((0, validation_1.errorResponse)('VALIDATION_ERROR', 'No valid fields to update'));
        }
        const lead = await models_1.Lead.findOneAndUpdate({ _id: id, tenantId }, updateData, { new: true });
        if (!lead) {
            return res.status(404).json((0, validation_1.errorResponse)('NOT_FOUND', 'Lead not found'));
        }
        res.json((0, validation_1.successResponse)({
            id: lead._id.toString(),
            assignedTo: lead.assignedTo,
            ownerId: lead.ownerId,
            nextFollowupAt: lead.nextFollowupAt
        }));
    }
    catch (error) {
        logger_1.logger.error('Failed to update lead', { error, tenantId: req.tenantId });
        res.status(500).json((0, validation_1.errorResponse)('LEAD_UPDATE_FAILED', 'Failed to update lead'));
    }
});
/**
 * DELETE /api/leads/:id
 * Delete a lead
 */
router.delete('/:id', async (req, res) => {
    try {
        const { tenantId } = req;
        const { id } = req.params;
        const lead = await models_1.Lead.findOneAndDelete({ _id: id, tenantId });
        if (!lead) {
            return res.status(404).json((0, validation_1.errorResponse)('NOT_FOUND', 'Lead not found'));
        }
        // Delete related records
        await Promise.all([
            models_1.Activity.deleteMany({ leadId: lead._id }),
            models_1.Qualification.deleteMany({ leadId: lead._id })
        ]);
        logger_1.logger.info('Lead deleted', { tenantId, leadId: id });
        res.json((0, validation_1.successResponse)({ id }, 'Lead deleted'));
    }
    catch (error) {
        logger_1.logger.error('Failed to delete lead', { error, tenantId: req.tenantId });
        res.status(500).json((0, validation_1.errorResponse)('LEAD_DELETE_FAILED', 'Failed to delete lead'));
    }
});
/**
 * GET /api/leads/stats/summary
 * Get lead statistics summary
 */
router.get('/stats/summary', async (req, res) => {
    try {
        const { tenantId } = req;
        const pipeline = [
            { $match: { tenantId } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    byStage: { $push: '$stage' },
                    byScore: { $push: '$score' }
                }
            }
        ];
        const [result] = await models_1.Lead.aggregate(pipeline);
        const stageDistribution = {};
        const scoreDistribution = {};
        if (result) {
            for (const stage of result.byStage) {
                stageDistribution[stage] = (stageDistribution[stage] || 0) + 1;
            }
            for (const score of result.byScore) {
                scoreDistribution[score] = (scoreDistribution[score] || 0) + 1;
            }
        }
        res.json((0, validation_1.successResponse)({
            total: result?.total || 0,
            stageDistribution,
            scoreDistribution,
            avgScore: result?.total ? Math.round(result.byScore.reduce((sum, s) => sum + (s === 'hot' ? 90 : s === 'warm' ? 65 : s === 'cold' ? 25 : 0), 0) / result.total) : 0
        }));
    }
    catch (error) {
        logger_1.logger.error('Failed to get lead stats', { error, tenantId: req.tenantId });
        res.status(500).json((0, validation_1.errorResponse)('STATS_FAILED', 'Failed to get lead statistics'));
    }
});
//# sourceMappingURL=leads.js.map