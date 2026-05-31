/**
 * Prediction Routes
 */
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { predictionStore, predictChurn, predictLTV, predictIntent, predictPropensity, predictRevisit, predictConversion } from '../index.js';
const router = Router();
// ============================================
// HELPERS
// ============================================
function createResponse(data, tenantId) {
    return {
        success: true,
        data,
        meta: { timestamp: new Date().toISOString(), requestId: `req_${Date.now()}`, tenantId }
    };
}
function createErrorResponse(code, message) {
    return {
        success: false,
        error: { code, message },
        meta: { timestamp: new Date().toISOString(), requestId: `req_${Date.now()}` }
    };
}
/**
 * POST /predictions/churn
 * Predict customer churn risk
 */
router.post('/churn', (req, res) => {
    const ctx = req.tenantContext;
    const { userId, features } = req.body;
    if (!features) {
        return res.status(400).json(createErrorResponse('INVALID_REQUEST', 'features required'));
    }
    const { score, confidence } = predictChurn(features);
    const prediction = {
        id: uuidv4(),
        tenantId: ctx.tenant_id,
        userId,
        type: 'churn',
        model: 'hojai-churn-v1',
        score,
        confidence,
        features,
        prediction: { churnRisk: score > 0.7 ? 'high' : score > 0.4 ? 'medium' : 'low' },
        createdAt: new Date().toISOString()
    };
    const predictions = predictionStore.get(ctx.tenant_id) || [];
    predictions.push(prediction);
    predictionStore.set(ctx.tenant_id, predictions);
    res.status(201).json(createResponse({ prediction }, ctx.tenant_id));
});
/**
 * POST /predictions/ltv
 * Predict customer lifetime value
 */
router.post('/ltv', (req, res) => {
    const ctx = req.tenantContext;
    const { userId, features } = req.body;
    if (!features) {
        return res.status(400).json(createErrorResponse('INVALID_REQUEST', 'features required'));
    }
    const { score, confidence } = predictLTV(features);
    const prediction = {
        id: uuidv4(),
        tenantId: ctx.tenant_id,
        userId,
        type: 'ltv',
        model: 'hojai-ltv-v1',
        score,
        confidence,
        features,
        prediction: { estimatedLTV: score * 50000 },
        createdAt: new Date().toISOString()
    };
    const predictions = predictionStore.get(ctx.tenant_id) || [];
    predictions.push(prediction);
    predictionStore.set(ctx.tenant_id, predictions);
    res.status(201).json(createResponse({ prediction }, ctx.tenant_id));
});
/**
 * POST /predictions/intent
 * Detect user intent
 */
router.post('/intent', (req, res) => {
    const ctx = req.tenantContext;
    const { userId, features } = req.body;
    if (!features) {
        return res.status(400).json(createErrorResponse('INVALID_REQUEST', 'features required'));
    }
    const { score, confidence, intent } = predictIntent(features);
    const prediction = {
        id: uuidv4(),
        tenantId: ctx.tenant_id,
        userId,
        type: 'intent',
        model: 'hojai-intent-v1',
        score,
        confidence,
        features,
        prediction: { intent, score },
        createdAt: new Date().toISOString()
    };
    const predictions = predictionStore.get(ctx.tenant_id) || [];
    predictions.push(prediction);
    predictionStore.set(ctx.tenant_id, predictions);
    res.status(201).json(createResponse({ prediction }, ctx.tenant_id));
});
/**
 * POST /predictions/propensity
 * Calculate propensity score
 */
router.post('/propensity', (req, res) => {
    const ctx = req.tenantContext;
    const { userId, features } = req.body;
    if (!features) {
        return res.status(400).json(createErrorResponse('INVALID_REQUEST', 'features required'));
    }
    const { score, confidence } = predictPropensity(features);
    const prediction = {
        id: uuidv4(),
        tenantId: ctx.tenant_id,
        userId,
        type: 'propensity',
        model: 'hojai-propensity-v1',
        score,
        confidence,
        features,
        prediction: { propensityScore: score },
        createdAt: new Date().toISOString()
    };
    const predictions = predictionStore.get(ctx.tenant_id) || [];
    predictions.push(prediction);
    predictionStore.set(ctx.tenant_id, predictions);
    res.status(201).json(createResponse({ prediction }, ctx.tenant_id));
});
/**
 * POST /predictions/revisit
 * Predict revisit probability
 */
