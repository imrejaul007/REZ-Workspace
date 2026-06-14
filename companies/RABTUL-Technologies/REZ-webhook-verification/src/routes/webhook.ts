/**
 * Webhook API Routes
 * Handles webhook verification, relay, and management endpoints
 */

import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  WebhookVerificationSchema,
  RelayRequestSchema,
  AddProviderSchema,
  WebhookEventStatus,
  ApiResponse,
  WebhookVerification,
  RelayRequest,
  AddProviderRequest
} from '../types';
import { signatureVerifier } from '../services/signatureVerifier';
import { providerConfigs } from '../services/providerConfigs';
import { eventRegistry, EVENT_TYPE_DEFINITIONS } from '../services/eventRegistry';
import { logger } from '../utils/logger';
import { AuthenticatedRequest, internalAuthMiddleware } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all routes
router.use(internalAuthMiddleware);

/**
 * POST /api/v1/verify
 * Verify webhook signature and optionally relay to service
 */
router.post('/verify', async (req: AuthenticatedRequest, res: Response) => {
  const requestId = (req as unknown).requestId;

  try {
    // Validate request body
    const parseResult = WebhookVerificationSchema.safeParse(req.body);
    if (!parseResult.success) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: parseResult.error.flatten()
        },
        meta: { requestId, timestamp: new Date().toISOString(), version: '1.0.0' }
      };
      return res.status(400).json(response);
    }

    const { providerId, payload, signature, timestamp, headers } = parseResult.data as WebhookVerification;

    // Check for duplicate using idempotency key
    const idempotencyKey = headers?.['x-idempotency-key'] ||
                          headers?.['idempotency-key'];

    if (idempotencyKey) {
      const isDuplicate = await eventRegistry.isDuplicate(providerId, idempotencyKey);
      if (isDuplicate) {
        logger.info('Duplicate webhook detected', { providerId, idempotencyKey });
        const response: ApiResponse = {
          success: true,
          data: {
            verified: false,
            duplicate: true,
            message: 'Event already processed'
          },
          meta: { requestId, timestamp: new Date().toISOString(), version: '1.0.0' }
        };
        return res.status(200).json(response);
      }
    }

    // Extract event type from payload
    const payloadObj = payload as Record<string, unknown>;
    const eventType = payloadObj?.event as string ||
                     payloadObj?.type as string ||
                     payloadObj?.event_type as string ||
                     'unknown';

    // Create event record
    const event = await eventRegistry.createEvent(
      providerId,
      eventType,
      payload,
      signature,
      idempotencyKey
    );

    // Verify signature
    const verificationResult = await signatureVerifier.verify(
      providerId,
      payload,
      signature,
      headers
    );

    // Record verification result
    await eventRegistry.recordVerification(
      event.id,
      verificationResult.isValid,
      verificationResult.algorithm,
      verificationResult.error
    );

    // If verification failed, return error
    if (!verificationResult.isValid) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VERIFICATION_FAILED',
          message: verificationResult.error || 'Signature verification failed',
          details: {
            algorithm: verificationResult.algorithm,
            eventId: event.id
          }
        },
        meta: { requestId, timestamp: new Date().toISOString(), version: '1.0.0' }
      };
      return res.status(401).json(response);
    }

    // Mark as processed
    if (idempotencyKey) {
      await eventRegistry.markProcessed(providerId, idempotencyKey);
    }

    // Check if auto-relay is configured
    const provider = providerConfigs.getProvider(providerId);
    if (provider?.relayUrl) {
      const relayResult = await eventRegistry.relayEvent(event.id, {
        eventId: event.id,
        targetUrl: provider.relayUrl,
        payload,
        headers: {
          'X-Webhook-Event-Id': event.id,
          'X-Webhook-Provider': providerId,
          'X-Webhook-Timestamp': timestamp || new Date().toISOString()
        }
      });

      // Schedule retry if relay failed
      if (!relayResult.success && event.retryCount < event.maxRetries) {
        await eventRegistry.scheduleRetry(event.id);
      }

      const response: ApiResponse = {
        success: true,
        data: {
          verified: true,
          eventId: event.id,
          eventType,
          relayed: relayResult.success,
          relayStatusCode: relayResult.statusCode
        },
        meta: { requestId, timestamp: new Date().toISOString(), version: '1.0.0' }
      };
      return res.status(200).json(response);
    }

    const response: ApiResponse = {
      success: true,
      data: {
        verified: true,
        eventId: event.id,
        eventType
      },
      meta: { requestId, timestamp: new Date().toISOString(), version: '1.0.0' }
    };
    return res.status(200).json(response);
  } catch (error) {
    logger.error('Verification error', { error, requestId });
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred'
      },
      meta: { requestId, timestamp: new Date().toISOString(), version: '1.0.0' }
    };
    return res.status(500).json(response);
  }
});

