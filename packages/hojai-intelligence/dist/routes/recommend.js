"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const recommendService_js_1 = require("../services/recommendService.js");
const router = express_1.default.Router();
/**
 * GET /api/recommend/:userId
 * Get recommendations for a user
 */
router.get('/:userId', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({ success: false, error: 'Tenant ID required' });
            return;
        }
        const recommendations = await recommendService_js_1.recommendService.getRecommendations({
            tenantId,
            userId: req.params.userId,
            limit: req.query.limit ? parseInt(req.query.limit) : 10
        });
        res.json({ success: true, data: recommendations });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/recommend/:userId/similar/:productId
 * Get similar items
 */
router.get('/:userId/similar/:productId', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({ success: false, error: 'Tenant ID required' });
            return;
        }
        const recommendations = await recommendService_js_1.recommendService.getSimilarItems({
            tenantId,
            userId: req.params.userId,
            productId: req.params.productId,
            limit: req.query.limit ? parseInt(req.query.limit) : 5
        });
        res.json({ success: true, data: recommendations });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/recommend/:userId/trending
 * Get trending items
 */
router.get('/:userId/trending', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({ success: false, error: 'Tenant ID required' });
            return;
        }
        const recommendations = await recommendService_js_1.recommendService.getTrending({
            tenantId,
            userId: req.params.userId,
            limit: req.query.limit ? parseInt(req.query.limit) : 10
        });
        res.json({ success: true, data: recommendations });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/recommend/:userId/offers
 * Get personalized offers
 */
router.get('/:userId/offers', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({ success: false, error: 'Tenant ID required' });
            return;
        }
        const recommendations = await recommendService_js_1.recommendService.getOffers({
            tenantId,
            userId: req.params.userId,
            limit: req.query.limit ? parseInt(req.query.limit) : 5
        });
        res.json({ success: true, data: recommendations });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/recommend/:userId/track/impression
 * Track recommendation impression
 */
router.post('/:userId/track/impression', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({ success: false, error: 'Tenant ID required' });
            return;
        }
        const { recommendationId } = req.body;
        if (!recommendationId) {
            res.status(400).json({ success: false, error: 'recommendationId required' });
            return;
        }
        await recommendService_js_1.recommendService.trackImpression({ tenantId, recommendationId });
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/recommend/:userId/track/click
 * Track recommendation click
 */
router.post('/:userId/track/click', async (req, res, next) => {
    try {
        const tenantId = req.headers['x-tenant-id'];
        if (!tenantId) {
            res.status(400).json({ success: false, error: 'Tenant ID required' });
            return;
        }
        const { recommendationId } = req.body;
        if (!recommendationId) {
            res.status(400).json({ success: false, error: 'recommendationId required' });
            return;
        }
        await recommendService_js_1.recommendService.trackClick({ tenantId, recommendationId });
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=recommend.js.map