/**
 * Stream Routes
 */
import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { streamStore, eventStore } from '../index.js';
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
 * POST /stream
 * Create an event stream
 */
router.post('/', (req, res) => {
    const ctx = req.tenantContext;
    const { name, eventTypes, retentionDays = 30 } = req.body;
    if (!name || !eventTypes || !Array.isArray(eventTypes)) {
        return res.status(400).json(createErrorResponse('INVALID_REQUEST', 'name and eventTypes array required'));
    }
    const stream = {
        id: uuidv4(),
        name,
        tenantId: ctx.tenant_id,
        eventTypes,
        retentionDays,
        createdAt: new Date().toISOString()
    };
    streamStore.push(stream);
    res.status(201).json(createResponse({ stream }, ctx.tenant_id));
});
/**
 * GET /stream
 * List streams
 */
router.get('/', (req, res) => {
    const ctx = req.tenantContext;
    const streams = streamStore.filter(s => s.tenantId === ctx.tenant_id);
    res.json(createResponse({ streams }, ctx.tenant_id));
});
/**
 * GET /stream/:id
 * Get stream by ID
 */
router.get('/:id', (req, res) => {
    const ctx = req.tenantContext;
    const { id } = req.params;
    const stream = streamStore.find(s => s.id === id && s.tenantId === ctx.tenant_id);
    if (!stream) {
        return res.status(404).json(createErrorResponse('NOT_FOUND', `Stream ${id} not found`));
    }
    // Get events in this stream
    const tenantEvents = eventStore.get(ctx.tenant_id) || [];
    const streamEvents = tenantEvents.filter(e => stream.eventTypes.includes(e.type));
    res.json(createResponse({
        stream,
        eventCount: streamEvents.length,
        events: streamEvents.slice(-100) // Last 100
    }, ctx.tenant_id));
});
/**
 * GET /stream/:id/events
 * Get events in stream
 */
router.get('/:id/events', (req, res) => {
    const ctx = req.tenantContext;
    const { id } = req.params;
    const { limit = 100, offset = 0, after, before } = req.query;
    const stream = streamStore.find(s => s.id === id && s.tenantId === ctx.tenant_id);
    if (!stream) {
        return res.status(404).json(createErrorResponse('NOT_FOUND', `Stream ${id} not found`));
    }
    let tenantEvents = eventStore.get(ctx.tenant_id) || [];
    let streamEvents = tenantEvents.filter(e => stream.eventTypes.includes(e.type));
    if (after) {
        streamEvents = streamEvents.filter(e => e.timestamp > after);
    }
    if (before) {
        streamEvents = streamEvents.filter(e => e.timestamp < before);
    }
    // Sort by timestamp
    streamEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const total = streamEvents.length;
    const paginated = streamEvents.slice(Number(offset), Number(offset) + Number(limit));
    res.json(createResponse({
        events: paginated,
        pagination: {
            total,
            limit: Number(limit),
            offset: Number(offset),
            hasMore: Number(offset) + paginated.length < total
        }
    }, ctx.tenant_id));
});
/**
 * PUT /stream/:id
 * Update stream
 */
router.put('/:id', (req, res) => {
    const ctx = req.tenantContext;
    const { id } = req.params;
    const { name, eventTypes, retentionDays } = req.body;
    const stream = streamStore.find(s => s.id === id && s.tenantId === ctx.tenant_id);
    if (!stream) {
        return res.status(404).json(createErrorResponse('NOT_FOUND', `Stream ${id} not found`));
    }
    if (name !== undefined)
        stream.name = name;
    if (eventTypes !== undefined)
        stream.eventTypes = eventTypes;
    if (retentionDays !== undefined)
        stream.retentionDays = retentionDays;
    res.json(createResponse({ stream }, ctx.tenant_id));
});
/**
 * DELETE /stream/:id
 * Delete stream
 */
router.delete('/:id', (req, res) => {
    const ctx = req.tenantContext;
    const { id } = req.params;
    const index = streamStore.findIndex(s => s.id === id && s.tenantId === ctx.tenant_id);
    if (index === -1) {
        return res.status(404).json(createErrorResponse('NOT_FOUND', `Stream ${id} not found`));
    }
    streamStore.splice(index, 1);
    res.json(createResponse({ deleted: true }));
});
/**
 * POST /stream/:id/cleanup
 * Clean up old events based on retention policy
 */
router.post('/:id/cleanup', (req, res) => {
    const ctx = req.tenantContext;
    const { id } = req.params;
    const stream = streamStore.find(s => s.id === id && s.tenantId === ctx.tenant_id);
    if (!stream) {
        return res.status(404).json(createErrorResponse('NOT_FOUND', `Stream ${id} not found`));
    }
    const tenantEvents = eventStore.get(ctx.tenant_id) || [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - stream.retentionDays);
    const beforeCount = tenantEvents.length;
    const filtered = tenantEvents.filter(e => !stream.eventTypes.includes(e.type) || new Date(e.timestamp) > cutoff);
    const deleted = beforeCount - filtered.length;
    eventStore.set(ctx.tenant_id, filtered);
    res.json(createResponse({
        deleted,
        remaining: filtered.length
    }, ctx.tenant_id));
});
export { router as streamRoutes };
//# sourceMappingURL=stream.js.map