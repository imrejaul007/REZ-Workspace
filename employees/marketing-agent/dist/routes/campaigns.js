"use strict";
// ============================================
// HOJAI AI - Marketing Agent Campaign Routes
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.campaignRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const campaignManager_1 = require("../services/campaignManager");
const validation_1 = require("../utils/validation");
const logger_1 = require("../utils/logger");
const types_1 = require("../types");
const router = (0, express_1.Router)();
exports.campaignRoutes = router;
// Validation schemas
const CreateCampaignSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200),
    type: zod_1.z.nativeEnum(types_1.CampaignType),
    objective: zod_1.z.nativeEnum(types_1.CampaignObjective),
    description: zod_1.z.string().max(1000).optional(),
    targetAudience: zod_1.z.object({
        demographics: zod_1.z.object({
            age: zod_1.z.object({
                min: zod_1.z.number().min(13).optional(),
                max: zod_1.z.number().max(120).optional()
            }).optional(),
            gender: zod_1.z.enum(['male', 'female', 'all']).optional(),
            locations: zod_1.z.array(zod_1.z.string()).optional(),
            languages: zod_1.z.array(zod_1.z.string()).optional()
        }).optional(),
        interests: zod_1.z.array(zod_1.z.string()).optional(),
        behaviors: zod_1.z.array(zod_1.z.string()).optional()
    }).optional(),
    budget: zod_1.z.object({
        total: zod_1.z.number().min(0),
        currency: zod_1.z.string().default('USD')
    }).optional(),
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime().optional(),
    channels: zod_1.z.array(zod_1.z.enum(['email', 'social', 'ad', 'content'])).optional()
});
const LaunchCampaignSchema = zod_1.z.object({
    immediate: zod_1.z.boolean().default(true),
    startDate: zod_1.z.string().datetime().optional()
});
const UpdateCampaignSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200).optional(),
    description: zod_1.z.string().max(1000).optional(),
    budget: zod_1.z.object({
        total: zod_1.z.number().min(0)
    }).optional(),
    endDate: zod_1.z.string().datetime().optional(),
    targetAudience: zod_1.z.object({
        demographics: zod_1.z.object({
            age: zod_1.z.object({
                min: zod_1.z.number().min(13).optional(),
                max: zod_1.z.number().max(120).optional()
            }).optional(),
            gender: zod_1.z.enum(['male', 'female', 'all']).optional(),
            locations: zod_1.z.array(zod_1.z.string()).optional(),
            languages: zod_1.z.array(zod_1.z.string()).optional()
        }).optional(),
        interests: zod_1.z.array(zod_1.z.string()).optional(),
        behaviors: zod_1.z.array(zod_1.z.string()).optional()
    }).optional()
});
const ListCampaignsSchema = validation_1.PaginationSchema.extend({
    status: zod_1.z.enum(['draft', 'ready', 'launched', 'paused', 'completed', 'cancelled']).optional(),
    type: zod_1.z.enum(['email', 'social', 'ad', 'content', 'multi_channel']).optional(),
    objective: zod_1.z.enum(['awareness', 'consideration', 'conversion', 'retention', 'engagement']).optional()
}).omit({ sort: true, sortBy: true });
/**
 * POST /api/campaigns/create
 * Create a new campaign
 */
router.post('/create', (0, validation_1.validateBody)(CreateCampaignSchema), async (req, res) => {
    try {
        const tenantId = req.tenantId || 'default';
        const userId = req.userId || 'system';
        const campaign = await campaignManager_1.campaignManager.createCampaign(tenantId, userId, {
            name: req.body.name,
            type: req.body.type,
            objective: req.body.objective,
            description: req.body.description,
            targetAudience: req.body.targetAudience,
            budget: req.body.budget,
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            channels: req.body.channels
        });
        logger_1.logger.info('Campaign created', { tenantId, campaignId: campaign.id });
        res.json({
            success: true,
            data: { campaign }
        });
    }
    catch (error) {
        logger_1.logger.error('Create campaign failed', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'CREATE_FAILED',
                message: error instanceof Error ? error.message : 'Failed to create campaign'
            }
        });
    }
});
/**
 * GET /api/campaigns
 * List all campaigns
 */
router.get('/', (0, validation_1.validateBody)(ListCampaignsSchema), async (req, res) => {
    try {
        const tenantId = req.tenantId || 'default';
        const pagination = (0, validation_1.getPaginationOptions)(req.body);
        const result = await campaignManager_1.campaignManager.listCampaigns(tenantId, {
            status: req.body.status,
            type: req.body.type,
            objective: req.body.objective,
            limit: pagination.limit,
            offset: pagination.skip
        });
        res.json((0, validation_1.formatPaginatedResponse)(result.items, result.total, (req.body.page || 1), (req.body.limit || 20)));
    }
    catch (error) {
        logger_1.logger.error('List campaigns failed', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'LIST_FAILED',
                message: error instanceof Error ? error.message : 'Failed to list campaigns'
            }
        });
    }
});
/**
 * GET /api/campaigns/:id
 * Get campaign by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const tenantId = req.tenantId || 'default';
        const campaign = await campaignManager_1.campaignManager.getCampaign(tenantId, req.params.id);
        if (!campaign) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Campaign not found'
                }
            });
            return;
        }
        res.json({
            success: true,
            data: { campaign }
        });
    }
    catch (error) {
        logger_1.logger.error('Get campaign failed', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'GET_FAILED',
                message: error instanceof Error ? error.message : 'Failed to get campaign'
            }
        });
    }
});
/**
 * GET /api/campaigns/:id/summary
 * Get campaign performance summary
 */
