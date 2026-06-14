import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

// Create a custom registry
export const register = new Registry();

// Add default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register });

// HTTP request metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Business metrics
export const conferencesCreated = new Counter({
  name: 'conferences_created_total',
  help: 'Total number of conferences created',
  labelNames: ['industry']
});

export const speakersAdded = new Counter({
  name: 'speakers_added_total',
  help: 'Total number of speakers added',
  labelNames: ['conference_id']
});

export const sessionsCreated = new Counter({
  name: 'sessions_created_total',
  help: 'Total number of sessions created',
  labelNames: ['conference_id', 'type']
});

export const registrationsTotal = new Counter({
  name: 'conference_registrations_total',
  help: 'Total number of conference registrations',
  labelNames: ['conference_id']
});

// Gauge metrics
export const activeConferences = new Gauge({
  name: 'active_conferences_count',
  help: 'Number of active conferences',
  labelNames: ['status']
});

export const upcomingConferences = new Gauge({
  name: 'upcoming_conferences_count',
  help: 'Number of upcoming conferences'
});

// Analytics metrics
export const analyticsQueries = new Counter({
  name: 'analytics_queries_total',
  help: 'Total number of analytics queries',
  labelNames: ['type']
});

export const targetingQueries = new Counter({
  name: 'targeting_queries_total',
  help: 'Total number of ad targeting queries',
  labelNames: ['industry']
});

// Database metrics
export const dbOperationDuration = new Histogram({
  name: 'db_operation_duration_seconds',
  help: 'Duration of database operations in seconds',
  labelNames: ['operation', 'collection'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

// Redis metrics
export const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['key_prefix']
});

export const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['key_prefix']
});

// Register all metrics
register.register(httpRequestDuration);
register.register(httpRequestTotal);
register.register(conferencesCreated);
register.register(speakersAdded);
register.register(sessionsCreated);
register.register(registrationsTotal);
register.register(activeConferences);
register.register(upcomingConferences);
register.register(analyticsQueries);
register.register(targetingQueries);
register.register(dbOperationDuration);
register.register(cacheHits);
register.register(cacheMisses);

export default register;
