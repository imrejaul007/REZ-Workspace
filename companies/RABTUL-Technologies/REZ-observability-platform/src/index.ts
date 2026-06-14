/**
 * REZ Observability Platform
 * Centralized metrics, logging, and tracing for the REZ ecosystem
 */

import express, { Request, Response, NextFunction } from 'express';
import logger from './utils/logger';
import { tracingMiddleware } from './middleware/tracing';
import cors from 'cors';
import helmet from 'helmet';
import crypto from 'crypto';

const app = express();
const PORT = parseInt(process.env.PORT || '4025', 10);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// ============================================
// IN-MEMORY STORES
// ============================================

interface Metric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  value: number;
  labels: Record<string, string>;
  timestamp: Date;
}

interface LogEntry {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  service?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

interface Trace {
  id: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  service: string;
  operation: string;
  status: 'ok' | 'error';
  duration: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

const metrics: Metric[] = [];
const logs: LogEntry[] = [];
const traces: Trace[] = [];

// ============================================
// METRICS ENDPOINTS
// ============================================

/**
 * POST /api/metrics - Record a metric
 */
app.post('/api/metrics', (req: Request, res: Response) => {
  const { name, type, value, labels = {} } = req.body;

  if (!name || value === undefined) {
    return res.status(400).json({ error: 'name and value are required' });
  }

  if (type && !['counter', 'gauge', 'histogram'].includes(type)) {
    return res.status(400).json({ error: 'type must be counter, gauge, or histogram' });
  }

  // Check for existing metric with same name and labels
  const labelKey = JSON.stringify(labels);
  const existing = metrics.find(
    m => m.name === name && JSON.stringify(m.labels) === labelKey
  );

  if (existing) {
    if (type === 'counter' || !type) {
      existing.value += value;
    } else {
      existing.value = value;
    }
  } else {
    metrics.push({
      name,
      type: type || 'counter',
      value,
      labels,
      timestamp: new Date(),
    });
  }

  res.json({ success: true });
});

/**
 * GET /api/metrics - Get all metrics
 */
app.get('/api/metrics', (_req: Request, res: Response) => {
  res.json({
    metrics: metrics.map(m => ({
      ...m,
      timestamp: m.timestamp.toISOString(),
    })),
    total: metrics.length,
  });
});

/**
 * GET /api/metrics/:name - Get specific metric
 */
app.get('/api/metrics/:name', (req: Request, res: Response) => {
  const filtered = metrics.filter(m => m.name === req.params.name);

  // Aggregate if multiple entries
  const aggregated = filtered.reduce((acc, m) => {
    if (!acc.count) {
      acc.name = m.name;
      acc.type = m.type;
      acc.value = m.value;
      acc.labels = m.labels;
      acc.count = 1;
    } else {
      acc.value += m.value;
      acc.count++;
    }
    return acc;
  }, {} as { name: string; type: string; value: number; labels: Record<string, string>; count: number });

  res.json({
    name: req.params.name,
    ...aggregated,
    entries: filtered.length,
  });
});

/**
 * GET /api/metrics/summary - Get aggregated summary
 */
app.get('/api/metrics/summary', (_req: Request, res: Response) => {
  const summary: Record<string, { total: number; count: number; avg: number }> = {};

  for (const metric of metrics) {
    if (!summary[metric.name]) {
      summary[metric.name] = { total: 0, count: 0, avg: 0 };
    }
    summary[metric.name].total += metric.value;
    summary[metric.name].count += 1;
  }

  for (const name in summary) {
    summary[name].avg = summary[name].total / summary[name].count;
  }

  res.json({ summary });
});

// ============================================
// LOGGING ENDPOINTS
// ============================================

/**
 * POST /api/logs - Ingest a log
 */
app.post('/api/logs', (req: Request, res: Response) => {
  const { level, message, service, metadata } = req.body;

  if (!level || !message) {
    return res.status(400).json({ error: 'level and message are required' });
  }

  if (!['debug', 'info', 'warn', 'error'].includes(level)) {
    return res.status(400).json({ error: 'level must be debug, info, warn, or error' });
  }

  const entry: LogEntry = {
    id: `log_${Date.now()}_${crypto.randomUUID().replace(/-/g, '').substring(0, 9)}`,
    level,
    message,
    service,
    timestamp: new Date(),
    metadata,
  };

  logs.push(entry);

  // Keep only last 10000 logs
  if (logs.length > 10000) {
    logs.splice(0, logs.length - 10000);
  }

  res.json({ success: true, id: entry.id });
});

/**
 * GET /api/logs - Query logs
 */
app.get('/api/logs', (req: Request, res: Response) => {
  const { level, service, since, until, limit = 100 } = req.query;

  let filtered = [...logs];

  if (level) {
    filtered = filtered.filter(l => l.level === level);
  }

  if (service) {
    filtered = filtered.filter(l => l.service === service);
  }

  if (since) {
    const sinceDate = new Date(since as string);
    filtered = filtered.filter(l => l.timestamp >= sinceDate);
  }

  if (until) {
    const untilDate = new Date(until as string);
    filtered = filtered.filter(l => l.timestamp <= untilDate);
  }

  // Sort descending
  filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const limitNum = parseInt(limit as string, 10);
  filtered = filtered.slice(0, limitNum);

  res.json({
    logs: filtered.map(l => ({
      ...l,
      timestamp: l.timestamp.toISOString(),
    })),
    total: filtered.length,
  });
});

/**
 * GET /api/logs/stats - Get log statistics
 */
app.get('/api/logs/stats', (_req: Request, res: Response) => {
  const stats = {
    total: logs.length,
    byLevel: { debug: 0, info: 0, warn: 0, error: 0 },
    byService: {} as Record<string, number>,
    last24h: 0,
    last1h: 0,
  };

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  for (const log of logs) {
    stats.byLevel[log.level]++;
    if (log.service) {
      stats.byService[log.service] = (stats.byService[log.service] || 0) + 1;
    }
    if (log.timestamp >= oneDayAgo) stats.last24h++;
    if (log.timestamp >= oneHourAgo) stats.last1h++;
  }

  res.json(stats);
});

// ============================================
// TRACING ENDPOINTS
// ============================================

/**
 * POST /api/traces - Record a trace
 */
app.post('/api/traces', (req: Request, res: Response) => {
  const { traceId, spanId, parentSpanId, service, operation, status, duration, metadata } = req.body;

  if (!traceId || !spanId || !service || !operation) {
    return res.status(400).json({ error: 'traceId, spanId, service, and operation are required' });
  }

  const trace: Trace = {
    id: `trace_${Date.now()}_${crypto.randomUUID().replace(/-/g, '').substring(0, 9)}`,
    traceId,
    spanId,
    parentSpanId,
    service,
    operation,
    status: status || 'ok',
    duration: duration || 0,
    timestamp: new Date(),
    metadata,
  };

  traces.push(trace);

  // Keep only last 50000 traces
  if (traces.length > 50000) {
    traces.splice(0, traces.length - 50000);
  }

  res.json({ success: true, id: trace.id });
});

/**
 * GET /api/traces - Query traces
 */
app.get('/api/traces', (req: Request, res: Response) => {
  const { service, operation, traceId, status, limit = 100 } = req.query;

  let filtered = [...traces];

  if (service) {
    filtered = filtered.filter(t => t.service === service);
  }

  if (operation) {
    filtered = filtered.filter(t => t.operation === operation);
  }

  if (traceId) {
    filtered = filtered.filter(t => t.traceId === traceId);
  }

  if (status) {
    filtered = filtered.filter(t => t.status === status);
  }

  // Sort descending
  filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const limitNum = parseInt(limit as string, 10);
  filtered = filtered.slice(0, limitNum);

  res.json({
    traces: filtered.map(t => ({
      ...t,
      timestamp: t.timestamp.toISOString(),
    })),
    total: filtered.length,
  });
});

/**
 * GET /api/traces/:traceId - Get full trace tree
 */
app.get('/api/traces/:traceId', (req: Request, res: Response) => {
  const traceSpans = traces.filter(t => t.traceId === req.params.traceId);

  if (traceSpans.length === 0) {
    return res.status(404).json({ error: 'Trace not found' });
  }

  // Build tree structure
  const spans = traceSpans.map(t => ({
    ...t,
    timestamp: t.timestamp.toISOString(),
  }));

  // Calculate total duration
  const rootSpan = spans.reduce((max, s) =>
    (!max || s.duration > max.duration) ? s : max
  , null as Trace | null);

  res.json({
    traceId: req.params.traceId,
    spans,
    spanCount: spans.length,
    totalDuration: rootSpan?.duration || 0,
  });
});

/**
 * GET /api/traces/stats - Get trace statistics
 */
app.get('/api/traces/stats', (_req: Request, res: Response) => {
  const stats = {
    total: traces.length,
    byService: {} as Record<string, number>,
    byStatus: { ok: 0, error: 0 },
    avgDuration: 0,
    last24h: 0,
  };

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  let totalDuration = 0;

  for (const trace of traces) {
    stats.byService[trace.service] = (stats.byService[trace.service] || 0) + 1;
    stats.byStatus[trace.status]++;
    totalDuration += trace.duration;
    if (trace.timestamp >= oneDayAgo) stats.last24h++;
  }

  if (traces.length > 0) {
    stats.avgDuration = totalDuration / traces.length;
  }

  res.json(stats);
});

// ============================================
// HEALTH & INFO
// ============================================

/**
 * GET /health - Health check
 */
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'REZ Observability Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    stats: {
      metrics: metrics.length,
      logs: logs.length,
      traces: traces.length,
    },
  });
});

