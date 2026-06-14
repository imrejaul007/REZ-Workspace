import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Create a Registry
const register = new client.Registry();

// Add default metrics
client.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

export const streamingMetrics = {
  activeStreams: new client.Gauge({
    name: 'ott_active_streams_total',
    help: 'Number of currently active streams',
    registers: [register],
  }),

  totalEvents: new client.Counter({
    name: 'ott_playback_events_total',
    help: 'Total number of playback events',
    labelNames: ['event_type'],
    registers: [register],
  }),

  drmLicenseRequests: new client.Counter({
    name: 'ott_drm_license_requests_total',
    help: 'Total DRM license requests',
    labelNames: ['drm_type', 'status'],
    registers: [register],
  }),

  heartbeatRate: new client.Counter({
    name: 'ott_heartbeat_total',
    help: 'Total heartbeat messages received',
    registers: [register],
  }),

  streamLatency: new client.Histogram({
    name: 'ott_stream_latency_seconds',
    help: 'Stream manifest fetch latency',
    labelNames: ['cdn'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [register],
  }),

  qualityDistribution: new client.Gauge({
    name: 'ott_quality_distribution',
    help: 'Distribution of stream qualities',
    labelNames: ['quality'],
    registers: [register],
  }),
};

export function metricsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const path = req.route?.path || req.path;

    httpRequestsTotal.inc({
      method: req.method,
      path,
      status: res.statusCode,
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        path,
        status: res.statusCode,
      },
      duration
    );
  });

  next();
}

export async function getMetrics(): Promise<string> {
  return register.metrics();
}

export function getContentType(): string {
  return register.contentType;
}

export { register };