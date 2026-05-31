"use strict";
// ============================================
// HOJAI AI - SDR Agent Prospect Routes
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.prospectRoutes = void 0;
const express_1 = require("express");
const prospectFinder_1 = require("../services/prospectFinder");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../utils/validation");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
exports.prospectRoutes = router;
// Apply middleware
router.use(auth_1.extractTenant);
router.use(auth_1.requireInternalAuth);
/**
 * POST /api/prospects/find
 * Find prospects based on search criteria
 */
router.post('/find', (0, validation_1.validateBody)(validation_1.ProspectSearchSchema), async (req, res) => {
    try {
        const { tenantId, userId } = req;
        const search = req.body;
        const limit = Math.min(req.body.limit || 50, 100);
        const offset = req.body.offset || 0;
        logger_1.logger.info('Prospect find request', { tenantId, search });
        const result = await prospectFinder_1.prospectFinder.findProspects(tenantId, search, limit, offset);
        res.json((0, validation_1.paginatedResponse)(result.prospects, result.total, limit, offset));
    }
    catch (error) {
        logger_1.logger.error('Failed to find prospects', { error, tenantId: req.tenantId });
        res.status(500).json((0, validation_1.errorResponse)('PROSPECT_FIND_FAILED', 'Failed to find prospects', error instanceof Error ? error.message : undefined));
    }
});
/**
 * POST /api/prospects/generate
 * Generate new prospects using configured sources
 */
router.post('/generate', async (req, res) => {
    try {
        const { tenantId } = req;
        const { industry, companySize, location, title, limit = 10 } = req.body;
        logger_1.logger.info('Generating new prospects', { tenantId, criteria: req.body });
        const prospects = await prospectFinder_1.prospectFinder.generateProspects(tenantId, { industry, companySize, location, title }, limit);
        res.json((0, validation_1.successResponse)({
            prospects,
            count: prospects.length
        }, `Generated ${prospects.length} prospects`));
    }
    catch (error) {
        logger_1.logger.error('Failed to generate prospects', { error, tenantId: req.tenantId });
        res.status(500).json((0, validation_1.errorResponse)('PROSPECT_GENERATION_FAILED', 'Failed to generate prospects', error instanceof Error ? error.message : undefined));
    }
});
/**
 * GET /api/prospects/:id
 * Get a specific prospect by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { tenantId } = req;
        const { id } = req.params;
        // In a real implementation, this would fetch from database
        // For now, return not found as prospects are ephemeral until converted to leads
        res.status(404).json((0, validation_1.errorResponse)('NOT_FOUND', 'Prospect not found. Prospects must be converted to leads first.'));
    }
    catch (error) {
        logger_1.logger.error('Failed to get prospect', { error, tenantId: req.tenantId });
        res.status(500).json((0, validation_1.errorResponse)('PROSPECT_GET_FAILED', 'Failed to get prospect'));
    }
});
//# sourceMappingURL=prospects.js.map