/**
 * POST /api/v1/relay
 * Relay webhook to target service
 */
router.post('/relay', async (req: AuthenticatedRequest, res: Response) => {
  const requestId = (req as unknown).requestId;

  try {
    const parseResult = RelayRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: parseResult.error.flatten()
        },
        meta: { requestId, timestamp: new Date().toISOString(), version: '1.0.0' }
      };
      return res.status(400).json(response);
    }

    const { eventId, targetUrl, payload, headers, method, timeout } = parseResult.data as RelayRequest;

    // If eventId provided, use stored event payload
    let finalPayload = payload;
    if (eventId) {
      const event = await eventRegistry.getEvent(eventId);
      if (!event) {
        const response: ApiResponse = {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Event not found' },
          meta: { requestId, timestamp: new Date().toISOString(), version: '1.0.0' }
        };
        return res.status(404).json(response);
      }
      finalPayload = event.payload;
    }

    const result = await eventRegistry.relayEvent(eventId || uuidv4(), {
      targetUrl,
      payload: finalPayload,
      headers,
      method,
      timeout
    });

    const response: ApiResponse = {
      success: result.success,
      data: {
        eventId,
        success: result.success,
        statusCode: result.statusCode,
        duration: result.duration,
        error: result.error
      },
      meta: { requestId, timestamp: new Date().toISOString(), version: '1.0.0' }
    };

    return res.status(result.success ? 200 : 502).json(response);
  } catch (error) {
    logger.error('Relay error', { error, requestId });
    const response: ApiResponse = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Relay failed' },
      meta: { requestId, timestamp: new Date().toISOString(), version: '1.0.0' }
    };
    return res.status(500).json(response);
  }
});

/**
 * GET /api/v1/providers
 * List all webhook providers
 */
router.get('/providers', async (req: AuthenticatedRequest, res: Response) => {
  const requestId = (req as unknown).requestId;
  const includeDisabled = req.query.include_disabled === 'true';
  const providers = includeDisabled
    ? providerConfigs.getAllProviders()
    : providerConfigs.getEnabledProviders();

  // Remove secrets from response
  const sanitizedProviders = providers.map(p => ({
    ...p,
    secret: undefined
  }));

  const response: ApiResponse = {
    success: true,
    data: {
      providers: sanitizedProviders,
      statistics: providerConfigs.getStatistics()
    },
    meta: { requestId, timestamp: new Date().toISOString(), version: '1.0.0' }
  };

  return res.status(200).json(response);
});

/**
 * POST /api/v1/providers
 * Add a new webhook provider
 */
router.post('/providers', async (req: AuthenticatedRequest, res: Response) => {
  const requestId = (req as unknown).requestId;

  try {
    const parseResult = AddProviderSchema.safeParse(req.body);
    if (!parseResult.success) {
      const response: ApiResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid provider configuration',
          details: parseResult.error.flatten()
        },
        meta: { requestId, timestamp: new Date().toISOString(), version: '1.0.0' }
      };
      return res.status(400).json(response);
    }

    const config = parseResult.data as AddProviderRequest;
    const providerId = config.name.toLowerCase().replace(/\s+/g, '_');

    // Check if provider already exists
    if (providerConfigs.getProvider(providerId)) {
      const response: ApiResponse = {
        success: false,
        error: { code: 'CONFLICT', message: 'Provider already exists' },
        meta: { requestId, timestamp: new Date().toISOString(), version: '1.0.0' }
      };
      return res.status(409).json(response);
    }

    const provider = providerConfigs.addProvider({
      id: providerId,
      ...config,
      enabled: true
    });

    // Remove secret from response
    const { secret, ...sanitized } = provider;

    const response: ApiResponse = {
      success: true,
      data: { provider: sanitized },
      meta: { requestId, timestamp: new Date().toISOString(), version: '1.0.0' }
    };

    return res.status(201).json(response);
  } catch (error) {
    logger.error('Add provider error', { error, requestId });
    const response: ApiResponse = {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to add provider' },
      meta: { requestId, timestamp: new Date().toISOString(), version: '1.0.0' }
    };
    return res.status(500).json(response);
  }
});

