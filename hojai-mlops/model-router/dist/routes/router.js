"use strict";
/**
 * Hojai Model Router - Route Endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router_1 = require("../services/router");
const validators_1 = require("../validators");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
/**
 * POST /api/route - Route request to appropriate model
 */
router.post('/route', async (req, res, next) => {
    try {
        // Validate request body
        const validatedData = validators_1.routeRequestSchema.parse(req.body);
        const result = await router_1.modelRouterService.route({
            task: validatedData.task,
            input: validatedData.input,
            options: validatedData.options,
        });
        res.status(200).json({
            success: true,
            ...result,
        });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
            res.status(400).json({
                error: 'Validation Error',
                message: messages,
                statusCode: 400,
                timestamp: new Date().toISOString(),
            });
            return;
        }
        next(error);
    }
});
/**
 * POST /api/fallback - Handle fallback when primary fails
 */
router.post('/fallback', async (req, res, next) => {
    try {
        // Validate request body
        const validatedData = validators_1.fallbackRequestSchema.parse(req.body);
        const result = await router_1.modelRouterService.handleFallback({
            originalRequest: validatedData.originalRequest,
            failedProvider: validatedData.failedProvider,
            error: validatedData.error,
            attempt: validatedData.attempt,
        });
        res.status(200).json({
            success: true,
            ...result,
        });
    }
    catch (error) {
        if (error instanceof zod_1.ZodError) {
            const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
            res.status(400).json({
                error: 'Validation Error',
                message: messages,
                statusCode: 400,
                timestamp: new Date().toISOString(),
            });
            return;
        }
        next(error);
    }
});
/**
 * GET /api/providers - List available providers
 */
router.get('/providers', async (_req, res, next) => {
    try {
        const providers = router_1.modelRouterService.getProviders();
        res.status(200).json({
            success: true,
            providers,
            total: providers.length,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/costs - Get cost estimates
 */
router.get('/costs', async (req, res, next) => {
    try {
        const task = req.query['task'];
        const inputLength = parseInt(req.query['inputLength'] || '1000', 10);
        if (!task) {
            res.status(400).json({
                error: 'Validation Error',
                message: 'Query parameter "task" is required',
                statusCode: 400,
                timestamp: new Date().toISOString(),
            });
            return;
        }
        const estimates = router_1.modelRouterService.getCostEstimates(task, inputLength);
        res.status(200).json({
            success: true,
            estimates,
            currency: 'USD',
            inputLength,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/stats - Get router statistics
 */
router.get('/stats', async (_req, res, next) => {
    try {
        const stats = router_1.modelRouterService.getStats();
        res.status(200).json({
            success: true,
            ...stats,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/stats - Reset statistics
 */
router.delete('/stats', async (_req, res, next) => {
    try {
        router_1.modelRouterService.resetStats();
        res.status(200).json({
            success: true,
            message: 'Statistics reset successfully',
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=router.js.map