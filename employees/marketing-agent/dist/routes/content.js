"use strict";
// ============================================
// HOJAI AI - Marketing Agent Content Routes
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const contentGenerator_1 = require("../services/contentGenerator");
const validation_1 = require("../utils/validation");
const logger_1 = require("../utils/logger");
const types_1 = require("../types");
const router = (0, express_1.Router)();
exports.contentRoutes = router;
// Validation schemas
const GenerateContentSchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(types_1.ContentType),
    topic: zod_1.z.string().min(1).max(500),
    keywords: zod_1.z.array(zod_1.z.string()).optional(),
    targetAudience: zod_1.z.string().optional(),
    tone: zod_1.z.string().optional(),
    length: zod_1.z.enum(['short', 'medium', 'long']).default('medium'),
    brandVoice: zod_1.z.string().max(200).optional(),
    cta: zod_1.z.string().max(200).optional(),
    additionalContext: zod_1.z.string().max(2000).optional()
});
const ListContentSchema = validation_1.PaginationSchema.extend({
    type: zod_1.z.enum(['blog_post', 'social_media', 'email', 'ad_copy', 'landing_page', 'product_description', 'video_script', 'newsletter', 'case_study', 'white_paper']).optional(),
    status: zod_1.z.enum(['draft', 'review', 'approved', 'published', 'archived']).optional(),
    createdBy: zod_1.z.string().optional()
}).omit({ sort: true, sortBy: true });
/**
 * POST /api/content/generate
 * Generate new content
 */
router.post('/generate', (0, validation_1.validateBody)(GenerateContentSchema), async (req, res) => {
    try {
        const tenantId = req.tenantId || 'default';
        const userId = req.userId || 'system';
        const result = await contentGenerator_1.contentGenerator.generateContent(tenantId, userId, {
            type: req.body.type,
            topic: req.body.topic,
            keywords: req.body.keywords,
            targetAudience: req.body.targetAudience,
            tone: req.body.tone,
            length: req.body.length,
            brandVoice: req.body.brandVoice,
            cta: req.body.cta,
            additionalContext: req.body.additionalContext
        });
        logger_1.logger.info('Content generated', { tenantId, type: req.body.type });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.logger.error('Content generation failed', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'GENERATION_FAILED',
                message: error instanceof Error ? error.message : 'Content generation failed'
            }
        });
    }
});
/**
 * GET /api/content
 * List generated content
 */
router.get('/', (0, validation_1.validateBody)(ListContentSchema), async (req, res) => {
    try {
        const tenantId = req.tenantId || 'default';
        const pagination = (0, validation_1.getPaginationOptions)(req.body);
        const result = await contentGenerator_1.contentGenerator.listContent(tenantId, {
            type: req.body.type,
            status: req.body.status,
            createdBy: req.body.createdBy,
            limit: pagination.limit,
            offset: pagination.skip
        });
        res.json((0, validation_1.formatPaginatedResponse)(result.items, result.total, (req.body.page || 1), (req.body.limit || 20)));
    }
    catch (error) {
        logger_1.logger.error('List content failed', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'LIST_FAILED',
                message: error instanceof Error ? error.message : 'Failed to list content'
            }
        });
    }
});
/**
 * GET /api/content/:id
 * Get content by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const tenantId = req.tenantId || 'default';
        const content = await contentGenerator_1.contentGenerator.getContent(tenantId, req.params.id);
        if (!content) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Content not found'
                }
            });
            return;
        }
        res.json({
            success: true,
            data: content
        });
    }
    catch (error) {
        logger_1.logger.error('Get content failed', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'GET_FAILED',
                message: error instanceof Error ? error.message : 'Failed to get content'
            }
        });
    }
});
/**
 * PATCH /api/content/:id/status
 * Update content status
 */
router.patch('/:id/status', (0, validation_1.validateBody)(zod_1.z.object({
    status: zod_1.z.nativeEnum(types_1.ContentStatus)
})), async (req, res) => {
    try {
        const tenantId = req.tenantId || 'default';
        const content = await contentGenerator_1.contentGenerator.updateContentStatus(tenantId, req.params.id, req.body.status);
        if (!content) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Content not found'
                }
            });
            return;
        }
        res.json({
            success: true,
            data: content
        });
    }
    catch (error) {
        logger_1.logger.error('Update content status failed', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'UPDATE_FAILED',
                message: error instanceof Error ? error.message : 'Failed to update content status'
            }
        });
    }
});
//# sourceMappingURL=content.js.map