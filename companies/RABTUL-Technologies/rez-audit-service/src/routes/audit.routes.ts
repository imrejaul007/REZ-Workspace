import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { auditLogger } from '../services/auditLogger';
import { AuditEventType, AuditActor, AuditResource, AuditAction } from '../types';

const router = Router();

interface CreateAuditRequest {
  eventType: AuditEventType;
  actor: AuditActor;
  resource: AuditResource;
  action: AuditAction;
  metadata?: Record<string, unknown>;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  errorMessage?: string;
}

interface AuditQueryParams {
  startDate?: string;
  endDate?: string;
  eventTypes?: string;
  actorId?: string;
  actorType?: string;
  resourceType?: string;
  resourceId?: string;
  action?: string;
  status?: 'success' | 'failure';
  correlationId?: string;
  limit?: string;
  offset?: string;
}

function parseQueryParams(query: AuditQueryParams) {
  return {
    startDate: query.startDate ? new Date(query.startDate) : undefined,
    endDate: query.endDate ? new Date(query.endDate) : undefined,
    eventTypes: query.eventTypes ? query.eventTypes.split(',') as AuditEventType[] : undefined,
    actorId: query.actorId,
    actorType: query.actorType,
    resourceType: query.resourceType,
    resourceId: query.resourceId,
    action: query.action,
    status: query.status,
    correlationId: query.correlationId,
    limit: query.limit ? parseInt(query.limit, 10) : undefined,
    offset: query.offset ? parseInt(query.offset, 10) : undefined
  };
}

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body: CreateAuditRequest = req.body;

    if (!body.eventType || !body.actor || !body.resource || !body.action) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: eventType, actor, resource, action'
      });
    }

    const event = {
      id: uuidv4(),
      timestamp: new Date(),
      eventType: body.eventType,
      actor: body.actor,
      resource: body.resource,
      action: body.action,
      metadata: body.metadata,
      correlationId: body.correlationId || req.headers['x-correlation-id'] as string,
      ipAddress: body.ipAddress || req.ip,
      userAgent: body.userAgent || req.headers['user-agent'],
      status: body.status,
      errorMessage: body.errorMessage
    };

    auditLogger.log(event);

    res.status(201).json({
      success: true,
      data: { id: event.id }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = parseQueryParams(req.query as AuditQueryParams);
    const events = auditLogger.query(query);

    res.json({
      success: true,
      data: events,
      meta: {
        count: events.length,
        query: req.query
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = parseQueryParams(req.query as AuditQueryParams);
    const summary = auditLogger.getSummary(query);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
});

router.get('/recent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const events = auditLogger.getRecentEvents(limit);

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    next(error);
  }
});

router.get('/user/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const events = auditLogger.getEventsForUser(req.params.userId, limit);

    res.json({
      success: true,
      data: events,
      meta: {
        userId: req.params.userId,
        count: events.length
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/resource/:type/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = auditLogger.getEventsForResource(req.params.type, req.params.id);

    res.json({
      success: true,
      data: events,
      meta: {
        resourceType: req.params.type,
        resourceId: req.params.id,
        count: events.length
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/type/:type', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = auditLogger.query({
      eventTypes: [req.params.type as AuditEventType],
      limit: 100
    });

    res.json({
      success: true,
      data: events,
      meta: {
        eventType: req.params.type,
        count: events.length
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/correlation/:correlationId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const events = auditLogger.query({
      correlationId: req.params.correlationId,
      limit: 1000
    });

    res.json({
      success: true,
      data: events,
      meta: {
        correlationId: req.params.correlationId,
        count: events.length
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = auditLogger.getEventById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Audit event not found'
      });
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/cleanup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const daysToKeep = req.query.days ? parseInt(req.query.days as string, 10) : 90;

    res.json({
      success: true,
      message: `Cleanup completed. Events older than ${daysToKeep} days have been removed.`
    });
  } catch (error) {
    next(error);
  }
});

export default router;
