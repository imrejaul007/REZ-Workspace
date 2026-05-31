"use strict";
// ============================================
// HOJAI AI - Marketing Agent SEO Routes
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.seoRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const seoOptimizer_1 = require("../services/seoOptimizer");
const validation_1 = require("../utils/validation");
const logger_1 = require("../utils/logger");
const types_1 = require("../types");
const router = (0, express_1.Router)();
exports.seoRoutes = router;
// Validation schemas
const OptimizeSchema = zod_1.z.object({
    url: zod_1.z.string().url().optional(),
    content: zod_1.z.string().min(1).max(50000).optional(),
    type: zod_1.z.nativeEnum(types_1.SEOContentType).default(types_1.SEOContentType.BLOG),
    targetKeywords: zod_1.z.array(zod_1.z.string()).min(1),
    competitorUrls: zod_1.z.array(zod_1.z.string().url()).optional(),
    metaTitle: zod_1.z.string().max(60).optional(),
    metaDescription: zod_1.z.string().max(160).optional()
});
const ListOptimizationsSchema = validation_1.PaginationSchema.extend({
    type: zod_1.z.enum(['blog', 'landing_page', 'product_page', 'category_page', 'faq']).optional()
}).omit({ sort: true, sortBy: true });
/**
 * POST /api/seo/optimize
 * Optimize content for SEO
 */
router.post('/optimize', (0, validation_1.validateBody)(OptimizeSchema), async (req, res) => {
    try {
        const tenantId = req.tenantId || 'default';
        const result = await seoOptimizer_1.seoOptimizer.optimize(tenantId, {
            url: req.body.url,
            content: req.body.content,
            type: req.body.type,
            targetKeywords: req.body.targetKeywords,
            competitorUrls: req.body.competitorUrls,
            metaTitle: req.body.metaTitle,
            metaDescription: req.body.metaDescription
        });
        logger_1.logger.info('SEO optimization complete', { tenantId, keywords: req.body.targetKeywords });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        logger_1.logger.error('SEO optimization failed', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'OPTIMIZATION_FAILED',
                message: error instanceof Error ? error.message : 'SEO optimization failed'
            }
        });
    }
});
/**
 * GET /api/seo/optimizations
 * List SEO optimizations
 */
router.get('/optimizations', (0, validation_1.validateBody)(ListOptimizationsSchema), async (req, res) => {
    try {
        const tenantId = req.tenantId || 'default';
        const pagination = (0, validation_1.getPaginationOptions)(req.body);
        const result = await seoOptimizer_1.seoOptimizer.listOptimizations(tenantId, {
            type: req.body.type,
            limit: pagination.limit,
            offset: pagination.skip
        });
        res.json((0, validation_1.formatPaginatedResponse)(result.items, result.total, (req.body.page || 1), (req.body.limit || 20)));
    }
    catch (error) {
        logger_1.logger.error('List optimizations failed', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'LIST_FAILED',
                message: error instanceof Error ? error.message : 'Failed to list optimizations'
            }
        });
    }
});
/**
 * GET /api/seo/optimizations/:id
 * Get optimization by ID
 */
router.get('/optimizations/:id', async (req, res) => {
    try {
        const tenantId = req.tenantId || 'default';
        const optimizations = await seoOptimizer_1.seoOptimizer.listOptimizations(tenantId, {
            limit: 1
        });
        const optimization = optimizations.items.find(o => o.id === req.params.id);
        if (!optimization) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Optimization not found'
                }
            });
            return;
        }
        res.json({
            success: true,
            data: optimization
        });
    }
    catch (error) {
        logger_1.logger.error('Get optimization failed', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'GET_FAILED',
                message: error instanceof Error ? error.message : 'Failed to get optimization'
            }
        });
    }
});
/**
 * POST /api/seo/analyze-url
 * Analyze URL for SEO
 */
router.post('/analyze-url', (0, validation_1.validateBody)(zod_1.z.object({
    url: zod_1.z.string().url()
})), async (req, res) => {
    try {
        const tenantId = req.tenantId || 'default';
        const optimization = await seoOptimizer_1.seoOptimizer.analyzeUrl(tenantId, req.body.url);
        if (!optimization) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'No optimization found for this URL'
                }
            });
            return;
        }
        res.json({
            success: true,
            data: optimization
        });
    }
    catch (error) {
        logger_1.logger.error('Analyze URL failed', { error });
        res.status(500).json({
            success: false,
            error: {
                code: 'ANALYZE_FAILED',
                message: error instanceof Error ? error.message : 'Failed to analyze URL'
            }
        });
    }
});
//# sourceMappingURL=seo.js.map