/**
 * Subscription Routes
 */
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { subscriptionStore } from '../index.js';
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
 * POST /subscriptions
 * Create a subscription
 */
router.post('/', (req, res) => {
    const ctx = req.tenantContext;
    const { name, eventType, eventPattern, handler, filter } = req.body;
    if (!name || (!eventType && !eventPattern) || !handler) {
        return res.status(400).json(createErrorResponse('INVALID_REQUEST', 'name, eventType/eventPattern, and handler required'));
    }
    const subscription = {
        id: uuidv4(),
        tenantId: ctx.tenant_id,
        name,
        eventType: eventType || '*',
        eventPattern,
        handler,
        filter,
        createdAt: new Date().toISOString(),
        active: true,
        stats: { received: 0, processed: 0, failed: 0 }
    };
    subscriptionStore.push(subscription);
    res.status(201).json(createResponse({ subscription }, ctx.tenant_id));
});
/**
 * GET /subscriptions
 * List subscriptions
 */
router.get('/', (req, res) => {
    const ctx = req.tenantContext;
    const { active, eventType } = req.query;
    let subscriptions = subscriptionStore.filter(s => s.tenantId === ctx.tenant_id);
    if (active !== undefined) {
        subscriptions = subscriptions.filter(s => s.active === (active === 'true'));
    }
    if (eventType) {
        subscriptions = subscriptions.filter(s => s.eventType === eventType);
    }
    res.json(createResponse({ subscriptions }, ctx.tenant_id));
});
/**
 * GET /subscriptions/:id
 * Get subscription by ID
 */
router.get('/:id', (req, res) => {
    const ctx = req.tenantContext;
    const { id } = req.params;
    const subscription = subscriptionStore.find(s => s.id === id && s.tenantId === ctx.tenant_id);
    if (!subscription) {
        return res.status(404).json(createErrorResponse('NOT_FOUND', `Subscription ${id} not found`));
    }
    res.json(createResponse({ subscription }, ctx.tenant_id));
});
/**
 * PUT /subscriptions/:id
 * Update subscription
 */
router.put('/:id', (req, res) => {
    const ctx = req.tenantContext;
    const { id } = req.params;
    const { name, handler, filter, active } = req.body;
    const subscription = subscriptionStore.find(s => s.id === id && s.tenantId === ctx.tenant_id);
    if (!subscription) {
        return res.status(404).json(createErrorResponse('NOT_FOUND', `Subscription ${id} not found`));
    }
    if (name !== undefined)
        subscription.name = name;
    if (handler !== undefined)
        subscription.handler = handler;
    if (filter !== undefined)
        subscription.filter = filter;
    if (active !== undefined)
        subscription.active = active;
    res.json(createResponse({ subscription }, ctx.tenant_id));
});
/**
 * DELETE /subscriptions/:id
 * Delete subscription
 */
router.delete('/:id', (req, res) => {
    const ctx = req.tenantContext;
    const { id } = req.params;
    const index = subscriptionStore.findIndex(s => s.id === id && s.tenantId === ctx.tenant_id);
    if (index === -1) {
        return res.status(404).json(createErrorResponse('NOT_FOUND', `Subscription ${id} not found`));
    }
    subscriptionStore.splice(index, 1);
    res.json(createResponse({ deleted: true }));
});
/**
 * POST /subscriptions/:id/pause
 * Pause subscription
 */
router.post('/:id/pause', (req, res) => {
    const ctx = req.tenantContext;
    const { id } = req.params;
    const subscription = subscriptionStore.find(s => s.id === id && s.tenantId === ctx.tenant_id);
    if (!subscription) {
        return res.status(404).json(createErrorResponse('NOT_FOUND', `Subscription ${id} not found`));
    }
    subscription.active = false;
    res.json(createResponse({ subscription }, ctx.tenant_id));
});
/**
 * POST /subscriptions/:id/resume
 * Resume subscription
 */
router.post('/:id/resume', (req, res) => {
    const ctx = req.tenantContext;
    const { id } = req.params;
    const subscription = subscriptionStore.find(s => s.id === id && s.tenantId === ctx.tenant_id);
    if (!subscription) {
        return res.status(404).json(createErrorResponse('NOT_FOUND', `Subscription ${id} not found`));
    }
    subscription.active = true;
    res.json(createResponse({ subscription }, ctx.tenant_id));
});
/**
 * GET /subscriptions/:id/stats
 * Get subscription stats
 */
router.get('/:id/stats', (req, res) => {
    const ctx = req.tenantContext;
    const { id } = req.params;
    const subscription = subscriptionStore.find(s => s.id === id && s.tenantId === ctx.tenant_id);
    if (!subscription) {
        return res.status(404).json(createErrorResponse('NOT_FOUND', `Subscription ${id} not found`));
    }
    const successRate = subscription.stats.received > 0
        ? (subscription.stats.processed / subscription.stats.received) * 100
        : 0;
    res.json(createResponse({
        stats: subscription.stats,
        successRate: successRate.toFixed(2) + '%'
    }, ctx.tenant_id));
});
/**
 * POST /subscriptions/:id/reset-stats
 * Reset subscription stats
 */
router.post('/:id/reset-stats', (req, res) => {
    const ctx = req.tenantContext;
    const { id } = req.params;
    const subscription = subscriptionStore.find(s => s.id === id && s.tenantId === ctx.tenant_id);
    if (!subscription) {
        return res.status(404).json(createErrorResponse('NOT_FOUND', `Subscription ${id} not found`));
    }
    subscription.stats = { received: 0, processed: 0, failed: 0 };
    res.json(createResponse({ subscription }, ctx.tenant_id));
});
export { router as subscriptionRoutes };
//# sourceMappingURL=subscriptions.js.map