router.post('/revisit', (req, res) => {
    const ctx = req.tenantContext;
    const { userId, features } = req.body;
    if (!features) {
        return res.status(400).json(createErrorResponse('INVALID_REQUEST', 'features required'));
    }
    const { score, confidence, days } = predictRevisit(features);
    const prediction = {
        id: uuidv4(),
        tenantId: ctx.tenant_id,
        userId,
        type: 'revisit',
        model: 'hojai-revisit-v1',
        score,
        confidence,
        features,
        prediction: { revisitProbability: score, expectedDaysToRevisit: days },
        createdAt: new Date().toISOString()
    };
    const predictions = predictionStore.get(ctx.tenant_id) || [];
    predictions.push(prediction);
    predictionStore.set(ctx.tenant_id, predictions);
    res.status(201).json(createResponse({ prediction }, ctx.tenant_id));
});
/**
 * POST /predictions/conversion
 * Predict conversion probability
 */
router.post('/conversion', (req, res) => {
    const ctx = req.tenantContext;
    const { userId, features } = req.body;
    if (!features) {
        return res.status(400).json(createErrorResponse('INVALID_REQUEST', 'features required'));
    }
    const { score, confidence } = predictConversion(features);
    const prediction = {
        id: uuidv4(),
        tenantId: ctx.tenant_id,
        userId,
        type: 'conversion',
        model: 'hojai-conversion-v1',
        score,
        confidence,
        features,
        prediction: { conversionProbability: score },
        createdAt: new Date().toISOString()
    };
    const predictions = predictionStore.get(ctx.tenant_id) || [];
    predictions.push(prediction);
    predictionStore.set(ctx.tenant_id, predictions);
    res.status(201).json(createResponse({ prediction }, ctx.tenant_id));
});
/**
 * POST /predictions/batch
 * Run batch predictions
 */
router.post('/batch', (req, res) => {
    const ctx = req.tenantContext;
    const { predictions: batch } = req.body;
    if (!Array.isArray(batch)) {
        return res.status(400).json(createErrorResponse('INVALID_REQUEST', 'predictions array required'));
    }
    const results = [];
    const predictions = predictionStore.get(ctx.tenant_id) || [];
    for (const item of batch) {
        const { userId, type, features } = item;
        let result;
        switch (type) {
            case 'churn':
                result = predictChurn(features);
                break;
            case 'ltv':
                result = predictLTV(features);
                break;
            case 'intent':
                result = predictIntent(features);
                break;
            case 'propensity':
                result = predictPropensity(features);
                break;
            case 'revisit':
                result = predictRevisit(features);
                break;
            case 'conversion':
                result = predictConversion(features);
                break;
            default:
                continue;
        }
        const prediction = {
            id: uuidv4(),
            tenantId: ctx.tenant_id,
            userId,
            type,
            model: `hojai-${type}-v1`,
            score: result.score,
            confidence: result.confidence,
            features,
            prediction: result,
            createdAt: new Date().toISOString()
        };
        predictions.push(prediction);
        results.push(prediction);
    }
    predictionStore.set(ctx.tenant_id, predictions);
    res.status(201).json(createResponse({ predictions: results, count: results.length }, ctx.tenant_id));
});
/**
 * GET /predictions
 * Get predictions
 */
router.get('/', (req, res) => {
    const ctx = req.tenantContext;
    const { userId, type, limit = 50 } = req.query;
    let predictions = predictionStore.get(ctx.tenant_id) || [];
    if (userId) {
        predictions = predictions.filter(p => p.userId === userId);
    }
    if (type) {
        predictions = predictions.filter(p => p.type === type);
    }
    predictions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(createResponse({
        predictions: predictions.slice(0, Number(limit)),
        total: predictions.length
    }, ctx.tenant_id));
});
/**
 * GET /predictions/:id
 * Get prediction by ID
 */
router.get('/:id', (req, res) => {
    const ctx = req.tenantContext;
    const { id } = req.params;
    const predictions = predictionStore.get(ctx.tenant_id) || [];
    const prediction = predictions.find(p => p.id === id);
    if (!prediction) {
        return res.status(404).json(createErrorResponse('NOT_FOUND', `Prediction ${id} not found`));
    }
    res.json(createResponse({ prediction }, ctx.tenant_id));
});
/**
 * GET /predictions/types
 * Get available prediction types
 */
router.get('/meta/types', (req, res) => {
    const types = [
        { type: 'churn', name: 'Churn Prediction', description: 'Predict customer churn risk' },
        { type: 'ltv', name: 'LTV Prediction', description: 'Estimate customer lifetime value' },
        { type: 'intent', name: 'Intent Detection', description: 'Detect user purchase intent' },
        { type: 'propensity', name: 'Propensity Score', description: 'Calculate engagement propensity' },
        { type: 'revisit', name: 'Revisit Prediction', description: 'Predict customer return likelihood' },
        { type: 'conversion', name: 'Conversion Prediction', description: 'Predict conversion probability' }
    ];
    res.json(createResponse({ types }));
});
export { router as predictionRoutes };
//# sourceMappingURL=predictions.js.map