"use strict";
// ============================================
// HOJAI AI - Marketing Agent Ad Copy Routes
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.adRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const adCopier_1 = require("../services/adCopier");
const validation_1 = require("../utils/validation");
const logger_1 = require("../utils/logger");
const types_1 = require("../types");
const router = (0, express_1.Router)();
exports.adRoutes = router;
// Validation schemas
const GenerateAdCopySchema = zod_1.z.object({
    adType: zod_1.z.nativeEnum(types_1.AdType),
    productName: zod_1.z.string().min(1).max(200),
    productDescription: zod_1.z.string().max(2000).optional(),
    targetAudience: zod_1.z.string().optional(),
    headlineOptions: zod_1.z.number().min(1).max(10).default(3),
    descriptionOptions: zod_1.z.number().min(1).max(5).default(2),
    cta: zod_1.z.string().max(30).optional(),
    keywords: zod_1.z.array(zod_1.z.string()).optional(),
    platform: zod_1.z.nativeEnum(types_1.SocialPlatform).optional()
});
const GenerateABVariationsSchema = zod_1.z.object({
    adType: zod_1.z.nativeEnum(types_1.AdType),
    productName: zod_1.z.string().min(1).max(200),
    productDescription: zod_1.z.string().max(2000).optional(),
    targetAudience: zod_1.z.string().optional(),
    variations: zod_1.z.number().min(2).max(10).default(3)
});
const DuplicateAdCopySchema = zod_1.z.object({
    newPlatform: zod_1.z.nativeEnum(types_1.SocialPlatform)
});
const ListAdCopiesSchema = validation_1.PaginationSchema.extend({
    adType: zod_1.z.enum(['search', 'display', 'social', 'video', 'native', 'search_generation']).optional(),
    platform: zod_1.z.enum(['twitter', 'linkedin', 'facebook', 'instagram', 'youtube', 'tiktok', 'threads', 'reddit']).optional()
}).omit({ sort: true, sortBy: true });
/**
 * POST /api/ads/copy
 * Generate ad copy
 */
router.post('/copy', (0, validation_1.validateBody)(GenerateAdCopySchema), async (req, res) => {
    try {
        const tenantId = req.tenantId || 'default';
        const result = await adCopier_1.adCopier.generateAdCopy(tenantId, {
            adType: req.body.adType,
            productName: req.body.productName,
            productDescription: req.body.productDescription,
            targetAudience: req.body.targetAudience,
            headlineOptions: req.body.headlineOptions,
            descriptionOptions: req.body.descriptionOptions,
            cta: req.body.cta,
            keywords: req.body.keywords,
            platform: req.body.platform
        });
        logger_1.logger.info('Ad copy generated', { tenantId, adType: req.body.adType, product: req.body.productName });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.logger.error('Generate ad copy failed', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'GENERATION_FAILED',
                message: error instanceof Error ? error.message : 'Failed to generate ad copy'
            }
        });
    }
});
/**
 * POST /api/ads/ab-variations
 * Generate A/B test variations
 */
router.post('/ab-variations', (0, validation_1.validateBody)(GenerateABVariationsSchema), async (req, res) => {
    try {
        const tenantId = req.tenantId || 'default';
        const variations = await adCopier_1.adCopier.generateABVariations(tenantId, {
            adType: req.body.adType,
            productName: req.body.productName,
            productDescription: req.body.productDescription,
            targetAudience: req.body.targetAudience,
            variations: req.body.variations
        });
        logger_1.logger.info('A/B variations generated', { tenantId, variations: variations.length });
        res.json({
            success: true,
            data: { variations }
        });
    }
    catch (error) {
        logger_1.logger.error('Generate A/B variations failed', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'GENERATION_FAILED',
                message: error instanceof Error ? error.message : 'Failed to generate variations'
            }
        });
    }
});
/**
 * GET /api/ads/copies
 * List ad copies
 */
router.get('/copies', (0, validation_1.validateBody)(ListAdCopiesSchema), async (req, res) => {
    try {
        const tenantId = req.tenantId || 'default';
        const pagination = (0, validation_1.getPaginationOptions)(req.body);
        const result = await adCopier_1.adCopier.listAdCopies(tenantId, {
            adType: req.body.adType,
            platform: req.body.platform,
            limit: pagination.limit,
            offset: pagination.skip
        });
        res.json((0, validation_1.formatPaginatedResponse)(result.items, result.total, (req.body.page || 1), (req.body.limit || 20)));
    }
    catch (error) {
        logger_1.logger.error('List ad copies failed', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'LIST_FAILED',
                message: error instanceof Error ? error.message : 'Failed to list ad copies'
            }
        });
    }
});
/**
 * GET /api/ads/copies/:id
 * Get ad copy by ID
 */
router.get('/copies/:id', async (req, res) => {
    try {
        const tenantId = req.tenantId || 'default';
        const adCopy = await adCopier_1.adCopier.getAdCopy(tenantId, req.params.id);
        if (!adCopy) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Ad copy not found'
                }
            });
            return;
        }
        res.json({
            success: true,
            data: adCopy
        });
    }
    catch (error) {
        logger_1.logger.error('Get ad copy failed', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'GET_FAILED',
                message: error instanceof Error ? error.message : 'Failed to get ad copy'
            }
        });
    }
});
/**
 * POST /api/ads/copies/:id/duplicate
 * Duplicate ad copy for new platform
 */
router.post('/copies/:id/duplicate', (0, validation_1.validateBody)(DuplicateAdCopySchema), async (req, res) => {
    try {
        const tenantId = req.tenantId || 'default';
        const duplicated = await adCopier_1.adCopier.duplicateAdCopy(tenantId, req.params.id, req.body.newPlatform);
        if (!duplicated) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Original ad copy not found'
                }
            });
            return;
        }
        logger_1.logger.info('Ad copy duplicated', { tenantId, originalId: req.params.id, newPlatform: req.body.newPlatform });
        res.json({
            success: true,
            data: duplicated
        });
    }
    catch (error) {
        logger_1.logger.error('Duplicate ad copy failed', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'DUPLICATE_FAILED',
                message: error instanceof Error ? error.message : 'Failed to duplicate ad copy'
            }
        });
    }
});
/**
 * GET /api/ads/platform/:platform
 * Get ad copies for specific platform
 */
router.get('/platform/:platform', async (req, res) => {
    try {
        const tenantId = req.tenantId || 'default';
        const platform = req.params.platform;
        // Validate platform
        if (!Object.values(types_1.SocialPlatform).includes(platform)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PLATFORM',
                    message: 'Invalid social platform'
                }
            });
            return;
        }
        const adCopies = await adCopier_1.adCopier.getPlatformAdCopy(tenantId, platform);
        res.json({
            success: true,
            data: { adCopies }
        });
    }
    catch (error) {
        logger_1.logger.error('Get platform ad copies failed', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'GET_FAILED',
                message: error instanceof Error ? error.message : 'Failed to get platform ad copies'
            }
        });
    }
});
//# sourceMappingURL=ads.js.map