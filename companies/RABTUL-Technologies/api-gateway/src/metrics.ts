import { Request, Response, NextFunction } from 'express';

interface Metrics {
  requests: number;
  errors: number;
  latency: number;
  byEndpoint: Record<string, number>;
  byStatus: Record<string, number>;
}

const metrics: Metrics = {
  requests: 0,
  errors: 0,
  latency: 0,
  byEndpoint: {},
  byStatus: {}
};

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  metrics.requests++;

  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.latency = duration;
    const path = req.path;
    metrics.byEndpoint[path] = (metrics.byEndpoint[path] || 0) + 1;
    const status = res.statusCode.toString();
    metrics.byStatus[status] = (metrics.byStatus[status] || 0) + 1;
    if (res.statusCode >= 400) {
      metrics.errors++;
    }
  });

  next();
}

export function getMetrics() {
  return {
    ...metrics,
    errorRate: metrics.errors / metrics.requests
  };
}

export function resetMetrics() {
  metrics.requests = 0;
  metrics.errors = 0;
  metrics.latency = 0;
  metrics.byEndpoint = {};
  metrics.byStatus = {};
}
