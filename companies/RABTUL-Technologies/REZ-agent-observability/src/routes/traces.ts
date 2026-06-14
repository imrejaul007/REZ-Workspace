import { Router, Request, Response } from 'express';
import {
  createTrace,
  updateTrace,
  addTraceEvent,
  completeTrace,
  failTrace,
  getTrace,
  getTraceByTraceId,
  getTracesByWorkflow,
  getTracesByAgent,
  searchTraces,
  getMetrics,
  getExecutionSummary,
  getAlertRules,
} from '../services/trace.service';
import logger from '../utils/logger';

const router = Router();

// POST /api/traces - Create new trace
router.post('/', (req: Request, res: Response) => {
  try {
    const { workflowId, agentId, nodeId, name, input, traceId, parentSpanId, userId, sessionId, metadata } = req.body;

    if (!workflowId || !agentId || !nodeId || !name) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    const trace = createTrace(workflowId, agentId, nodeId, name, input || {}, { traceId, parentSpanId, userId, sessionId, metadata });
    res.status(201).json({ success: true, data: trace });
  } catch (error) {
    logger.error('Error creating trace:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/traces - Search traces
router.get('/', (req: Request, res: Response) => {
  try {
    const { workflowId, agentId, status, startTime, endTime, tags, limit, offset } = req.query;

    const result = searchTraces({
      workflowId: workflowId as string,
      agentId: agentId as string,
      status: status as string,
      startTime: startTime as string,
      endTime: endTime as string,
      tags: tags ? (tags as string).split(',') : undefined,
      limit: limit ? parseInt(limit as string, 10) : 100,
      offset: offset ? parseInt(offset as string, 10) : 0,
    });

    res.json({ success: true, data: result.traces, total: result.total });
  } catch (error) {
    logger.error('Error searching traces:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/traces/workflow/:workflowId - Get traces by workflow
router.get('/workflow/:workflowId', (req: Request, res: Response) => {
  try {
    const { limit, status } = req.query;
    const traces = getTracesByWorkflow(req.params.workflowId, {
      limit: limit ? parseInt(limit as string, 10) : 50,
      status: status as string,
    });
    res.json({ success: true, data: traces, count: traces.length });
  } catch (error) {
    logger.error('Error fetching workflow traces:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/traces/agent/:agentId - Get traces by agent
router.get('/agent/:agentId', (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const traces = getTracesByAgent(req.params.agentId, {
      limit: limit ? parseInt(limit as string, 10) : 50,
    });
    res.json({ success: true, data: traces, count: traces.length });
  } catch (error) {
    logger.error('Error fetching agent traces:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/traces/trace/:traceId - Get traces by trace ID (includes all spans)
router.get('/trace/:traceId', (req: Request, res: Response) => {
  const traces = getTraceByTraceId(req.params.traceId);
  if (traces.length === 0) {
    res.status(404).json({ success: false, error: 'Trace not found' });
    return;
  }
  res.json({ success: true, data: traces });
});

// GET /api/traces/:id - Get trace by ID
router.get('/:id', (req: Request, res: Response) => {
  const trace = getTrace(req.params.id);
  if (!trace) {
    res.status(404).json({ success: false, error: 'Trace not found' });
    return;
  }
  res.json({ success: true, data: trace });
});

// PATCH /api/traces/:id - Update trace
router.patch('/:id', (req: Request, res: Response) => {
  try {
    const { status, output, error, tags, attributes } = req.body;
    const trace = updateTrace(req.params.id, { status, output, error, tags, attributes });
    if (!trace) {
      res.status(404).json({ success: false, error: 'Trace not found' });
      return;
    }
    res.json({ success: true, data: trace });
  } catch (error) {
    logger.error('Error updating trace:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/traces/:id/complete - Complete trace
router.post('/:id/complete', (req: Request, res: Response) => {
  try {
    const { output } = req.body;
    const trace = completeTrace(req.params.id, output || {});
    if (!trace) {
      res.status(404).json({ success: false, error: 'Trace not found' });
      return;
    }
    res.json({ success: true, data: trace });
  } catch (error) {
    logger.error('Error completing trace:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/traces/:id/fail - Fail trace
router.post('/:id/fail', (req: Request, res: Response) => {
  try {
    const { message, type, code, stack } = req.body;
    const trace = failTrace(req.params.id, { message, type, code, stack });
    if (!trace) {
      res.status(404).json({ success: false, error: 'Trace not found' });
      return;
    }
    res.json({ success: true, data: trace });
  } catch (error) {
    logger.error('Error failing trace:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/traces/:id/events - Add event to trace
router.post('/:id/events', (req: Request, res: Response) => {
  try {
    const { name, type, attributes } = req.body;
    if (!name) {
      res.status(400).json({ success: false, error: 'Event name is required' });
      return;
    }
    const trace = addTraceEvent(req.params.id, name, type || 'info', attributes);
    if (!trace) {
      res.status(404).json({ success: false, error: 'Trace not found' });
      return;
    }
    res.json({ success: true, data: trace });
  } catch (error) {
    logger.error('Error adding event:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/metrics - Get metrics
router.get('/metrics', (_req: Request, res: Response) => {
  try {
    const metrics = getMetrics();
    res.json({ success: true, data: metrics });
  } catch (error) {
    logger.error('Error fetching metrics:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/metrics/summary - Get execution summary
router.get('/metrics/summary', (_req: Request, res: Response) => {
  try {
    const summary = getExecutionSummary();
    res.json({ success: true, data: summary });
  } catch (error) {
    logger.error('Error fetching summary:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/alerts - Get alert rules
router.get('/alerts', (_req: Request, res: Response) => {
  try {
    const alerts = getAlertRules();
    res.json({ success: true, data: alerts });
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