/**
 * GET /api/v1/providers/:id
 * Get provider details
 */
router.get('/providers/:id', async (req: AuthenticatedRequest, res: Response) => {
  const requestId = (req as unknown).requestId;
  const { id } = req.params;

  const provider = providerConfigs.getProvider(id);
  if (!provider) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Provider not found' },
      meta: { requestId, timestamp: new Date().toISOString(), version: '1.0.0' }
    };
    return res.status(404).json(response);
  }

  const { secret, ...sanitized } = provider;

  const response: ApiResponse = {
    success: true,
    data: { provider: sanitized },
    meta: { requestId, timestamp: new Date().toISOString(), version: '1.0.0' }
  };

  return res.status(200).json(response);
});

/**
 * PATCH /api/v1/providers/:id
 * Update provider configuration
 */
router.patch('/providers/:id', async (req: AuthenticatedRequest, res: Response) => {
  const requestId = (req as unknown).requestId;
  const { id } = req.params;

  const existing = providerConfigs.getProvider(id);
  if (!existing) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Provider not found' },
      meta: { requestId, timestamp: new Date().toISOString(), version: '1.0.0' }
    };
    return res.status(404).json(response);
  }

  const updated = providerConfigs.updateProvider(id, req.body);
  const { secret, ...sanitized } = updated!;

  const response: ApiResponse = {
    success: true,
    data: { provider: sanitized },
    meta: { requestId, timestamp: new Date().toISOString(), version: '1.0.0' }
  };

  return res.status(200).json(response);
});

/**
 * DELETE /api/v1/providers/:id
 * Delete provider
 */
router.delete('/providers/:id', async (req: AuthenticatedRequest, res: Response) => {
  const requestId = (req as unknown).requestId;
  const { id } = req.params;

  const deleted = providerConfigs.deleteProvider(id);
  if (!deleted) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Provider not found' },
      meta: { requestId, timestamp: new Date().toISOString(), version: '1.0.0' }
    };
    return res.status(404).json(response);
  }

  const response: ApiResponse = {
    success: true,
    data: { message: 'Provider deleted' },
    meta: { requestId, timestamp: new Date().toISOString(), version: '1.0.0' }
  };

  return res.status(200).json(response);
});

/**
 * GET /api/v1/events/:id
 * Get event details
 */
router.get('/events/:id', async (req: AuthenticatedRequest, res: Response) => {
  const requestId = (req as unknown).requestId;
  const { id } = req.params;

  const event = await eventRegistry.getEvent(id);
  if (!event) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Event not found' },
      meta: { requestId, timestamp: new Date().toISOString(), version: '1.0.0' }
    };
    return res.status(404).json(response);
  }

  const response: ApiResponse = {
    success: true,
    data: { event },
    meta: { requestId, timestamp: new Date().toISOString(), version: '1.0.0' }
  };

  return res.status(200).json(response);
});

/**
 * GET /api/v1/events
 * List events with filtering
 */
router.get('/events', async (req: AuthenticatedRequest, res: Response) => {
  const requestId = (req as unknown).requestId;

  const providerId = req.query.provider_id as string;
  const status = req.query.status as WebhookEventStatus;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = parseInt(req.query.offset as string) || 0;

  const events = await eventRegistry.getEventsByProvider(providerId, {
    limit: Math.min(limit, 100),
    offset,
    status
  });

  const response: ApiResponse = {
    success: true,
    data: {
      events,
      pagination: { limit, offset, count: events.length }
    },
    meta: { requestId, timestamp: new Date().toISOString(), version: '1.0.0' }
  };

  return res.status(200).json(response);
});

