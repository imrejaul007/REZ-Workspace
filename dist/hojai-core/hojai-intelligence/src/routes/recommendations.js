/**
 * Recommendation Routes
 */
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { recommendationStore, generateRecommendations } from '../index.js';
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
 * POST /recommendations/product
 * Get product recommendations
 */
router.post('/product', (req, res) => {
    const ctx = req.tenantContext;
    const { userId, context } = req.body;
    const items = generateRecommendations('product', userId || '', ctx.tenant_id, context);
    const recommendation = {
        id: uuidv4(),
        tenantId: ctx.tenant_id,
        userId,
        type: 'product',
        items,
        strategy: 'collaborative-filtering',
        metadata: { source: 'hojai-ml' },
        createdAt: new Date().toISOString()
    };
    const recommendations = recommendationStore.get(ctx.tenant_id) || [];
    recommendations.push(recommendation);
    recommendationStore.set(ctx.tenant_id, recommendations);
    res.status(201).json(createResponse({ recommendation }, ctx.tenant_id));
});
/**
 * POST /recommendations/content
 * Get content recommendations
 */
router.post('/content', (req, res) => {
    const ctx = req.tenantContext;
    const { userId, context } = req.body;
    const items = generateRecommendations('content', userId || '', ctx.tenant_id, context);
    const recommendation = {
        id: uuidv4(),
        tenantId: ctx.tenant_id,
        userId,
        type: 'content',
        items,
        strategy: 'interest-based',
        metadata: { source: 'hojai-ml' },
        createdAt: new Date().toISOString()
    };
    const recommendations = recommendationStore.get(ctx.tenant_id) || [];
    recommendations.push(recommendation);
    recommendationStore.set(ctx.tenant_id, recommendations);
    res.status(201).json(createResponse({ recommendation }, ctx.tenant_id));
});
/**
 * POST /recommendations/action
 * Get action recommendations
 */
router.post('/action', (req, res) => {
    const ctx = req.tenantContext;
    const { userId, context } = req.body;
    const items = generateRecommendations('action', userId || '', ctx.tenant_id, context);
    const recommendation = {
        id: uuidv4(),
        tenantId: ctx.tenant_id,
        userId,
        type: 'action',
        items,
        strategy: 'engagement-optimization',
        metadata: { source: 'hojai-ml' },
        createdAt: new Date().toISOString()
    };
    const recommendations = recommendationStore.get(ctx.tenant_id) || [];
    recommendations.push(recommendation);
    recommendationStore.set(ctx.tenant_id, recommendations);
    res.status(201).json(createResponse({ recommendation }, ctx.tenant_id));
});
/**
 * POST /recommendations/personalized
 * Get personalized recommendations
 */
router.post('/personalized', (req, res) => {
    const ctx = req.tenantContext;
    const { userId, types = ['product', 'content', 'action'], context } = req.body;
    const allItems = [];
    for (const type of types) {
        const items = generateRecommendations(type, userId || '', ctx.tenant_id, context);
        allItems.push(...items);
    }
    // Sort by score
    allItems.sort((a, b) => b.score - a.score);
    const recommendation = {
        id: uuidv4(),
        tenantId: ctx.tenant_id,
        userId,
        type: 'personalized',
        items: allItems.slice(0, 10),
        strategy: 'multi-channel-personalization',
        metadata: { source: 'hojai-ml', types },
        createdAt: new Date().toISOString()
    };
    const recommendations = recommendationStore.get(ctx.tenant_id) || [];
    recommendations.push(recommendation);
    recommendationStore.set(ctx.tenant_id, recommendations);
    res.status(201).json(createResponse({ recommendation }, ctx.tenant_id));
});
/**
 * GET /recommendations
 * Get recommendations
 */
router.get('/', (req, res) => {
    const ctx = req.tenantContext;
    const { userId, type, limit = 20 } = req.query;
    let recommendations = recommendationStore.get(ctx.tenant_id) || [];
    if (userId) {
        recommendations = recommendations.filter(r => r.userId === userId);
    }
    if (type) {
        recommendations = recommendations.filter(r => r.type === type);
    }
    recommendations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(createResponse({
        recommendations: recommendations.slice(0, Number(limit)),
        total: recommendations.length
    }, ctx.tenant_id));
});
/**
 * GET /recommendations/:id
 * Get recommendation by ID
 */
router.get('/:id', (req, res) => {
    const ctx = req.tenantContext;
    const { id } = req.params;
    const recommendations = recommendationStore.get(ctx.tenant_id) || [];
    const recommendation = recommendations.find(r => r.id === id);
    if (!recommendation) {
        return res.status(404).json(createErrorResponse('NOT_FOUND', `Recommendation ${id} not found`));
    }
    res.json(createResponse({ recommendation }, ctx.tenant_id));
});
/**
 * POST /recommendations/feedback
 * Record recommendation feedback
 */
router.post('/feedback', (req, res) => {
    const ctx = req.tenantContext;
    const { recommendationId, itemId, action, userId } = req.body;
    if (!recommendationId || !itemId || !action) {
        return res.status(400).json(createErrorResponse('INVALID_REQUEST', 'recommendationId, itemId, and action required'));
    }
    const feedback = {
        id: uuidv4(),
        tenantId: ctx.tenant_id,
        recommendationId,
        itemId,
        userId,
        action, // 'click', 'purchase', 'dismiss'
        timestamp: new Date().toISOString()
    };
    res.status(201).json(createResponse({ feedback }, ctx.tenant_id));
});
/**
 * GET /recommendations/strategies
 * Get available recommendation strategies
 */
router.get('/meta/strategies', (req, res) => {
    const strategies = [
        { id: 'collaborative-filtering', name: 'Collaborative Filtering', description: 'Based on similar users' },
        { id: 'content-based', name: 'Content Based', description: 'Based on item similarities' },
        { id: 'hybrid', name: 'Hybrid', description: 'Combines multiple approaches' },
        { id: 'interest-based', name: 'Interest Based', description: 'Based on user interests' },
        { id: 'engagement-optimization', name: 'Engagement Optimization', description: 'Maximizes engagement' },
        { id: 'multi-channel-personalization', name: 'Multi-Channel', description: 'Personalized across channels' }
    ];
    res.json(createResponse({ strategies }));
});
export { router as recommendationRoutes };
//# sourceMappingURL=recommendations.js.map