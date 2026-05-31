"use strict";
/**
 * HOJAI AI Recommendation Engine - API Routes
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const recommendationService_js_1 = require("../services/recommendationService.js");
const dataStore_js_1 = require("../services/dataStore.js");
const logger_js_1 = require("../utils/logger.js");
// Create router
const router = (0, express_1.Router)();
// Request validation schemas
const recommendationRequestSchema = zod_1.z.object({
    userId: zod_1.z.string().optional(),
    productId: zod_1.z.string().optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).optional().default(10),
    type: zod_1.z.enum(['personalized', 'trending', 'similar', 'frequently-bought']).optional().default('personalized'),
});
const similarItemsRequestSchema = zod_1.z.object({
    productId: zod_1.z.string().min(1, 'productId is required'),
    limit: zod_1.z.coerce.number().int().min(1).max(50).optional().default(10),
});
const trendingRequestSchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().min(1).max(50).optional().default(10),
    category: zod_1.z.string().optional(),
    timeframe: zod_1.z.coerce.number().int().min(1).max(30).optional().default(7),
});
const purchaseRequestSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1, 'userId is required'),
    productId: zod_1.z.string().min(1, 'productId is required'),
    quantity: zod_1.z.coerce.number().int().min(1).optional().default(1),
});
/**
 * POST /api/recommend
 * Get recommendations based on request parameters
 */
router.post('/recommend', async (req, res, next) => {
    try {
        const validation = recommendationRequestSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: validation.error.errors.map(e => e.message).join(', '),
                },
                timestamp: new Date().toISOString(),
            });
            return;
        }
        const { userId, productId, limit, type } = validation.data;
        const items = await (0, recommendationService_js_1.getRecommendationsByType)(type, userId, productId, limit);
        const response = {
            items,
            type: type,
            generatedAt: new Date().toISOString(),
        };
        logger_js_1.logger.info(`Generated ${items.length} recommendations of type ${type}`);
        res.json({
            success: true,
            data: response,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/recommend/:userId
 * Get personalized recommendations for a specific user
 */
router.get('/recommend/:userId', async (req, res, next) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit, 10) || 10;
        const type = req.query.type || 'personalized';
        if (!userId) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'userId is required',
                },
                timestamp: new Date().toISOString(),
            });
            return;
        }
        let items;
        if (type === 'trending') {
            items = await (0, recommendationService_js_1.getTrendingRecommendations)(limit);
        }
        else if (type === 'personalized') {
            items = await (0, recommendationService_js_1.getPersonalizedRecommendations)(userId, limit);
        }
        else {
            items = await (0, recommendationService_js_1.getRecommendationsByType)(type, userId, undefined, limit);
        }
        const response = {
            items,
            type,
            generatedAt: new Date().toISOString(),
        };
        res.json({
            success: true,
            data: response,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/trending
 * Get trending items
 */
router.get('/trending', async (req, res, next) => {
    try {
        const validation = trendingRequestSchema.safeParse(req.query);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: validation.error.errors.map(e => e.message).join(', '),
                },
                timestamp: new Date().toISOString(),
            });
            return;
        }
        const { limit, category } = validation.data;
        const items = await (0, recommendationService_js_1.getTrendingRecommendations)(limit, category);
        const response = {
            items,
            type: 'trending',
            generatedAt: new Date().toISOString(),
        };
        res.json({
            success: true,
            data: response,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/similar
 * Get similar items for a product
 */
router.post('/similar', async (req, res, next) => {
    try {
        const validation = similarItemsRequestSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: validation.error.errors.map(e => e.message).join(', '),
                },
                timestamp: new Date().toISOString(),
            });
            return;
        }
        const { productId, limit } = validation.data;
        const items = await (0, recommendationService_js_1.getSimilarItems)(productId, limit);
        const response = {
            items,
            type: 'similar',
            generatedAt: new Date().toISOString(),
        };
        res.json({
            success: true,
            data: response,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/purchase
 * Record a purchase (for training the recommendation model)
 */
router.post('/purchase', async (req, res, next) => {
    try {
        const validation = purchaseRequestSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: validation.error.errors.map(e => e.message).join(', '),
                },
                timestamp: new Date().toISOString(),
            });
            return;
        }
        const { userId, productId, quantity } = validation.data;
        (0, recommendationService_js_1.recordUserPurchase)(userId, productId, quantity);
        res.json({
            success: true,
            data: {
                message: 'Purchase recorded successfully',
                userId,
                productId,
                quantity,
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/stats
 * Get data store statistics
 */
router.get('/stats', (_req, res) => {
    const stats = (0, dataStore_js_1.getDataStats)();
    res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
    });
});
/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (_req, res) => {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const health = {
        status: 'healthy',
        version: '1.0.0',
        uptime: Math.floor(uptime),
        timestamp: new Date().toISOString(),
        checks: {
            memory: memoryUsage.heapUsed < memoryUsage.heapTotal * 0.9,
            data: true,
        },
    };
    // Mark as unhealthy if memory is critically low
    if (memoryUsage.heapUsed > memoryUsage.heapTotal * 0.9) {
        health.status = 'unhealthy';
    }
    res.status(health.status === 'healthy' ? 200 : 503).json(health);
});
exports.default = router;
//# sourceMappingURL=recommendationRoutes.js.map