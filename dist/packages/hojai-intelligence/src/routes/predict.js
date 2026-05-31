import express from 'express';
import { predictService } from '../services/predictService.js';
const router = express.Router();
// ============================================================================
// PREDICTION ROUTES
// ============================================================================
/**
 * GET /api/predict/:userId/churn
 * Get churn prediction for a user
 */
router.get('/:userId/churn', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({ success: false, error: 'Tenant ID required' });
            return;
        }
        const prediction = await predictService.predictChurn({
            tenantId,
            userId: req.params.userId,
            features: req.query.features
        });
        res.json({ success: true, data: prediction });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/predict/:userId/ltv
 * Get LTV prediction for a user
 */
router.get('/:userId/ltv', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({ success: false, error: 'Tenant ID required' });
            return;
        }
        const prediction = await predictService.predictLTV({
            tenantId,
            userId: req.params.userId,
            features: req.query.features,
            timeframe: req.query.timeframe ? parseInt(req.query.timeframe) : undefined
        });
        res.json({ success: true, data: prediction });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/predict/:userId/revisit
 * Get revisit prediction for a user
 */
router.get('/:userId/revisit', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({ success: false, error: 'Tenant ID required' });
            return;
        }
        const prediction = await predictService.predictRevisit({
            tenantId,
            userId: req.params.userId,
            features: req.query.features
        });
        res.json({ success: true, data: prediction });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/predict/:userId/all
 * Get all predictions for a user
 */
router.get('/:userId/all', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({ success: false, error: 'Tenant ID required' });
            return;
        }
        const predictions = await predictService.getAllPredictions({
            tenantId,
            userId: req.params.userId,
            features: req.query.features
        });
        res.json({ success: true, data: predictions });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/predict/at-risk
 * Get at-risk users
 */
router.get('/segments/at-risk', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({ success: false, error: 'Tenant ID required' });
            return;
        }
        const limit = req.query.limit ? parseInt(req.query.limit) : 100;
        const predictions = await predictService.getAtRiskUsers(tenantId, limit);
        res.json({ success: true, data: predictions });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/predict/high-value
 * Get high-value users
 */
router.get('/segments/high-value', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({ success: false, error: 'Tenant ID required' });
            return;
        }
        const limit = req.query.limit ? parseInt(req.query.limit) : 100;
        const predictions = await predictService.getHighValueUsers(tenantId, limit);
        res.json({ success: true, data: predictions });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=predict.js.map