/**
 * POST /api/v1/retry/:id
 * Retry failed webhook
 */
router.post('/retry/:id', async (req: AuthenticatedRequest, res: Response) => {
  const requestId = (req as unknown).requestId;
  const { id } = req.params;

  const event = await eventRegistry.getEvent(id);
  if (!event) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Event not found' },
      meta: { requestId, timestamp: new Date().toISOString(), version: '1.0.0' }
    };
    return res.status(404).json(response);
  }

  if (event.status !== WebhookEventStatus.FAILED &&
      event.status !== WebhookEventStatus.RETRY_SCHEDULED) {
    const response: ApiResponse = {
      success: false,
      error: {
        code: 'INVALID_STATE',
        message: `Cannot retry event in '${event.status}' state`
      },
      meta: { requestId, timestamp: new Date().toISOString(), version: '1.0.0' }
    };
    return res.status(400).json(response);
  }

  const scheduled = await eventRegistry.scheduleRetry(id);
  if (!scheduled) {
    const response: ApiResponse = {
      success: false,
      error: { code: 'MAX_RETRIES', message: 'Maximum retry attempts reached' },
      meta: { requestId, timestamp: new Date().toISOString(), version: '1.0.0' }
    };
    return res.status(400).json(response);
  }

  const response: ApiResponse = {
    success: true,
    data: {
      eventId: id,
      message: 'Retry scheduled',
      retryCount: event.retryCount + 1
    },
    meta: { requestId, timestamp: new Date().toISOString(), version: '1.0.0' }
  };

  return res.status(202).json(response);
});

/**
 * GET /api/v1/event-types
 * List supported event types
 */
router.get('/event-types', async (req: AuthenticatedRequest, res: Response) => {
  const requestId = (req as unknown).requestId;
  const category = req.query.category as string;

  let types = Object.entries(EVENT_TYPE_DEFINITIONS).map(([key, value]) => ({
    key,
    ...value
  }));

  if (category) {
    types = types.filter(t => t.category === category);
  }

  const response: ApiResponse = {
    success: true,
    data: { eventTypes: types },
    meta: { requestId, timestamp: new Date().toISOString(), version: '1.0.0' }
  };

  return res.status(200).json(response);
});

/**
 * GET /api/v1/statistics
 * Get webhook statistics
 */
router.get('/statistics', async (req: AuthenticatedRequest, res: Response) => {
  const requestId = (req as unknown).requestId;

  const providerId = req.query.provider_id as string;
  const startDate = req.query.start_date as string;
  const endDate = req.query.end_date as string;

  const timeRange = startDate && endDate ? {
    start: new Date(startDate),
    end: new Date(endDate)
  } : undefined;

  const stats = await eventRegistry.getStatistics(providerId, timeRange);

  const response: ApiResponse = {
    success: true,
    data: { statistics: stats },
    meta: { requestId, timestamp: new Date().toISOString(), version: '1.0.0' }
  };

  return res.status(200).json(response);
});

/**
 * POST /api/v1/cleanup
 * Clean up old events
 */
router.post('/cleanup', async (req: AuthenticatedRequest, res: Response) => {
  const requestId = (req as unknown).requestId;
  const retentionDays = parseInt(req.body.retention_days as string) || 30;

  const deletedCount = await eventRegistry.cleanupOldEvents(retentionDays);

  const response: ApiResponse = {
    success: true,
    data: {
      message: 'Cleanup completed',
      deletedCount,
      retentionDays
    },
    meta: { requestId, timestamp: new Date().toISOString(), version: '1.0.0' }
  };

  return res.status(200).json(response);
});

/**
 * GET /health
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    data: {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    },
    meta: { requestId: 'health-check', timestamp: new Date().toISOString(), version: '1.0.0' }
  };

  return res.status(200).json(response);
});

export default router;
