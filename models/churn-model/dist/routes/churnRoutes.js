"use strict";
/**
 * API Routes for HOJAI AI Churn Model Service
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const modelService_js_1 = require("../services/modelService.js");
const validation_js_1 = require("../utils/validation.js");
const logger_js_1 = require("../utils/logger.js");
const router = (0, express_1.Router)();
// Track service start time
const startTime = Date.now();
/**
 * POST /api/predict
 * Predict churn probability for a customer
 */
router.post('/predict', async (req, res) => {
    try {
        // Validate request body
        const parseResult = validation_js_1.churnPredictionRequestSchema.safeParse(req.body);
        if (!parseResult.success) {
            const error = {
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid request body',
                    details: parseResult.error.flatten(),
                },
            };
            logger_js_1.logger.warn('Prediction validation failed', { errors: parseResult.error.errors });
            return res.status(400).json(error);
        }
        const input = parseResult.data;
        // Make prediction
        const prediction = modelService_js_1.churnModelService.predict(input);
        const response = res.status(200).json(prediction);
        logger_js_1.logger.info('Prediction successful', { customerId: input.customerId });
        return response;
    }
    catch (error) {
        logger_js_1.logger.error('Prediction failed', { error });
        const errorResponse = {
            error: {
                code: 'PREDICTION_ERROR',
                message: 'Failed to make prediction',
                details: error instanceof Error ? { message: error.message } : undefined,
            },
        };
        return res.status(500).json(errorResponse);
    }
});
/**
 * POST /api/train
 * Train the model with new data
 */
router.post('/train', async (req, res) => {
    try {
        // Validate request body
        const parseResult = validation_js_1.batchTrainRequestSchema.safeParse(req.body);
        if (!parseResult.success) {
            const error = {
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid request body',
                    details: parseResult.error.flatten(),
                },
            };
            logger_js_1.logger.warn('Training validation failed', { errors: parseResult.error.errors });
            return res.status(400).json(error);
        }
        const input = parseResult.data;
        // Train model
        const result = await modelService_js_1.churnModelService.train(input.samples);
        const response = res.status(200).json(result);
        logger_js_1.logger.info('Training successful', {
            modelId: result.modelId,
            samples: input.samples.length,
        });
        return response;
    }
    catch (error) {
        logger_js_1.logger.error('Training failed', { error });
        const errorResponse = {
            error: {
                code: 'TRAINING_ERROR',
                message: 'Failed to train model',
                details: error instanceof Error ? { message: error.message } : undefined,
            },
        };
        return res.status(500).json(errorResponse);
    }
});
/**
 * GET /api/model/:id
 * Get model information
 */
router.get('/model/:id', (req, res) => {
    try {
        // Validate model ID
        const parseResult = validation_js_1.modelIdSchema.safeParse(req.params);
        if (!parseResult.success) {
            const error = {
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid model ID',
                    details: parseResult.error.flatten(),
                },
            };
            return res.status(400).json(error);
        }
        const { id } = parseResult.data;
        // Get model info
        const modelInfo = modelService_js_1.churnModelService.getModelInfo(id);
        return res.status(200).json(modelInfo);
    }
    catch (error) {
        logger_js_1.logger.error('Get model info failed', { error });
        const errorResponse = {
            error: {
                code: 'MODEL_ERROR',
                message: 'Failed to get model information',
                details: error instanceof Error ? { message: error.message } : undefined,
            },
        };
        return res.status(500).json(errorResponse);
    }
});
/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (_req, res) => {
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
    const health = {
        status: 'healthy',
        service: 'hojai-churn-model',
        version: modelService_js_1.churnModelService.getModelVersion(),
        uptime: uptimeSeconds,
        timestamp: new Date().toISOString(),
        checks: {
            memory: true, // Would check process memory in production
            model: true, // Model is always available
        },
    };
    return res.status(200).json(health);
});
exports.default = router;
//# sourceMappingURL=churnRoutes.js.map