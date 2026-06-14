import { Registry, Counter, Histogram, Gauge } from 'prom-client';

const register = new Registry();

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const segmentsCreated = new Counter({
  name: 'segments_created_total',
  help: 'Total number of segments created',
  registers: [register],
});

export const segmentEvaluations = new Counter({
  name: 'segment_evaluations_total',
  help: 'Total number of segment evaluations',
  labelNames: ['segment_id'],
  registers: [register],
});

export const activeSegments = new Gauge({
  name: 'active_segments',
  help: 'Number of currently active segments',
  registers: [register],
});

export const memberCount = new Gauge({
  name: 'segment_member_count',
  help: 'Number of members in segments',
  labelNames: ['segment_id'],
  registers: [register],
});

export { register };