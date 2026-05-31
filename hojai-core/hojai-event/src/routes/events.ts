/**
 * Event Routes
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Event, eventStore, subscriptionStore } from '../index.js';

const router = Router();

// ============================================
// HELPERS
// ============================================

function createResponse<T>(data: T, tenantId?: string) {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}`,
      tenantId
    }
  };
}

function createErrorResponse(code: string, message: string) {
  return {
    success: false,
    error: { code, message },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}`
    }
  };
}

/**
 * POST /events
 * Publish an event
 */
router.post('/', async (req: Request, res: Response) => {
  const ctx = req.tenantContext!;
  const { type, data, metadata, source } = req.body;

  if (!type || !data) {
    return res.status(400).json(createErrorResponse('INVALID_REQUEST', 'type and data are required'));
  }

  const event: Event = {
    id: uuidv4(),
    type,
    source: source || 'unknown',
    tenantId: ctx.tenant_id,
    timestamp: new Date().toISOString(),
    data,
    metadata: {
      ...metadata,
      correlationId: metadata?.correlationId || uuidv4()
    }
  };

  // Store event
  const tenantEvents = eventStore.get(ctx.tenant_id) || [];
  tenantEvents.push(event);

  // Limit storage (keep last 10000 events per tenant)
  if (tenantEvents.length > 10000) {
    tenantEvents.splice(0, tenantEvents.length - 10000);
  }

  eventStore.set(ctx.tenant_id, tenantEvents);

  // Notify subscriptions
  await notifySubscribers(ctx.tenant_id, event);

  res.status(201).json(createResponse({ event }, ctx.tenant_id));
});

/**
 * GET /events
 * Get events for tenant
 */
router.get('/', (req: Request, res: Response) => {
  const ctx = req.tenantContext!;
  const { type, limit = 100, offset = 0 } = req.query;

  let tenantEvents = eventStore.get(ctx.tenant_id) || [];

  if (type) {
    tenantEvents = tenantEvents.filter(e => {
      if (type.toString().includes('*')) {
        const pattern = type.toString().replace(/\*/g, '.*');
        return new RegExp(pattern).test(e.type);
      }
      return e.type === type;
    });
  }

  // Sort by timestamp descending
  tenantEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const total = tenantEvents.length;
  const paginated = tenantEvents.slice(Number(offset), Number(offset) + Number(limit));

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
 * GET /events/:id
 * Get event by ID
 */
router.get('/:id', (req: Request, res: Response) => {
  const ctx = req.tenantContext!;
  const { id } = req.params;

  const tenantEvents = eventStore.get(ctx.tenant_id) || [];
  const event = tenantEvents.find(e => e.id === id);

  if (!event) {
    return res.status(404).json(createErrorResponse('NOT_FOUND', `Event ${id} not found`));
  }

  res.json(createResponse({ event }, ctx.tenant_id));
});

/**
 * GET /events/types
 * Get available event types
 */
router.get('/meta/types', (req: Request, res: Response) => {
  const ctx = req.tenantContext!;
  const tenantEvents = eventStore.get(ctx.tenant_id) || [];

  const typeCounts: Record<string, number> = {};
  for (const event of tenantEvents) {
    typeCounts[event.type] = (typeCounts[event.type] || 0) + 1;
  }

  const types = Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }));

  res.json(createResponse({ types }, ctx.tenant_id));
});

/**
 * DELETE /events
 * Delete events (with filters)
 */
router.delete('/', (req: Request, res: Response) => {
  const ctx = req.tenantContext!;
  const { before, type } = req.query;

  let tenantEvents = eventStore.get(ctx.tenant_id) || [];

  if (before) {
    const beforeDate = new Date(before as string);
    tenantEvents = tenantEvents.filter(e => new Date(e.timestamp) > beforeDate);
  }

  if (type) {
    tenantEvents = tenantEvents.filter(e => e.type !== type);
  }

  eventStore.set(ctx.tenant_id, tenantEvents);

  res.json(createResponse({ deleted: true, count: tenantEvents.length }));
});

// ============================================
// SUBSCRIBER NOTIFICATION
// ============================================

async function notifySubscribers(tenantId: string, event: Event): Promise<void> {
  const subscriptions = subscriptionStore.filter(s =>
    s.tenantId === tenantId &&
    s.active &&
    (s.eventType === event.type || matchesPattern(s.eventPattern || '', event.type))
  );

  for (const sub of subscriptions) {
    // Check filter
    if (sub.filter) {
      const passesFilter = Object.entries(sub.filter).every(
        ([key, value]) => event.data[key] === value
      );
      if (!passesFilter) continue;
    }

    sub.stats.received++;

    // In production, this would make an HTTP request to the handler
    // For demo, we just update stats
    try {
      // Simulate async processing
      // await fetch(sub.handler, { method: 'POST', body: JSON.stringify(event) });
      sub.stats.processed++;
    } catch {
      sub.stats.failed++;
    }
  }
}

function matchesPattern(pattern: string, type: string): boolean {
  if (!pattern) return false;
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  return regex.test(type);
}

export { router as eventRoutes };
