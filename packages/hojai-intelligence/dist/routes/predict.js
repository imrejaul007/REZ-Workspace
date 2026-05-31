"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const predictService_js_1 = require("../services/predictService.js");
const router = express_1.default.Router();
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
        const prediction = await predictService_js_1.predictService.predictChurn({
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
        const prediction = await predictService_js_1.predictService.predictLTV({
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
        const prediction = await predictService_js_1.predictService.predictRevisit({
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
        const predictions = await predictService_js_1.predictService.getAllPredictions({
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
        const predictions = await predictService_js_1.predictService.getAtRiskUsers(tenantId, limit);
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
        const predictions = await predictService_js_1.predictService.getHighValueUsers(tenantId, limit);
        res.json({ success: true, data: predictions });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=predict.js.map