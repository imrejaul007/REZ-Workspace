import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

const register = new client.Registry();
client.collectDefaultMetrics({ register });

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const workflowOperationsTotal = new client.Counter({
  name: 'workflow_operations_total',
  help: 'Total number of workflow operations',
  labelNames: ['operation', 'status']
});

export const activeWorkflowsGauge = new client.Gauge({
  name: 'active_workflows_total',
  help: 'Number of active workflows',
  labelNames: ['status']
});

export const workflowDuration = new client.Histogram({
  name: 'workflow_completion_duration_seconds',
  help: 'Time to complete workflows',
  labelNames: ['type'],
  buckets: [60, 300, 900, 1800, 3600, 7200, 14400, 28800, 86400]
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(workflowOperationsTotal);
register.registerMetric(activeWorkflowsGauge);
register.registerMetric(workflowDuration);

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path;
    httpRequestDuration.labels(req.method, route, res.statusCode.toString()).observe(duration);
    httpRequestsTotal.labels(req.method, route, res.statusCode.toString()).inc();
  });
  next();
};

export const metricsRoute = async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end();
  }
};

export const recordWorkflowOperation = (operation: string, status: string) => {
  workflowOperationsTotal.labels(operation, status).inc();
};

export const updateWorkflowMetrics = async () => {
  const { Workflow } = await import('../models/Workflow');
  const counts = await Workflow.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  const resetValues: Record<string, number> = {};
  counts.forEach(({ _id, count }) => {
    activeWorkflowsGauge.labels(_id).set(count);
  });
};

export { register };