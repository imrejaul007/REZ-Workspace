"use strict";
// ============================================
// HOJAI AI - SDR Agent Outreach Routes
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.outreachRoutes = void 0;
const express_1 = require("express");
const outreachEngine_1 = require("../services/outreachEngine");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../utils/validation");
const logger_1 = require("../utils/logger");
const types_1 = require("../types");
const router = (0, express_1.Router)();
exports.outreachRoutes = router;
// Apply middleware
router.use(auth_1.extractTenant);
router.use(auth_1.requireInternalAuth);
/**
 * POST /api/outreach/send
 * Send outreach message to a lead
 */
router.post('/send', async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const { leadId, channel, message, scheduleFor } = req.body;
        if (!leadId) {
            return res.status(400).json((0, validation_1.errorResponse)('VALIDATION_ERROR', 'leadId is required'));
        }
        if (!message || !message.body) {
            return res.status(400).json((0, validation_1.errorResponse)('VALIDATION_ERROR', 'message.body is required'));
        }
        const channelEnum = channel;
        const result = await outreachEngine_1.outreachEngine.sendOutreach(tenantId, leadId, channelEnum, {
            body: message.body,
            subject: message.subject,
            templateId: message.templateId,
            personalization: message.personalization,
            attachments: message.attachments
        }, scheduleFor, userId);
        if (!result.success) {
            return res.status(400).json((0, validation_1.errorResponse)('OUTREACH_FAILED', result.error || 'Failed to send outreach'));
        }
        res.status(201).json((0, validation_1.successResponse)({
            outreach: result.outreach
        }, 'Outreach sent successfully'));
    }
    catch (error) {
        logger_1.logger.error('Failed to send outreach', { error, tenantId: req.tenantId });
        res.status(500).json((0, validation_1.errorResponse)('OUTREACH_SEND_FAILED', 'Failed to send outreach', error instanceof Error ? error.message : undefined));
    }
});
/**
 * GET /api/outreach/lead/:leadId
 * Get outreach history for a lead
 */
router.get('/lead/:leadId', async (req, res) => {
    try {
        const { tenantId } = req;
        const { leadId } = req.params;
        const history = await outreachEngine_1.outreachEngine.getOutreachHistory(tenantId, leadId);
        res.json((0, validation_1.successResponse)({
            outreach: history
        }));
    }
    catch (error) {
        logger_1.logger.error('Failed to get outreach history', { error, tenantId: req.tenantId });
        res.status(500).json((0, validation_1.errorResponse)('OUTREACH_HISTORY_FAILED', 'Failed to get outreach history'));
    }
});
/**
 * PUT /api/outreach/:id/status
 * Update outreach status (webhook handler)
 */
router.put('/:id/status', async (req, res) => {
    try {
        const { tenantId } = req;
        const { id } = req.params;
        const { status, metadata } = req.body;
        if (!status) {
            return res.status(400).json((0, validation_1.errorResponse)('VALIDATION_ERROR', 'status is required'));
        }
        const statusEnum = status;
        const validStatuses = Object.values(types_1.OutreachStatus);
        if (!validStatuses.includes(statusEnum)) {
            return res.status(400).json((0, validation_1.errorResponse)('VALIDATION_ERROR', `Invalid status. Valid values: ${validStatuses.join(', ')}`));
        }
        const updated = await outreachEngine_1.outreachEngine.updateOutreachStatus(tenantId, id, statusEnum, metadata);
        if (!updated) {
            return res.status(404).json((0, validation_1.errorResponse)('NOT_FOUND', 'Outreach not found'));
        }
        res.json((0, validation_1.successResponse)({
            outreach: updated
        }, 'Outreach status updated'));
    }
    catch (error) {
        logger_1.logger.error('Failed to update outreach status', { error, tenantId: req.tenantId });
        res.status(500).json((0, validation_1.errorResponse)('OUTREACH_STATUS_UPDATE_FAILED', 'Failed to update outreach status'));
    }
});
/**
 * GET /api/outreach/templates
 * Get available outreach templates
 */
router.get('/templates', async (req, res) => {
    try {
        // Return default templates
        const templates = [
            {
                id: 'cold-email-intro',
                name: 'Cold Email Introduction',
                channel: 'email',
                subject: 'Quick question about {{company}}',
                variables: ['firstName', 'company', 'industry']
            },
            {
                id: 'linkedin-connection',
                name: 'LinkedIn Connection Request',
                channel: 'linkedin',
                variables: ['firstName', 'company']
            },
            {
                id: 'follow-up-email',
                name: 'Follow-up Email',
                channel: 'email',
                subject: 'Following up on my note',
                variables: ['firstName', 'company']
            }
        ];
        res.json((0, validation_1.successResponse)({ templates }));
    }
    catch (error) {
        logger_1.logger.error('Failed to get templates', { error });
        res.status(500).json((0, validation_1.errorResponse)('TEMPLATES_FAILED', 'Failed to get templates'));
    }
});
/**
 * GET /api/outreach/stats
 * Get outreach statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const { tenantId } = req;
        // This would query the Outreach model for stats
        // For now, return placeholder data
        res.json((0, validation_1.successResponse)({
            totalSent: 0,
            totalDelivered: 0,
            totalOpened: 0,
            totalClicked: 0,
            totalReplied: 0,
            bounceRate: 0,
            avgOpenRate: 0,
            avgClickRate: 0,
            avgReplyRate: 0,
            byChannel: {
                email: { sent: 0, opened: 0, clicked: 0, replied: 0 },
                linkedin: { sent: 0, opened: 0, clicked: 0, replied: 0 },
                phone: { calls: 0, answered: 0 },
                sms: { sent: 0, delivered: 0, replied: 0 },
                whatsapp: { sent: 0, delivered: 0, replied: 0 }
            }
        }));
    }
    catch (error) {
        logger_1.logger.error('Failed to get outreach stats', { error, tenantId: req.tenantId });
        res.status(500).json((0, validation_1.errorResponse)('STATS_FAILED', 'Failed to get outreach statistics'));
    }
});
//# sourceMappingURL=outreach.js.map