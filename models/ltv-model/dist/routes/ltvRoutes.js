/**
 * API Routes for HOJAI AI LTV Model Service
 */
import { Router } from 'express';
import { ltvModelService } from '../services/modelService.js';
import { ltvPredictionRequestSchema, ltvBatchTrainRequestSchema, modelIdSchema, } from '../utils/validation.js';
import { logger } from '../utils/logger.js';
const router = Router();
// Track service start time
const startTime = Date.now();
/**
 * POST /api/predict
 * Predict LTV for a customer
 */
router.post('/predict', async (req, res) => {
    try {
        // Validate request body
        const parseResult = ltvPredictionRequestSchema.safeParse(req.body);
        if (!parseResult.success) {
            const error = {
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid request body',
                    details: parseResult.error.flatten(),
                },
            };
            logger.warn('Prediction validation failed', { errors: parseResult.error.errors });
            return res.status(400).json(error);
        }
        const input = parseResult.data;
        // Make prediction
        const prediction = ltvModelService.predict(input);
        logger.info('Prediction successful', { customerId: input.customerId });
        return res.status(200).json(prediction);
    }
    catch (error) {
        logger.error('Prediction failed', { error });
        const errorResponse = {
            error: {
                code: 'PREDICTION_ERROR',
                message: 'Failed to make LTV prediction',
                details: error instanceof Error ? { message: error.message } : undefined,
            },
        };
        return res.status(500).json(errorResponse);
    }
});
/**
 * POST /api/train
 * Train the LTV model with new data
 */
router.post('/train', async (req, res) => {
    try {
        // Validate request body
        const parseResult = ltvBatchTrainRequestSchema.safeParse(req.body);
        if (!parseResult.success) {
            const error = {
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid request body',
                    details: parseResult.error.flatten(),
                },
            };
            logger.warn('Training validation failed', { errors: parseResult.error.errors });
            return res.status(400).json(error);
        }
        const input = parseResult.data;
        // Train model
        const result = await ltvModelService.train(input.samples);
        logger.info('Training successful', {
            modelId: result.modelId,
            samples: input.samples.length,
        });
        return res.status(200).json(result);
    }
    catch (error) {
        logger.error('Training failed', { error });
        const errorResponse = {
            error: {
                code: 'TRAINING_ERROR',
                message: 'Failed to train LTV model',
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
        const parseResult = modelIdSchema.safeParse(req.params);
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
        const modelInfo = ltvModelService.getModelInfo(id);
        return res.status(200).json(modelInfo);
    }
    catch (error) {
        logger.error('Get model info failed', { error });
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
        service: 'hojai-ltv-model',
        version: ltvModelService.getModelVersion(),
        uptime: uptimeSeconds,
        timestamp: new Date().toISOString(),
        checks: {
            memory: true, // Would check process memory in production
            model: true, // Model is always available
        },
    };
    return res.status(200).json(health);
});
export default router;
//# sourceMappingURL=ltvRoutes.js.map