router.get('/:id/summary', async (req, res) => {
    try {
        const tenantId = req.tenantId || 'default';
        const summary = await campaignManager_1.campaignManager.getCampaignSummary(tenantId, req.params.id);
        if (!summary) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Campaign not found'
                }
            });
            return;
        }
        res.json({
            success: true,
            data: summary
        });
    }
    catch (error) {
        logger_1.logger.error('Get campaign summary failed', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'SUMMARY_FAILED',
                message: error instanceof Error ? error.message : 'Failed to get campaign summary'
            }
        });
    }
});
/**
 * POST /api/campaigns/:id/launch
 * Launch a campaign
 */
router.post('/:id/launch', (0, validation_1.validateBody)(LaunchCampaignSchema), async (req, res) => {
    try {
        const tenantId = req.tenantId || 'default';
        const result = await campaignManager_1.campaignManager.launchCampaign(tenantId, req.params.id, req.body.immediate, req.body.startDate);
        if (!result.success) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'LAUNCH_FAILED',
                    message: result.error
                }
            });
            return;
        }
        logger_1.logger.info('Campaign launched', { tenantId, campaignId: req.params.id });
        res.json({
            success: true,
            data: {
                campaignId: result.campaign.id,
                status: result.campaign.status,
                launchedAt: result.campaign.launchedAt
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Launch campaign failed', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'LAUNCH_FAILED',
                message: error instanceof Error ? error.message : 'Failed to launch campaign'
            }
        });
    }
});
/**
 * POST /api/campaigns/:id/pause
 * Pause a campaign
 */
router.post('/:id/pause', async (req, res) => {
    try {
        const tenantId = req.tenantId || 'default';
        const campaign = await campaignManager_1.campaignManager.pauseCampaign(tenantId, req.params.id);
        if (!campaign) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'PAUSE_FAILED',
                    message: 'Campaign not found or cannot be paused'
                }
            });
            return;
        }
        logger_1.logger.info('Campaign paused', { tenantId, campaignId: req.params.id });
        res.json({
            success: true,
            data: { campaign }
        });
    }
    catch (error) {
        logger_1.logger.error('Pause campaign failed', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'PAUSE_FAILED',
                message: error instanceof Error ? error.message : 'Failed to pause campaign'
            }
        });
    }
});
/**
 * POST /api/campaigns/:id/resume
 * Resume a paused campaign
 */
router.post('/:id/resume', async (req, res) => {
    try {
        const tenantId = req.tenantId || 'default';
        const campaign = await campaignManager_1.campaignManager.resumeCampaign(tenantId, req.params.id);
        if (!campaign) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'RESUME_FAILED',
                    message: 'Campaign not found or cannot be resumed'
                }
            });
            return;
        }
        logger_1.logger.info('Campaign resumed', { tenantId, campaignId: req.params.id });
        res.json({
            success: true,
            data: { campaign }
        });
    }
    catch (error) {
        logger_1.logger.error('Resume campaign failed', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'RESUME_FAILED',
                message: error instanceof Error ? error.message : 'Failed to resume campaign'
            }
        });
    }
});
/**
 * POST /api/campaigns/:id/complete
 * Complete a campaign
 */
router.post('/:id/complete', async (req, res) => {
    try {
        const tenantId = req.tenantId || 'default';
        const campaign = await campaignManager_1.campaignManager.completeCampaign(tenantId, req.params.id);
        if (!campaign) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'COMPLETE_FAILED',
                    message: 'Campaign not found or cannot be completed'
                }
            });
            return;
        }
        logger_1.logger.info('Campaign completed', { tenantId, campaignId: req.params.id });
        res.json({
            success: true,
            data: { campaign }
        });
    }
    catch (error) {
        logger_1.logger.error('Complete campaign failed', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'COMPLETE_FAILED',
                message: error instanceof Error ? error.message : 'Failed to complete campaign'
            }
        });
    }
});
/**
 * PATCH /api/campaigns/:id
 * Update campaign
 */
router.patch('/:id', (0, validation_1.validateBody)(UpdateCampaignSchema), async (req, res) => {
    try {
        const tenantId = req.tenantId || 'default';
        const campaign = await campaignManager_1.campaignManager.updateCampaign(tenantId, req.params.id, {
            name: req.body.name,
            description: req.body.description,
            budget: req.body.budget,
            endDate: req.body.endDate,
            targetAudience: req.body.targetAudience
        });
        if (!campaign) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Campaign not found'
                }
            });
            return;
        }
        res.json({
            success: true,
            data: { campaign }
        });
    }
    catch (error) {
        logger_1.logger.error('Update campaign failed', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'UPDATE_FAILED',
                message: error instanceof Error ? error.message : 'Failed to update campaign'
            }
        });
    }
});
/**
 * DELETE /api/campaigns/:id
 * Cancel a campaign
 */
router.delete('/:id', async (req, res) => {
    try {
        const tenantId = req.tenantId || 'default';
        const campaign = await campaignManager_1.campaignManager.cancelCampaign(tenantId, req.params.id);
        if (!campaign) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Campaign not found'
                }
            });
            return;
        }
        logger_1.logger.info('Campaign cancelled', { tenantId, campaignId: req.params.id });
        res.json({
            success: true,
            data: { campaign }
        });
    }
    catch (error) {
        logger_1.logger.error('Cancel campaign failed', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'CANCEL_FAILED',
                message: error instanceof Error ? error.message : 'Failed to cancel campaign'
            }
        });
    }
});
//# sourceMappingURL=campaigns.js.map