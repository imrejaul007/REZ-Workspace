/**
 * Event Routes
 * Proxy to hojai-event service
 */
import { Router } from 'express';
import { tenantMiddleware } from '../middleware/tenant.js';
import { createResponse, createErrorResponse } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';
const router = Router();
// In-memory event store (for demo - replace with actual service call)
const eventStore = new Map();
/**
 * POST /api/events
 * Publish an event
 */
router.post('/', tenantMiddleware(), (req, res) => {
    const ctx = req.tenantContext;
    const { type, data, metadata } = req.body;
    if (!type || !data) {
        return res.status(400).json(createErrorResponse('INVALID_REQUEST', 'type and data are required'));
    }
    const event = {
        id: uuidv4(),
        type,
        source: 'api-gateway',
        tenantId: ctx.tenant_id,
        timestamp: new Date().toISOString(),
        data,
        metadata
    };
    // Store event
    const tenantEvents = eventStore.get(ctx.tenant_id) || [];
    tenantEvents.push(event);
    eventStore.set(ctx.tenant_id, tenantEvents);
    res.status(201).json(createResponse({ event }, { tenantId: ctx.tenant_id }));
});
/**
 * GET /api/events
 * Get events for tenant
 */
router.get('/', tenantMiddleware(), (req, res) => {
    const ctx = req.tenantContext;
    const { type, limit = 50 } = req.query;
    const tenantEvents = eventStore.get(ctx.tenant_id) || [];
    let filtered = tenantEvents;
    if (type) {
        filtered = tenantEvents.filter(e => e.type === type);
    }
    // Sort by timestamp descending
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    res.json(createResponse({
        events: filtered.slice(0, Number(limit)),
        total: filtered.length
    }, { tenantId: ctx.tenant_id }));
});
/**
 * GET /api/events/:id
 * Get event by ID
 */
router.get('/:id', tenantMiddleware(), (req, res) => {
    const ctx = req.tenantContext;
    const { id } = req.params;
    const tenantEvents = eventStore.get(ctx.tenant_id) || [];
    const event = tenantEvents.find(e => e.id === id);
    if (!event) {
        return res.status(404).json(createErrorResponse('NOT_FOUND', `Event ${id} not found`));
    }
    res.json(createResponse({ event }, { tenantId: ctx.tenant_id }));
});
/**
 * POST /api/events/subscribe
 * Subscribe to event types
 */
router.post('/subscribe', tenantMiddleware(), (req, res) => {
    const ctx = req.tenantContext;
    const { eventType, callbackUrl } = req.body;
    if (!eventType || !callbackUrl) {
        return res.status(400).json(createErrorResponse('INVALID_REQUEST', 'eventType and callbackUrl are required'));
    }
    const subscription = {
        id: uuidv4(),
        tenantId: ctx.tenant_id,
        eventType,
        callbackUrl,
        createdAt: new Date().toISOString(),
        active: true
    };
    res.status(201).json(createResponse({ subscription }, { tenantId: ctx.tenant_id }));
});
/**
 * GET /api/events/types
 * Get available event types
 */
router.get('/meta/types', tenantMiddleware(), (req, res) => {
    const eventTypes = [
        'commerce.order_placed',
        'commerce.order_completed',
        'commerce.order_cancelled',
        'commerce.payment_received',
        'commerce.refund_initiated',
        'customer.created',
        'customer.updated',
        'customer.deleted',
        'engagement.page_view',
        'engagement.click',
        'engagement.qr_scan',
        'intent.predicted',
        'intent.confirmed',
        'workflow.triggered',
        'workflow.completed',
        'agent.execution_started',
        'agent.execution_completed'
    ];
    res.json(createResponse({ eventTypes }));
});
export { router as eventRoutes };
//# sourceMappingURL=events.js.map