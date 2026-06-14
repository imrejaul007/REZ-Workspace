import { Request, Response, NextFunction } from 'express';

interface MetricData { requests: number; errors: number; latency: number; lastRequest: Date; }
const metrics: Record<string, MetricData> = {};

export const trackRequest = (endpoint: string, latency: number, statusCode: number) => {
  if (!metrics[endpoint]) metrics[endpoint] = { requests: 0, errors: 0, latency: 0, lastRequest: new Date() };
  metrics[endpoint].requests++;
  metrics[endpoint].latency = (metrics[endpoint].latency * (metrics[endpoint].requests - 1) + latency) / metrics[endpoint].requests;
  metrics[endpoint].lastRequest = new Date();
  if (statusCode >= 400) metrics[endpoint].errors++;
};

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  res.on('finish', () => trackRequest(req.path, Date.now() - startTime, res.statusCode));
  next();
};

export const getMetrics = () => ({
  endpoints: metrics,
  totalRequests: Object.values(metrics).reduce((sum, m) => sum + m.requests, 0),
  totalErrors: Object.values(metrics).reduce((sum, m) => sum + m.errors, 0),
  uptime: process.uptime()
});