/**
 * GET / - Service info
 */
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'REZ Observability Platform',
    version: '1.0.0',
    description: 'Centralized metrics, logging, and tracing for REZ ecosystem',
    endpoints: {
      metrics: {
        'POST /api/metrics': 'Record a metric',
        'GET /api/metrics': 'Get all metrics',
        'GET /api/metrics/:name': 'Get specific metric',
        'GET /api/metrics/summary': 'Get aggregated summary',
      },
      logs: {
        'POST /api/logs': 'Ingest a log',
        'GET /api/logs': 'Query logs',
        'GET /api/logs/stats': 'Get log statistics',
      },
      traces: {
        'POST /api/traces': 'Record a trace',
        'GET /api/traces': 'Query traces',
        'GET /api/traces/:traceId': 'Get full trace tree',
        'GET /api/traces/stats': 'Get trace statistics',
      },
      health: {
        'GET /health': 'Health check',
        'GET /': 'Service info',
      },
    },
    usage: {
      metrics: `${metrics.length} entries`,
      logs: `${logs.length} entries`,
      traces: `${traces.length} entries`,
    },
  });
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  logger.info(`REZ Observability Platform running on port ${PORT}`);
  logger.info(`  Metrics: http://localhost:${PORT}/api/metrics`);
  logger.info(`  Logs: http://localhost:${PORT}/api/logs`);
  logger.info(`  Traces: http://localhost:${PORT}/api/traces`);
  logger.info(`  Health: http://localhost:${PORT}/health`);
});

export { app };
